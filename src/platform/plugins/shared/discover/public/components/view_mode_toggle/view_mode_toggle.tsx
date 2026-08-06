/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import type { ReactElement } from 'react';
import React, { useMemo, useEffect, useState, useCallback } from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiLoadingSpinner } from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import { css } from '@emotion/react';
import { SHOW_FIELD_STATISTICS } from '@kbn/discover-utils';
import type { DataView } from '@kbn/data-views-plugin/common';
import useMountedState from 'react-use/lib/useMountedState';
import { ToolbarSelector, type SelectableEntry } from '@kbn/shared-ux-toolbar-selector';
import { VIEW_MODE } from '../../../common/constants';
import { useDiscoverServices } from '../../hooks/use_discover_services';
import { HitsCounter, type HitsCounterVariant } from '../hits_counter';

export interface RenderViewModeToggleOptions {
  /** Filled in by the (cross-plugin) Pattern Analysis tab once it knows how many patterns it found. */
  patternCount?: number;
  /** Lets a caller like the ES|QL cascade layout ask for "groups" wording instead of the default documents/results. */
  hitsCounterVariant?: HitsCounterVariant;
}

/** Builds a `DocumentViewModeToggle` element. */
export type RenderViewModeToggle = (options?: RenderViewModeToggleOptions) => ReactElement;

export const DocumentViewModeToggle = ({
  viewMode,
  isEsqlMode,
  prepend,
  setDiscoverViewMode,
  patternCount,
  fieldsCount,
  hitsCounterVariant,
  dataView,
}: {
  viewMode: VIEW_MODE;
  isEsqlMode: boolean;
  prepend?: ReactElement;
  setDiscoverViewMode: (viewMode: VIEW_MODE, replace?: boolean) => Promise<VIEW_MODE>;
  patternCount?: number;
  fieldsCount?: number;
  hitsCounterVariant?: HitsCounterVariant;
  dataView: DataView;
}) => {
  const {
    uiSettings,
    dataVisualizer: dataVisualizerService,
    aiops: aiopsService,
  } = useDiscoverServices();

  const [showPatternAnalysisTab, setShowPatternAnalysisTab] = useState<boolean | null>(null);
  const showFieldStatisticsTab = useMemo(
    () =>
      // If user opens saved search with field stats in ES|QL,
      // we show the toggle with the mode disabled so user can switch to document view
      // instead of auto-directing
      (viewMode === VIEW_MODE.AGGREGATED_LEVEL && isEsqlMode) ||
      (!isEsqlMode && uiSettings.get(SHOW_FIELD_STATISTICS) && dataVisualizerService !== undefined),
    [dataVisualizerService, uiSettings, isEsqlMode, viewMode]
  );
  const isMounted = useMountedState();

  const setShowPatternAnalysisTabWrapper = useCallback(
    (value: boolean) => {
      if (isMounted()) {
        setShowPatternAnalysisTab(value);
      }
    },
    [isMounted]
  );

  useEffect(
    function checkForPatternAnalysis() {
      if (!aiopsService || isEsqlMode) {
        setShowPatternAnalysisTab(false);
        return;
      }
      aiopsService
        .getPatternAnalysisAvailable()
        .then((patternAnalysisAvailable) => {
          const available = patternAnalysisAvailable(dataView);
          setShowPatternAnalysisTabWrapper(available);
        })
        .catch(() => setShowPatternAnalysisTabWrapper(false));
    },
    [aiopsService, dataView, isEsqlMode, setShowPatternAnalysisTabWrapper]
  );

  useEffect(() => {
    if (showPatternAnalysisTab === false && viewMode === VIEW_MODE.PATTERN_LEVEL) {
      // switch to document view if no text fields are available
      setDiscoverViewMode(VIEW_MODE.DOCUMENT_LEVEL, true);
    }
  }, [showPatternAnalysisTab, viewMode, setDiscoverViewMode]);

  useEffect(() => {
    if (viewMode === VIEW_MODE.AGGREGATED_LEVEL && isEsqlMode) {
      setDiscoverViewMode(VIEW_MODE.DOCUMENT_LEVEL, true);
    }
  }, [viewMode, isEsqlMode, setDiscoverViewMode]);

  const documentsLabel = isEsqlMode
    ? i18n.translate('discover.viewModes.esql.label', { defaultMessage: 'Results' })
    : i18n.translate('discover.viewModes.document.label', { defaultMessage: 'Documents' });
  const patternsLabel = i18n.translate('discover.viewModes.patternAnalysis.label', {
    defaultMessage: 'Patterns',
  });
  const fieldStatisticsLabel = i18n.translate('discover.viewModes.fieldStatistics.label', {
    defaultMessage: 'Field statistics',
  });

  const options = useMemo<SelectableEntry[]>(() => {
    const entries: SelectableEntry[] = [
      {
        key: VIEW_MODE.DOCUMENT_LEVEL,
        value: VIEW_MODE.DOCUMENT_LEVEL,
        label: documentsLabel,
        checked: viewMode === VIEW_MODE.DOCUMENT_LEVEL ? 'on' : undefined,
        'data-test-subj': 'dscViewModeDocumentOption',
      },
    ];

    if (showPatternAnalysisTab) {
      entries.push({
        key: VIEW_MODE.PATTERN_LEVEL,
        value: VIEW_MODE.PATTERN_LEVEL,
        label: patternsLabel,
        checked: viewMode === VIEW_MODE.PATTERN_LEVEL ? 'on' : undefined,
        'data-test-subj': 'dscViewModePatternAnalysisOption',
      });
    }

    if (showFieldStatisticsTab) {
      entries.push({
        key: VIEW_MODE.AGGREGATED_LEVEL,
        value: VIEW_MODE.AGGREGATED_LEVEL,
        label: fieldStatisticsLabel,
        disabled: isEsqlMode,
        checked: viewMode === VIEW_MODE.AGGREGATED_LEVEL ? 'on' : undefined,
        'data-test-subj': 'dscViewModeFieldStatsOption',
      });
    }

    return entries;
  }, [
    documentsLabel,
    patternsLabel,
    fieldStatisticsLabel,
    showPatternAnalysisTab,
    showFieldStatisticsTab,
    viewMode,
    isEsqlMode,
  ]);

  const buttonText =
    viewMode === VIEW_MODE.PATTERN_LEVEL
      ? patternsLabel
      : viewMode === VIEW_MODE.AGGREGATED_LEVEL
      ? fieldStatisticsLabel
      : documentsLabel;

  const onChange = useCallback(
    (chosen?: SelectableEntry) => {
      if (chosen?.value) {
        setDiscoverViewMode(chosen.value as VIEW_MODE);
      }
    },
    [setDiscoverViewMode]
  );

  // if neither the pattern analysis nor field statistics view is available, there's only
  // one possible view (Documents/Results), so there's nothing to select between
  const showOnlyDocumentsCounter =
    showFieldStatisticsTab === false && showPatternAnalysisTab === false;

  const countInButton = useMemo(() => {
    if (viewMode === VIEW_MODE.PATTERN_LEVEL) {
      return patternCount === undefined ? (
        <EuiLoadingSpinner size="m" />
      ) : (
        <span data-test-subj="dscViewModePatternCount">({patternCount})</span>
      );
    }

    if (viewMode === VIEW_MODE.AGGREGATED_LEVEL) {
      return fieldsCount === undefined ? (
        <EuiLoadingSpinner size="m" />
      ) : (
        <span data-test-subj="dscViewModeFieldsCount">({fieldsCount})</span>
      );
    }

    return (
      <HitsCounter
        variant={hitsCounterVariant ?? (isEsqlMode ? 'results' : 'documents')}
        format="parenthetical"
      />
    );
  }, [viewMode, patternCount, fieldsCount, isEsqlMode, hitsCounterVariant]);

  // e.g. "Documents (4)", "Patterns (36)", "Field statistics (12)"
  const buttonLabel = (
    <>
      {buttonText} {countInButton}
    </>
  );

  return (
    <EuiFlexGroup direction="row" gutterSize="s" alignItems="center" responsive={false}>
      {prepend && (
        <EuiFlexItem
          grow={false}
          css={css`
            &:empty {
              display: none;
            }
          `}
        >
          {prepend}
        </EuiFlexItem>
      )}
      {showOnlyDocumentsCounter ? (
        <EuiFlexItem grow={false}>
          <HitsCounter
            variant={hitsCounterVariant ?? (isEsqlMode ? 'results' : 'documents')}
          />
        </EuiFlexItem>
      ) : (
        <EuiFlexItem grow={false}>
          <ToolbarSelector
            data-test-subj="dscViewModeToggle"
            data-selected-value={viewMode}
            searchable={false}
            buttonType="text"
            buttonFlush="left"
            buttonFontWeight="semiBold"
            buttonSize="s"
            buttonLabel={buttonLabel}
            showOptionIcons={false}
            popoverTitle={i18n.translate('discover.viewModes.popoverTitle', {
              defaultMessage: 'Select view',
            })}
            options={options}
            onChange={onChange}
          />
        </EuiFlexItem>
      )}
    </EuiFlexGroup>
  );
};
