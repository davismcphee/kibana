/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { Moment } from 'moment';

import { TimeRange } from '@kbn/es-query';
import type { RefreshInterval } from '@kbn/data-service-server';

export interface TimefilterConfig {
  timeDefaults: TimeRange;
  refreshIntervalDefaults: RefreshInterval;
  minRefreshIntervalDefault: number;
}

// Timefilter accepts moment input but always returns string output
export type InputTimeRange =
  | TimeRange
  | {
      from: Moment | string;
      to: Moment | string;
    };

export type { TimeRangeBounds } from '../../../common';
