/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { PerformRulesBulkActionRequestBody } from './bulk_actions_route.gen';
import { BulkActionEditTypeEnum, BulkActionTypeEnum } from './bulk_actions_route.gen';

export const getBulkDisableRuleActionSchemaMock = (): PerformRulesBulkActionRequestBody => ({
  query: '',
  ids: undefined,
  action: BulkActionTypeEnum.disable,
});

export const getPerformBulkActionEditSchemaMock = (): PerformRulesBulkActionRequestBody => ({
  query: '',
  ids: undefined,
  action: BulkActionTypeEnum.edit,
  [BulkActionTypeEnum.edit]: [{ type: BulkActionEditTypeEnum.add_tags, value: ['tag1'] }],
});

export const getPerformBulkActionEditAlertSuppressionSchemaMock =
  (): PerformRulesBulkActionRequestBody => ({
    query: '',
    ids: undefined,
    action: BulkActionTypeEnum.edit,
    [BulkActionTypeEnum.edit]: [
      { type: BulkActionEditTypeEnum.set_alert_suppression, value: { group_by: ['field1'] } },
    ],
  });
