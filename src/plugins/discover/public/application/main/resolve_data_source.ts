/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { DataView } from '@kbn/data-views-plugin/common';
import { DiscoverServices } from '../../build_services';

interface DefaultDiscoverDataSource {
  type: 'default';
}

interface AllLogsDataSource {
  type: 'all-logs';
}

interface LogDataSetDataSource {
  type: 'log-dataset';
  params: { integrationId?: string; datasetId: string };
}

interface DataViewDataSource {
  type: 'data-view';
  params: { dataViewId: string };
}

export type DiscoverDataSource =
  | DefaultDiscoverDataSource
  | DataViewDataSource
  | AllLogsDataSource
  | LogDataSetDataSource;

type ResolvedDataSource =
  | { profile: 'default'; dataView: DataView }
  | { profile: 'logs'; dataView: DataView };

export async function resolveDataSource({
  dataSource,
  services,
}: {
  dataSource: DiscoverDataSource;
  services: DiscoverServices;
}): Promise<ResolvedDataSource> {
  let dataView: DataView;

  if (dataSource.type === 'default') {
    dataView = await services.dataViews.getDefaultDataView()!;
  } else if (dataSource.type === 'data-view') {
    dataView = await services.dataViews.get(dataSource.params.dataViewId);
  } else if (dataSource.type === 'all-logs') {
    dataView = await services.dataViews.create({ title: 'logs-*' });
  } else if (dataSource.type === 'log-dataset') {
    // Determine dataview from log data set:
    dataView = await services.dataViews.create({
      title: `logs-${dataSource.params.datasetId}-*`,
    });
  }

  let profile: ResolvedDataSource['profile'];

  if (dataSource.type === 'all-logs' || dataSource.type === 'log-dataset') {
    profile = 'logs';
  } else {
    if (dataView.getIndexPattern().startsWith('logs-')) {
      profile = 'logs';
    } else {
      profile = 'default';
    }
  }

  return { profile, dataView };
}
