/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { FC, PropsWithChildren } from 'react';
import url from 'url';
import { EuiButtonEmpty } from '@elastic/eui';
import rison from '@kbn/rison';
import { getMLJobId } from '../../../../../common/lib';

interface Props {
  monitorId: string;
  basePath: string;
  dateRange: {
    to: string;
    from: string;
  };
}

export const getMLJobLinkHref = ({ basePath, monitorId, dateRange }: Props) => {
  const query = {
    ml: { jobIds: [getMLJobId(monitorId)] },
    refreshInterval: { pause: true, value: 0 },
    time: dateRange,
  };

  const queryParams = {
    mlExplorerFilter: {
      filterActive: true,
      filteredFields: ['monitor.id', monitorId],
    },
    mlExplorerSwimlane: {
      viewByFieldName: 'observer.geo.name',
    },
  };

  const path = '/explorer';

  return url.format({
    pathname: basePath + '/app/ml',
    hash:
      `${path}?_g=${rison.encode(query)}` + (monitorId ? `&_a=${rison.encode(queryParams)}` : ''),
  });
};

export const MLJobLink: FC<PropsWithChildren<Props>> = ({
  basePath,
  monitorId,
  dateRange,
  children,
}) => {
  const href = getMLJobLinkHref({ basePath, monitorId, dateRange });
  return (
    <EuiButtonEmpty
      data-test-subj="syntheticsMLJobLinkButton"
      children={children}
      size="s"
      href={href}
      target="_blank"
    />
  );
};
