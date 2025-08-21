/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { useHistory, useParams } from 'react-router-dom';
import type { IKbnUrlStateStorage } from '@kbn/kibana-utils-plugin/public';
import { createKbnUrlStateStorage, withNotifyOnErrors } from '@kbn/kibana-utils-plugin/public';
import { useEffect, useState } from 'react';
import React from 'react';
import useUnmount from 'react-use/lib/useUnmount';
import type { AppMountParameters } from '@kbn/core/public';
import { i18n } from '@kbn/i18n';
import { useDiscoverServices } from '../../hooks/use_discover_services';
import type { CustomizationCallback, DiscoverCustomizationContext } from '../../customizations';
import {
  type DiscoverInternalState,
  InternalStateProvider,
  internalStateActions,
} from './state_management/redux';
import type { RootProfileState } from '../../context_awareness';
import { useRootProfile, useDefaultAdHocDataViews } from '../../context_awareness';
import { DiscoverError } from '../../components/common/error_alert';
import type { SingleTabViewProps } from './components/single_tab_view';
import { BrandedLoadingIndicator, SingleTabView, NoDataPage } from './components/single_tab_view';
import { useAsyncFunction } from './hooks/use_async_function';
import { TabsView } from './components/tabs_view';
import { TABS_ENABLED_FEATURE_FLAG_KEY } from '../../constants';
import { ChartPortalsRenderer } from './components/chart';
import { useStateManagers } from './state_management/hooks/use_state_managers';

export interface MainRouteProps {
  customizationContext: DiscoverCustomizationContext;
  customizationCallbacks?: CustomizationCallback[];
  stateStorageContainer?: IKbnUrlStateStorage;
  onAppLeave?: AppMountParameters['onAppLeave'];
}

type InitializeMainRoute = (
  rootProfileState: Extract<RootProfileState, { rootProfileLoading: false }>
) => Promise<DiscoverInternalState['initializationState']>;

const defaultCustomizationCallbacks: CustomizationCallback[] = [];

export const DiscoverMainRoute = ({
  customizationContext,
  customizationCallbacks = defaultCustomizationCallbacks,
  stateStorageContainer,
  onAppLeave,
}: MainRouteProps) => {
  const services = useDiscoverServices();
  const tabsEnabled = services.core.featureFlags.getBooleanValue(
    TABS_ENABLED_FEATURE_FLAG_KEY,
    false
  );
  const rootProfileState = useRootProfile();
  const history = useHistory();
  const [urlStateStorage] = useState(
    () =>
      stateStorageContainer ??
      createKbnUrlStateStorage({
        useHash: services.uiSettings.get('state:storeInSessionStorage'),
        history,
        useHashQuery: customizationContext.displayMode !== 'embedded',
        ...withNotifyOnErrors(services.core.notifications.toasts),
      })
  );

  const { internalState, runtimeStateManager } = useStateManagers({
    services,
    urlStateStorage,
    customizationContext,
  });
  const { initializeProfileDataViews } = useDefaultAdHocDataViews({ internalState });
  const [mainRouteInitializationState, initializeMainRoute] = useAsyncFunction<InitializeMainRoute>(
    async (loadedRootProfileState) => {
      const { dataViews } = services;
      const [hasESData, hasUserDataView, defaultDataViewExists] = await Promise.all([
        dataViews.hasData.hasESData().catch(() => false),
        dataViews.hasData.hasUserDataView().catch(() => false),
        dataViews.defaultDataViewExists().catch(() => false),
        internalState.dispatch(internalStateActions.loadDataViewList()).catch(() => {}),
        initializeProfileDataViews(loadedRootProfileState).catch(() => {}),
      ]);
      const initializationState: DiscoverInternalState['initializationState'] = {
        hasESData,
        hasUserDataView: hasUserDataView && defaultDataViewExists,
      };

      internalState.dispatch(internalStateActions.setInitializationState(initializationState));

      return initializationState;
    }
  );

  const { id: currentDiscoverSessionId } = useParams<{ id?: string }>();
  const [tabsInitializationState, initializeTabs] = useAsyncFunction(
    async (discoverSessionId: string | undefined) => {
      await internalState.dispatch(internalStateActions.initializeTabs({ discoverSessionId }));
    }
  );

  useEffect(() => {
    if (!rootProfileState.rootProfileLoading) {
      initializeMainRoute(rootProfileState);
    }
  }, [initializeMainRoute, rootProfileState]);

  useEffect(() => {
    onAppLeave?.((actions) => {
      const tabs = runtimeStateManager.tabs.byId;
      const hasAnyUnsavedTab = Object.values(tabs).some((tab) => {
        const stateContainer = tab.stateContainer$.getValue();
        if (!stateContainer) {
          return false;
        }

        const isSaved = !!stateContainer.savedSearchState.getId();
        const hasChanged = stateContainer.savedSearchState.getHasChanged$().getValue();

        return isSaved && hasChanged;
      });

      if (!hasAnyUnsavedTab) return actions.default();

      return actions.confirm(
        i18n.translate('discover.confirmModal.confirmTextDescription', {
          defaultMessage:
            "You'll lose unsaved changes if you open another Discover session before returning to this one.",
        }),
        i18n.translate('discover.confirmModal.title', {
          defaultMessage: 'Unsaved changes',
        }),
        () => {},
        i18n.translate('discover.confirmModal.confirmText', {
          defaultMessage: 'Leave without saving',
        }),
        'danger'
      );
    });
  }, [onAppLeave, runtimeStateManager]);

  useEffect(() => {
    initializeTabs(currentDiscoverSessionId);
  }, [currentDiscoverSessionId, initializeTabs]);

  useUnmount(() => {
    for (const tabId of Object.keys(runtimeStateManager.tabs.byId)) {
      internalState.dispatch(internalStateActions.disconnectTab({ tabId }));
    }
  });

  const isLoading =
    rootProfileState.rootProfileLoading ||
    mainRouteInitializationState.loading ||
    tabsInitializationState.loading;

  if (isLoading) {
    return <BrandedLoadingIndicator />;
  }

  const error = mainRouteInitializationState.error || tabsInitializationState.error;

  if (error) {
    return <DiscoverError error={error} />;
  }

  if (
    !mainRouteInitializationState.value.hasESData &&
    !mainRouteInitializationState.value.hasUserDataView
  ) {
    return (
      <NoDataPage
        {...mainRouteInitializationState.value}
        onDataViewCreated={() => {
          // This is unused if there is no ES data
        }}
      />
    );
  }

  const singleTabProps: SingleTabViewProps = {
    customizationContext,
    customizationCallbacks,
    urlStateStorage,
    internalState,
    runtimeStateManager,
  };

  return (
    <InternalStateProvider store={internalState}>
      <rootProfileState.AppWrapper>
        <ChartPortalsRenderer runtimeStateManager={singleTabProps.runtimeStateManager}>
          {tabsEnabled ? <TabsView {...singleTabProps} /> : <SingleTabView {...singleTabProps} />}
        </ChartPortalsRenderer>
      </rootProfileState.AppWrapper>
    </InternalStateProvider>
  );
};
