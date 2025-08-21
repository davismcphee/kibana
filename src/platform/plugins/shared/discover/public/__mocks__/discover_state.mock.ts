/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { createBrowserHistory } from 'history';
import { getDiscoverStateContainer } from '../application/main/state_management/discover_state';
import { savedSearchMockWithTimeField, savedSearchMock } from './saved_search';
import { discoverServiceMock } from './services';
import type { SavedSearch } from '@kbn/saved-search-plugin/public';
import { mockCustomizationContext } from '../customizations/__mocks__/customization_context';
import type { RuntimeStateManager } from '../application/main/state_management/redux';
import {
  createInternalStateStore,
  createRuntimeStateManager,
  selectTabRuntimeState,
} from '../application/main/state_management/redux';
import type { DiscoverServices, HistoryLocationState } from '../build_services';
import type { IKbnUrlStateStorage } from '@kbn/kibana-utils-plugin/public';
import { createKbnUrlStateStorage, withNotifyOnErrors } from '@kbn/kibana-utils-plugin/public';
import type { History } from 'history';
import type { DiscoverCustomizationContext } from '../customizations';
import { createCustomizationService } from '../customizations/customization_service';
import { createTabsStorageManager } from '../application/main/state_management/tabs_storage_manager';
import { internalStateActions } from '../application/main/state_management/redux';
import { DEFAULT_TAB_STATE } from '../application/main/state_management/redux/constants';

export function getDiscoverStateMock({
  isTimeBased = true,
  savedSearch,
  stateStorageContainer,
  runtimeStateManager,
  history,
  customizationContext = mockCustomizationContext,
  services: originalServices = discoverServiceMock,
}: {
  isTimeBased?: boolean;
  savedSearch?: SavedSearch | false;
  runtimeStateManager?: RuntimeStateManager;
  stateStorageContainer?: IKbnUrlStateStorage;
  history?: History<HistoryLocationState>;
  customizationContext?: DiscoverCustomizationContext;
  services?: DiscoverServices;
} = {}) {
  if (!history) {
    history = createBrowserHistory<HistoryLocationState>();
    history.push('/');
  }
  const services = { ...originalServices, history };
  const storeInSessionStorage = services.uiSettings.get('state:storeInSessionStorage');
  const toasts = services.core.notifications.toasts;
  stateStorageContainer =
    stateStorageContainer ??
    createKbnUrlStateStorage({
      useHash: storeInSessionStorage,
      history: services.history,
      useHashQuery: customizationContext.displayMode !== 'embedded',
      ...(toasts && withNotifyOnErrors(toasts)),
    });
  runtimeStateManager = runtimeStateManager ?? createRuntimeStateManager();
  const tabsStorageManager = createTabsStorageManager({
    urlStateStorage: stateStorageContainer,
    storage: services.storage,
  });
  const internalState = createInternalStateStore({
    services,
    customizationContext,
    runtimeStateManager,
    urlStateStorage: stateStorageContainer,
    tabsStorageManager,
  });
  const finalSavedSearch =
    savedSearch === false
      ? undefined
      : savedSearch
      ? savedSearch
      : isTimeBased
      ? savedSearchMockWithTimeField
      : savedSearchMock;
  const mockUserId = 'mockUserId';
  const mockSpaceId = 'mockSpaceId';
  const initialTabsState = tabsStorageManager.loadLocally({
    userId: mockUserId,
    spaceId: mockSpaceId,
    defaultTabState: DEFAULT_TAB_STATE,
  });
  internalState.dispatch(internalStateActions.setTabs(initialTabsState));
  internalState.dispatch(
    internalStateActions.initializeTabs.fulfilled(
      {
        userId: mockUserId,
        spaceId: mockSpaceId,
        persistedDiscoverSession: finalSavedSearch
          ? {
              ...finalSavedSearch,
              title: finalSavedSearch.title ?? '',
              description: finalSavedSearch.description ?? '',
              tabs: [
                {
                  ...finalSavedSearch,
                  id: finalSavedSearch.id ?? '',
                  label: finalSavedSearch.title ?? '',
                  serializedSearchSource: finalSavedSearch.searchSource.getSerializedFields(),
                  sort: finalSavedSearch.sort ?? [],
                  columns: finalSavedSearch.columns ?? [],
                  grid: finalSavedSearch.grid ?? {},
                  hideChart: finalSavedSearch.hideChart ?? false,
                  isTextBasedQuery: finalSavedSearch.isTextBasedQuery ?? false,
                },
              ],
            }
          : undefined,
      },
      'requestId',
      { discoverSessionId: finalSavedSearch?.id }
    )
  );
  const container = getDiscoverStateContainer({
    tabId: internalState.getState().tabs.unsafeCurrentId,
    services,
    customizationContext,
    stateStorageContainer,
    internalState,
    runtimeStateManager,
  });
  const tabRuntimeState = selectTabRuntimeState(
    runtimeStateManager,
    internalState.getState().tabs.unsafeCurrentId
  );
  tabRuntimeState.customizationService$.next({
    ...createCustomizationService(),
    cleanup: async () => {},
  });
  tabRuntimeState.stateContainer$.next(container);
  if (finalSavedSearch) {
    container.savedSearchState.set(finalSavedSearch);
  }

  return container;
}
