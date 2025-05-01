/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import React, { useEffect, useRef } from 'react';
import { i18n } from '@kbn/i18n';
import {
  UnifiedDocViewerLogsOverview,
  type UnifiedDocViewerLogsOverviewApi,
} from '@kbn/unified-doc-viewer-plugin/public';
import useObservable from 'react-use/lib/useObservable';
import useUnmount from 'react-use/lib/useUnmount';
import { isEqual } from 'lodash';
import type { ProfileProviderServices } from '../../../profile_provider_services';
import type { LogDocumentProfileProvider } from '../profile';

export const createGetDocViewer =
  (services: ProfileProviderServices): LogDocumentProfileProvider['profile']['getDocViewer'] =>
  (prev, { context }) =>
  (params) => {
    const prevDocViewer = prev(params);

    const logsAIAssistantFeature = services.discoverShared.features.registry.getById(
      'observability-logs-ai-assistant'
    );

    const streamsFeature = services.discoverShared.features.registry.getById('streams');

    return {
      ...prevDocViewer,
      docViewsRegistry: (registry) => {
        registry.add({
          id: 'doc_view_logs_overview',
          title: i18n.translate('discover.docViews.logsOverview.title', {
            defaultMessage: 'Log overview',
          }),
          order: 0,
          component: function LogOverviewTab(props) {
            const logsOverviewApi = useRef<UnifiedDocViewerLogsOverviewApi | null>(null);
            const overviewContext = useObservable(
              context.logOverviewContext$,
              context.logOverviewContext$.getValue()
            );

            useEffect(() => {
              if (overviewContext?.initialAccordionSection) {
                logsOverviewApi.current?.scrollToSection(overviewContext.initialAccordionSection);
              }
            }, [overviewContext]);

            useUnmount(() => {
              const currentOverviewContext = context.logOverviewContext$.getValue();
              if (isEqual(currentOverviewContext, overviewContext)) {
                context.logOverviewContext$.next(undefined);
              }
            });

            const accordionState = React.useMemo(() => {
              return overviewContext?.recordId === props.hit.id &&
                overviewContext?.initialAccordionSection
                ? { [overviewContext.initialAccordionSection]: true }
                : {};
            }, [overviewContext, props.hit.id]);

            return (
              <UnifiedDocViewerLogsOverview
                {...props}
                ref={(api) => {
                  if (api && overviewContext?.initialAccordionSection) {
                    api.scrollToSection(overviewContext.initialAccordionSection);
                  }
                  logsOverviewApi.current = api;
                }}
                docViewerAccordionState={accordionState}
                renderAIAssistant={logsAIAssistantFeature?.render}
                renderStreamsField={streamsFeature?.renderStreamsField}
              />
            );
          },
        });

        return prevDocViewer.docViewsRegistry(registry);
      },
    };
  };
