/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { TypeOf } from '@kbn/config-schema';
import { schema } from '@kbn/config-schema';
import type { Logger } from '@kbn/core/server';
import {
  DEFAULT_MICROSOFT_EXCHANGE_URL,
  DEFAULT_MICROSOFT_GRAPH_API_SCOPE,
  DEFAULT_MICROSOFT_GRAPH_API_URL,
} from '../common';
import { validateDuration } from './lib/parse_date';

export enum AllowedHosts {
  Any = '*',
}

export enum EnabledActionTypes {
  Any = '*',
}

const MAX_MAX_ATTEMPTS = 10;
const MIN_MAX_ATTEMPTS = 1;

const MIN_QUEUED_MAX = 1;
export const DEFAULT_QUEUED_MAX = 1000000;

const validRateLimiterConnectorTypeIds = new Set(['email']);

const preconfiguredActionSchema = schema.object({
  name: schema.string({ minLength: 1 }),
  actionTypeId: schema.string({ minLength: 1 }),
  config: schema.recordOf(schema.string(), schema.any(), { defaultValue: {} }),
  secrets: schema.recordOf(schema.string(), schema.any(), { defaultValue: {} }),
  exposeConfig: schema.maybe(schema.boolean({ defaultValue: false })),
});

const customHostSettingsSchema = schema.object({
  url: schema.string({ minLength: 1 }),
  smtp: schema.maybe(
    schema.object({
      ignoreTLS: schema.maybe(schema.boolean()),
      requireTLS: schema.maybe(schema.boolean()),
    })
  ),
  ssl: schema.maybe(
    schema.object({
      verificationMode: schema.maybe(
        schema.oneOf(
          [schema.literal('none'), schema.literal('certificate'), schema.literal('full')],
          { defaultValue: 'full' }
        )
      ),
      certificateAuthoritiesFiles: schema.maybe(
        schema.oneOf([
          schema.string({ minLength: 1 }),
          schema.arrayOf(schema.string({ minLength: 1 }), { minSize: 1 }),
        ])
      ),
      certificateAuthoritiesData: schema.maybe(schema.string({ minLength: 1 })),
    })
  ),
});

export type CustomHostSettings = TypeOf<typeof customHostSettingsSchema>;

const connectorTypeSchema = schema.object({
  id: schema.string(),
  maxAttempts: schema.maybe(schema.number({ min: MIN_MAX_ATTEMPTS, max: MAX_MAX_ATTEMPTS })),
});

// We leverage enabledActionTypes list by allowing the other plugins to overwrite it by using "setEnabledConnectorTypes" in the plugin setup.
// The list can be overwritten only if it's not already been set in the config.
const enabledConnectorTypesSchema = schema.arrayOf(
  schema.oneOf([schema.string(), schema.literal(EnabledActionTypes.Any)]),
  {
    defaultValue: [AllowedHosts.Any],
  }
);

const rateLimiterSchema = schema.recordOf(
  schema.string({
    validate: (value) => {
      if (!validRateLimiterConnectorTypeIds.has(value)) {
        return `Rate limiter configuration for connector type "${value}" is not supported. Supported types: ${Array.from(
          validRateLimiterConnectorTypeIds
        ).join(', ')}`;
      }
    },
  }),
  schema.object({
    lookbackWindow: schema.string({ defaultValue: '15m', validate: validateDuration }),
    limit: schema.number({ defaultValue: 500, min: 1, max: 5000 }),
  })
);

export const configSchema = schema.object({
  allowedHosts: schema.arrayOf(
    schema.oneOf([schema.string({ hostname: true }), schema.literal(AllowedHosts.Any)]),
    {
      defaultValue: [AllowedHosts.Any],
    }
  ),
  enabledActionTypes: enabledConnectorTypesSchema,
  preconfiguredAlertHistoryEsIndex: schema.boolean({ defaultValue: false }),
  preconfigured: schema.recordOf(schema.string(), preconfiguredActionSchema, {
    defaultValue: {},
    validate: validatePreconfigured,
  }),
  proxyUrl: schema.maybe(schema.string()),
  proxyHeaders: schema.maybe(schema.recordOf(schema.string(), schema.string())),
  proxyBypassHosts: schema.maybe(schema.arrayOf(schema.string({ hostname: true }))),
  proxyOnlyHosts: schema.maybe(schema.arrayOf(schema.string({ hostname: true }))),
  ssl: schema.maybe(
    schema.object({
      verificationMode: schema.maybe(
        schema.oneOf(
          [schema.literal('none'), schema.literal('certificate'), schema.literal('full')],
          { defaultValue: 'full' }
        )
      ),
      proxyVerificationMode: schema.maybe(
        schema.oneOf(
          [schema.literal('none'), schema.literal('certificate'), schema.literal('full')],
          { defaultValue: 'full' }
        )
      ),
    })
  ),
  maxResponseContentLength: schema.byteSize({ defaultValue: '1mb' }),
  responseTimeout: schema.duration({ defaultValue: '60s' }),
  customHostSettings: schema.maybe(schema.arrayOf(customHostSettingsSchema)),
  microsoftGraphApiUrl: schema.string({ defaultValue: DEFAULT_MICROSOFT_GRAPH_API_URL }),
  microsoftGraphApiScope: schema.string({ defaultValue: DEFAULT_MICROSOFT_GRAPH_API_SCOPE }),
  microsoftExchangeUrl: schema.string({ defaultValue: DEFAULT_MICROSOFT_EXCHANGE_URL }),
  email: schema.maybe(
    schema.object(
      {
        domain_allowlist: schema.maybe(schema.arrayOf(schema.string())),
        recipient_allowlist: schema.maybe(schema.arrayOf(schema.string(), { minSize: 1 })),
        services: schema.maybe(
          schema.object(
            {
              enabled: schema.maybe(
                schema.arrayOf(
                  schema.oneOf([
                    schema.literal('google-mail'),
                    schema.literal('microsoft-exchange'),
                    schema.literal('microsoft-outlook'),
                    schema.literal('amazon-ses'),
                    schema.literal('elastic-cloud'),
                    schema.literal('other'),
                    schema.literal('*'),
                  ]),
                  { minSize: 1 }
                )
              ),
              ses: schema.maybe(
                schema.object({
                  host: schema.string({ minLength: 1 }),
                  port: schema.number({ min: 1, max: 65535 }),
                })
              ),
            },
            {
              validate: (obj) => {
                if (obj && Object.keys(obj).length === 0) {
                  return 'email.services.enabled or email.services.ses must be defined';
                }
              },
            }
          )
        ),
      },
      {
        validate: (obj) => {
          if (obj && Object.keys(obj).length === 0) {
            return 'email.domain_allowlist, email.recipient_allowlist, or email.services must be defined';
          }

          if (obj?.domain_allowlist && obj?.recipient_allowlist) {
            return 'email.domain_allowlist and email.recipient_allowlist can not be used at the same time';
          }
        },
      }
    )
  ),
  run: schema.maybe(
    schema.object({
      maxAttempts: schema.maybe(schema.number({ min: MIN_MAX_ATTEMPTS, max: MAX_MAX_ATTEMPTS })),
      connectorTypeOverrides: schema.maybe(schema.arrayOf(connectorTypeSchema)),
    })
  ),
  enableFooterInEmail: schema.boolean({ defaultValue: true }),
  queued: schema.maybe(
    schema.object({
      max: schema.maybe(schema.number({ min: MIN_QUEUED_MAX, defaultValue: DEFAULT_QUEUED_MAX })),
    })
  ),
  usage: schema.maybe(
    schema.object({
      url: schema.maybe(schema.string()),
      enabled: schema.maybe(schema.boolean()),
      ca: schema.maybe(
        schema.object({
          path: schema.string(),
        })
      ),
    })
  ),
  webhook: schema.maybe(
    schema.object({
      ssl: schema.object({
        pfx: schema.object({
          enabled: schema.boolean({ defaultValue: true }),
        }),
      }),
    })
  ),
  rateLimiter: schema.maybe(rateLimiterSchema),
});

export type ActionsConfig = TypeOf<typeof configSchema>;
export type EnabledConnectorTypes = TypeOf<typeof enabledConnectorTypesSchema>;
export type ConnectorRateLimiterConfig = TypeOf<typeof rateLimiterSchema>;

// It would be nicer to add the proxyBypassHosts / proxyOnlyHosts restriction on
// simultaneous usage in the config validator directly, but there's no good way to express
// this relationship in the cloud config constraints, so we're doing it "live".
export function getValidatedConfig(logger: Logger, originalConfig: ActionsConfig): ActionsConfig {
  const proxyBypassHosts = originalConfig.proxyBypassHosts;
  const proxyOnlyHosts = originalConfig.proxyOnlyHosts;
  const proxyUrl = originalConfig.proxyUrl;

  if (proxyUrl) {
    try {
      new URL(proxyUrl);
    } catch (err) {
      logger.warn(`The configuration xpack.actions.proxyUrl: ${proxyUrl} is invalid.`);
    }
  }

  if (proxyBypassHosts && proxyOnlyHosts) {
    logger.warn(
      'The configurations xpack.actions.proxyBypassHosts and xpack.actions.proxyOnlyHosts can not be used at the same time. The configuration xpack.actions.proxyOnlyHosts will be ignored.'
    );
    const tmp: Record<string, unknown> = originalConfig;
    delete tmp.proxyOnlyHosts;
    return tmp as ActionsConfig;
  }

  return originalConfig;
}

const invalidActionIds = new Set(['', '__proto__', 'constructor']);

function validatePreconfigured(preconfigured: Record<string, unknown>): string | undefined {
  // check for ids that should not be used
  for (const id of Object.keys(preconfigured)) {
    if (invalidActionIds.has(id)) {
      return `invalid preconfigured action id "${id}"`;
    }
  }

  // in case __proto__ was used as a preconfigured action id ...
  if (Object.getPrototypeOf(preconfigured) !== Object.getPrototypeOf({})) {
    return `invalid preconfigured action id "__proto__"`;
  }
}
