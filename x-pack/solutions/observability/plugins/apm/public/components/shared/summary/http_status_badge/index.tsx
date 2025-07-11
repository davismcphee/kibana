/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { i18n } from '@kbn/i18n';
import { EuiToolTip, EuiBadge } from '@elastic/eui';
import { statusCodes } from './status_codes';
import { useGetStatusColor } from '../../../../utils/http_status_code_to_color';

interface HttpStatusBadgeProps {
  status: number;
}
export function HttpStatusBadge({ status }: HttpStatusBadgeProps) {
  const label = i18n.translate('xpack.apm.transactionDetails.statusCode', {
    defaultMessage: 'Status code',
  });
  return (
    <EuiToolTip content={label}>
      <EuiBadge color={useGetStatusColor(status) || 'default'} data-test-subj="httpStatusBadge">
        <span data-test-subj="apmHttpStatusBadge">
          {status} {statusCodes[status.toString()]}
        </span>
      </EuiBadge>
    </EuiToolTip>
  );
}
