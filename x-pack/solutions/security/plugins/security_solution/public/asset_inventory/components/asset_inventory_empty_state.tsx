/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { EuiImage, EuiEmptyPrompt, EuiButton, EuiLink, useEuiTheme } from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import { FormattedMessage } from '@kbn/i18n-react';
import { css } from '@emotion/react';
import illustration from '../../common/images/illustration_product_no_results_magnifying_glass.svg';
import { DOCS_URL, TEST_SUBJ_EMPTY_STATE } from '../constants';

export const AssetInventoryEmptyState = ({ onResetFilters }: { onResetFilters: () => void }) => {
  const { euiTheme } = useEuiTheme();

  return (
    <EuiEmptyPrompt
      css={css`
        max-width: 734px;
        && > .euiEmptyPrompt__main {
          gap: ${euiTheme.size.xl};
        }
        && {
          margin-top: ${euiTheme.size.xxxl}};
        }
      `}
      data-test-subj={TEST_SUBJ_EMPTY_STATE}
      icon={
        <EuiImage
          url={illustration}
          alt={i18n.translate('xpack.securitySolution.assetInventory.emptyState.illustrationAlt', {
            defaultMessage: 'No results',
          })}
          css={css`
            width: 290px;
          `}
        />
      }
      title={
        <h2>
          <FormattedMessage
            id="xpack.securitySolution.assetInventory.emptyState.title"
            defaultMessage="No results match your search criteria"
          />
        </h2>
      }
      layout="horizontal"
      color="plain"
      body={
        <>
          <p>
            <FormattedMessage
              id="xpack.securitySolution.assetInventory.emptyState.description"
              defaultMessage="Try modifying your search or filter set"
            />
          </p>
        </>
      }
      actions={[
        <EuiButton color="primary" fill onClick={onResetFilters}>
          <FormattedMessage
            id="xpack.securitySolution.assetInventory.emptyState.resetFiltersButton"
            defaultMessage="Reset filters"
          />
        </EuiButton>,
        <EuiLink href={DOCS_URL} target="_blank">
          <FormattedMessage
            id="xpack.securitySolution.assetInventory.emptyState.readDocsLink"
            defaultMessage="Read the docs"
          />
        </EuiLink>,
      ]}
    />
  );
};
