/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { i18n } from '@kbn/i18n';
import { TutorialsCategory } from '../../services/tutorials';
import {
  onPremInstructions,
  cloudInstructions,
  onPremCloudInstructions,
} from '../instructions/metricbeat_instructions';
import {
  TutorialContext,
  TutorialSchema,
} from '../../services/tutorials/lib/tutorials_registry_types';

export function natsMetricsSpecProvider(context: TutorialContext): TutorialSchema {
  const moduleName = 'nats';
  return {
    id: 'natsMetrics',
    name: i18n.translate('home.tutorials.natsMetrics.nameTitle', {
      defaultMessage: 'NATS Metrics',
    }),
    moduleName,
    category: TutorialsCategory.METRICS,
    shortDescription: i18n.translate('home.tutorials.natsMetrics.shortDescription', {
      defaultMessage: 'Collect metrics from NATS servers with Metricbeat.',
    }),
    longDescription: i18n.translate('home.tutorials.natsMetrics.longDescription', {
      defaultMessage:
        'The `nats` Metricbeat module fetches metrics from Nats. \
[Learn more]({learnMoreLink}).',
      values: {
        learnMoreLink: '{config.docs.beats.metricbeat}/metricbeat-module-nats.html',
      },
    }),
    euiIconType: context.staticAssets.getPluginAssetHref('/logos/nats.svg'),
    artifacts: {
      dashboards: [
        {
          id: 'Metricbeat-Nats-Dashboard-ecs',
          linkLabel: i18n.translate('home.tutorials.natsMetrics.artifacts.dashboards.linkLabel', {
            defaultMessage: 'NATS metrics dashboard',
          }),
          isOverview: true,
        },
      ],
      exportedFields: {
        documentationUrl: '{config.docs.beats.metricbeat}/exported-fields-nats.html',
      },
    },
    completionTimeMinutes: 10,
    previewImagePath: context.staticAssets.getPluginAssetHref('/nats_metrics/screenshot.webp'),
    onPrem: onPremInstructions(moduleName, context),
    elasticCloud: cloudInstructions(moduleName, context),
    onPremElasticCloud: onPremCloudInstructions(moduleName, context),
    integrationBrowserCategories: ['message_queue', 'observability'],
  };
}
