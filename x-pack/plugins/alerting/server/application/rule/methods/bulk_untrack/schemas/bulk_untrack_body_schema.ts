/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import { schema } from '@kbn/config-schema';

export const bulkUntrackBodySchema = schema.object({
  isUsingQuery: schema.boolean(),
  indices: schema.maybe(schema.arrayOf(schema.string())),
  alertUuids: schema.maybe(schema.arrayOf(schema.string())),
  query: schema.maybe(schema.arrayOf(schema.any())),
  ruleTypeIds: schema.maybe(schema.arrayOf(schema.string())),
});
