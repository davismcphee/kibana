/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { SecurityRoleName } from '@kbn/security-solution-plugin/common/test';
import type { Exception } from '../objects/exception';
import { RULE_MANAGEMENT_PAGE_BREADCRUMB } from '../screens/breadcrumbs';
import { PAGE_CONTENT_SPINNER } from '../screens/common/page';
import { RULE_STATUS } from '../screens/create_new_rule';
import {
  ADD_EXCEPTIONS_BTN_FROM_EMPTY_PROMPT_BTN,
  ADD_EXCEPTIONS_BTN_FROM_VIEWER_HEADER,
  EXCEPTION_ITEM_VIEWER_SEARCH,
  FIELD_INPUT,
} from '../screens/exceptions';
import {
  ALERTS_TAB,
  EXCEPTIONS_TAB,
  FIELDS_BROWSER_BTN,
  LAST_EXECUTION_STATUS_REFRESH_BUTTON,
  REMOVE_EXCEPTION_BTN,
  RULE_SWITCH,
  DEFINITION_DETAILS,
  INDEX_PATTERNS_DETAILS,
  DETAILS_TITLE,
  DETAILS_DESCRIPTION,
  EXCEPTION_ITEM_ACTIONS_BUTTON,
  EDIT_EXCEPTION_BTN,
  ENDPOINT_EXCEPTIONS_TAB,
  EDIT_RULE_SETTINGS_LINK,
  EXCEPTIONS_TAB_EXPIRED_FILTER,
  EXCEPTIONS_TAB_ACTIVE_FILTER,
  RULE_NAME_HEADER,
  INVESTIGATION_FIELDS_DETAILS,
  ABOUT_DETAILS,
  EXECUTIONS_TAB,
  EXECUTION_TABLE,
  EXECUTION_LOG_CONTAINER,
  EXECUTION_RUN_TYPE_FILTER,
  EXECUTION_RUN_TYPE_FILTER_ITEM,
  RULE_BACKFILLS_TABLE,
  RULE_GAPS_TABLE,
  RULE_GAPS_STATUS_FILTER,
  RULE_GAPS_DATE_FILTER_OPTION,
  RULE_GAPS_DATE_PICKER_APPLY_REFRESH,
  POPOVER_ACTIONS_TRIGGER_BUTTON,
  EXPORT_RULE_ACTION_BUTTON,
} from '../screens/rule_details';
import { RuleDetailsTabs, ruleDetailsUrl } from '../urls/rule_details';
import {
  addExceptionConditions,
  addExceptionFlyoutItemName,
  selectBulkCloseAlerts,
  submitNewExceptionItem,
} from './exceptions';
import { addsFields, closeFieldsBrowser, filterFieldsBrowser } from './fields_browser';
import { visit } from './navigation';
import { LOCAL_DATE_PICKER_APPLY_BUTTON_TIMELINE } from '../screens/date_picker';

interface VisitRuleDetailsPageOptions {
  tab?: RuleDetailsTabs;
  role?: SecurityRoleName;
}

export function visitRuleDetailsPage(ruleId: string, options?: VisitRuleDetailsPageOptions): void {
  visit(ruleDetailsUrl(ruleId, options?.tab));
}

export const clickEnableRuleSwitch = () => {
  // Rules get enabled via _bulk_action endpoint
  cy.intercept('POST', '/api/detection_engine/rules/_bulk_action?dry_run=false').as('bulk_action');
  cy.get(RULE_SWITCH).should('be.visible');
  cy.get(RULE_SWITCH).click();
  cy.wait('@bulk_action').then(({ response }) => {
    cy.wrap(response?.statusCode).should('eql', 200);
    cy.wrap(response?.body.attributes.results.updated[0].enabled).should('eql', true);
  });
};

export const clickDisableRuleSwitch = () => {
  // Rules get enabled via _bulk_action endpoint
  cy.intercept('POST', '/api/detection_engine/rules/_bulk_action?dry_run=false').as('bulk_action');
  cy.get(RULE_SWITCH).should('be.visible');
  cy.get(RULE_SWITCH).click();
  cy.wait('@bulk_action').then(({ response }) => {
    cy.wrap(response?.statusCode).should('eql', 200);
    cy.wrap(response?.body.attributes.results.updated[0].enabled).should('eql', false);
  });
};

export const addsFieldsToTimeline = (search: string, fields: string[]) => {
  cy.get(FIELDS_BROWSER_BTN).click();
  filterFieldsBrowser(search);
  addsFields(fields);
  closeFieldsBrowser();
};

export const openExceptionFlyoutFromEmptyViewerPrompt = () => {
  cy.get(ADD_EXCEPTIONS_BTN_FROM_EMPTY_PROMPT_BTN).click();
  cy.get(FIELD_INPUT).should('be.visible');
};

export const searchForExceptionItem = (query: string) => {
  cy.get(EXCEPTION_ITEM_VIEWER_SEARCH).clear();
  cy.get(EXCEPTION_ITEM_VIEWER_SEARCH).type(`${query}{enter}`);
};

export const addExceptionFlyoutFromViewerHeader = () => {
  cy.get(ADD_EXCEPTIONS_BTN_FROM_VIEWER_HEADER).click();
  cy.get(FIELD_INPUT).should('be.visible');
};

export const addExceptionFromRuleDetails = (exception: Exception) => {
  addExceptionFlyoutFromViewerHeader();
  addExceptionConditions(exception);
  submitNewExceptionItem();
};

export const addFirstExceptionFromRuleDetails = (exception: Exception, name: string) => {
  openExceptionFlyoutFromEmptyViewerPrompt();
  addExceptionFlyoutItemName(name);
  addExceptionConditions(exception);
  selectBulkCloseAlerts();
  submitNewExceptionItem();
};

export const goToAlertsTab = () => {
  cy.get(ALERTS_TAB).click();
};

// TODO remove the `{ force: true }` option
// see https://github.com/elastic/eui/pull/8771
// https://github.com/orgs/elastic/projects/1079/views/2?pane=issue&itemId=119405120
export const goToExceptionsTab = () => {
  // eslint-disable-next-line cypress/no-force
  cy.get(EXCEPTIONS_TAB).click({ force: true });
};

export const goToExecutionLogTab = () => {
  cy.get(EXECUTIONS_TAB).click();
};

export const viewExpiredExceptionItems = () => {
  cy.get(EXCEPTIONS_TAB_EXPIRED_FILTER).click();
  cy.get(EXCEPTIONS_TAB_ACTIVE_FILTER).click();
};

export const goToEndpointExceptionsTab = () => {
  cy.get(ENDPOINT_EXCEPTIONS_TAB).click();
};

export const openEditException = (index = 0) => {
  cy.get(EXCEPTION_ITEM_ACTIONS_BUTTON).eq(index).click();
  cy.get(EDIT_EXCEPTION_BTN).eq(index).click();
};

export const removeException = () => {
  cy.get(EXCEPTION_ITEM_ACTIONS_BUTTON).click();

  cy.get(REMOVE_EXCEPTION_BTN).click();
};

/**
 * Waits for rule details page to be loaded
 *
 * @param ruleName rule's name
 */
export const waitForPageToBeLoaded = (ruleName: string): void => {
  cy.get(PAGE_CONTENT_SPINNER).should('be.visible');
  cy.contains(RULE_NAME_HEADER, ruleName).should('be.visible');
  cy.get(PAGE_CONTENT_SPINNER).should('not.exist');
};

export const waitForTheRuleToBeExecuted = () => {
  cy.waitUntil(() => {
    cy.log('Waiting for the rule to be executed');
    cy.get(LAST_EXECUTION_STATUS_REFRESH_BUTTON).click();

    return cy
      .get(RULE_STATUS)
      .invoke('text')
      .then((ruleStatus) => ruleStatus === 'succeeded');
  });
};

export const goBackToRulesTable = () => {
  cy.get(RULE_MANAGEMENT_PAGE_BREADCRUMB).click();
};

export const getDetails = (title: string | RegExp) =>
  cy.contains(DETAILS_TITLE, title).next(DETAILS_DESCRIPTION);

export const assertDetailsNotExist = (title: string | RegExp) =>
  cy.get(DETAILS_TITLE).contains(title).should('not.exist');

export const hasIndexPatterns = (indexPatterns: string) => {
  cy.get(DEFINITION_DETAILS).within(() => {
    getDetails(INDEX_PATTERNS_DETAILS).should('have.text', indexPatterns);
  });
};

export const hasInvestigationFields = (fields: string) => {
  cy.get(ABOUT_DETAILS).within(() => {
    getDetails(INVESTIGATION_FIELDS_DETAILS).should('have.text', fields);
  });
};

export const goToRuleEditSettings = () => {
  cy.get(EDIT_RULE_SETTINGS_LINK).click();
};

export const getExecutionLogTableRow = () => cy.get(EXECUTION_TABLE).find('tbody tr');

export const refreshRuleExecutionTable = () =>
  cy.get(`${EXECUTION_LOG_CONTAINER} ${LOCAL_DATE_PICKER_APPLY_BUTTON_TIMELINE}`).click();

export const filterByRunType = (ruleType: string) => {
  cy.get(EXECUTION_RUN_TYPE_FILTER).click();
  cy.get(EXECUTION_RUN_TYPE_FILTER_ITEM).contains(ruleType).click();
};

export const exportRuleFromDetailsPage = () => {
  cy.get(POPOVER_ACTIONS_TRIGGER_BUTTON).click();
  cy.get(EXPORT_RULE_ACTION_BUTTON).click();
};

export const getBackfillsTableRows = () => {
  return cy.get(RULE_BACKFILLS_TABLE).find('tbody tr');
};

export const getGapsTableRows = () => {
  return cy.get(RULE_GAPS_TABLE).find('tbody tr');
};

export const filterGapsByStatus = (status: string) => {
  cy.get(RULE_GAPS_STATUS_FILTER).click();
  cy.get(RULE_GAPS_DATE_FILTER_OPTION).contains(status).click();
};

export const refreshGapsTable = () => {
  cy.get(RULE_GAPS_DATE_PICKER_APPLY_REFRESH).click();
};
