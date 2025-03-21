/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import React from 'react';
import { SettingsApplication } from './application';
import {
  SettingsApplicationKibanaDependencies,
  SettingsApplicationKibanaProvider,
} from './services';

export { SettingsApplication } from './application';
export {
  SettingsApplicationProvider,
  SettingsApplicationKibanaProvider,
  type SettingsApplicationServices,
  type SettingsApplicationKibanaDependencies,
} from './services';

export const KibanaSettingsApplication = ({
  docLinks,
  i18n,
  notifications,
  settings,
  userProfile,
  theme,
  history,
  sectionRegistry,
  application,
  chrome,
  spaces,
}: SettingsApplicationKibanaDependencies) => (
  <SettingsApplicationKibanaProvider
    {...{
      settings,
      userProfile,
      theme,
      i18n,
      notifications,
      docLinks,
      history,
      sectionRegistry,
      application,
      chrome,
      spaces,
    }}
  >
    <SettingsApplication />
  </SettingsApplicationKibanaProvider>
);
