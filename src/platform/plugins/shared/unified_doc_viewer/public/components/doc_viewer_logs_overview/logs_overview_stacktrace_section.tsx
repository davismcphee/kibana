/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */
import { EuiAccordion, EuiHorizontalRule, EuiTitle, useGeneratedHtmlId } from '@elastic/eui';
import { DataTableRecord } from '@kbn/discover-utils';
import { i18n } from '@kbn/i18n';
import React, { forwardRef } from 'react';
import type { DataView } from '@kbn/data-views-plugin/public';
import { StacktraceContent } from './sub_components/stacktrace/stacktrace_content';
import { ScrollableSectionWrapperApi, useScrollableSection } from './use_scrollable_section';

const stacktraceAccordionTitle = i18n.translate(
  'unifiedDocViewer.docView.logsOverview.accordion.title.stacktrace',
  {
    defaultMessage: 'Stacktrace',
  }
);

export const LogsOverviewStacktraceSection = forwardRef<
  ScrollableSectionWrapperApi,
  {
    hit: DataTableRecord;
    dataView: DataView;
  }
>(({ hit, dataView }, ref) => {
  const accordionId = useGeneratedHtmlId({
    prefix: stacktraceAccordionTitle,
  });
  const { wrapperRef, forceState, onToggle } = useScrollableSection(ref);

  return (
    <div ref={wrapperRef}>
      <EuiAccordion
        id={accordionId}
        buttonContent={
          <EuiTitle size="xs">
            <p>{stacktraceAccordionTitle}</p>
          </EuiTitle>
        }
        paddingSize="m"
        forceState={forceState}
        onToggle={onToggle}
        data-test-subj="unifiedDocViewLogsOverviewStacktraceAccordion"
      >
        <StacktraceContent hit={hit} dataView={dataView} />
      </EuiAccordion>
      <EuiHorizontalRule margin="xs" />
    </div>
  );
});
