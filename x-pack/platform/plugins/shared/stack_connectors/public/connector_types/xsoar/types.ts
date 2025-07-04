/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { ActionTypeModel as ConnectorTypeModel } from '@kbn/triggers-actions-ui-plugin/public';
import type { Config, Secrets, ExecutorParams } from '../../../common/xsoar/types';

export type XSOARConnector = ConnectorTypeModel<Config, Secrets, ExecutorParams>;
