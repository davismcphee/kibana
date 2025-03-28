/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import expect from '@kbn/expect';
import { FtrProviderContext } from '../ftr_provider_context';

const DEFAULT_ROWS_PER_PAGE = 100;
const DEFAULT_SAMPLE_SIZE = 500;
const CUSTOM_SAMPLE_SIZE = 250;
const CUSTOM_SAMPLE_SIZE_FOR_SAVED_SEARCH = 150;
const CUSTOM_SAMPLE_SIZE_FOR_DASHBOARD_PANEL = 10;
const FOOTER_SELECTOR = 'unifiedDataTableFooter';
const SAVED_SEARCH_NAME = 'With sample size';

export default function ({ getService, getPageObjects }: FtrProviderContext) {
  const browser = getService('browser');
  const esArchiver = getService('esArchiver');
  const kibanaServer = getService('kibanaServer');
  const dataGrid = getService('dataGrid');
  const testSubjects = getService('testSubjects');
  const retry = getService('retry');
  const dashboardAddPanel = getService('dashboardAddPanel');
  const { common, discover, header, timePicker, dashboard } = getPageObjects([
    'common',
    'discover',
    'header',
    'timePicker',
    'dashboard',
  ]);
  const security = getService('security');
  const defaultSettings = {
    defaultIndex: 'logstash-*',
    'discover:sampleSize': DEFAULT_SAMPLE_SIZE,
    'discover:rowHeightOption': 0, // single line
    'discover:sampleRowsPerPage': DEFAULT_ROWS_PER_PAGE,
    hideAnnouncements: true,
  };

  describe('discover data grid sample size', function describeIndexTests() {
    before(async () => {
      await security.testUser.setRoles(['kibana_admin', 'test_logstash_reader']);
      await esArchiver.loadIfNeeded(
        'src/platform/test/functional/fixtures/es_archiver/logstash_functional'
      );
      await kibanaServer.importExport.load(
        'src/platform/test/functional/fixtures/kbn_archiver/discover'
      );
    });

    after(async () => {
      await kibanaServer.importExport.unload(
        'src/platform/test/functional/fixtures/kbn_archiver/discover'
      );
      await kibanaServer.uiSettings.replace({});
      await kibanaServer.savedObjects.cleanStandardList();
    });

    beforeEach(async function () {
      await timePicker.setDefaultAbsoluteRangeViaUiSettings();
      await kibanaServer.uiSettings.update(defaultSettings);
      await common.navigateToApp('discover');
      await header.waitUntilLoadingHasFinished();
      await discover.waitUntilSearchingHasFinished();
    });

    async function goToLastPageAndCheckFooterMessage(sampleSize: number) {
      const lastPageNumber = Math.ceil(sampleSize / DEFAULT_ROWS_PER_PAGE) - 1;

      // go to the last page
      await testSubjects.click(`pagination-button-${lastPageNumber}`);
      // footer is shown now
      await retry.try(async function () {
        await testSubjects.existOrFail(FOOTER_SELECTOR);
      });
      expect(
        (await testSubjects.getVisibleText(FOOTER_SELECTOR)).includes(String(sampleSize))
      ).to.be(true);
    }

    it('should use the default sample size', async () => {
      await dataGrid.clickGridSettings();
      expect(await dataGrid.getCurrentSampleSizeValue()).to.be(DEFAULT_SAMPLE_SIZE);
      await goToLastPageAndCheckFooterMessage(DEFAULT_SAMPLE_SIZE);
    });

    it('should allow to change sample size', async () => {
      await dataGrid.clickGridSettings();
      expect(await dataGrid.getCurrentSampleSizeValue()).to.be(DEFAULT_SAMPLE_SIZE);

      await dataGrid.changeSampleSizeValue(CUSTOM_SAMPLE_SIZE);

      await header.waitUntilLoadingHasFinished();
      await discover.waitUntilSearchingHasFinished();

      expect(await dataGrid.getCurrentSampleSizeValue()).to.be(CUSTOM_SAMPLE_SIZE);
      await goToLastPageAndCheckFooterMessage(CUSTOM_SAMPLE_SIZE);
    });

    it('should persist the selection after reloading the page', async () => {
      await dataGrid.clickGridSettings();
      expect(await dataGrid.getCurrentSampleSizeValue()).to.be(DEFAULT_SAMPLE_SIZE);

      await dataGrid.changeSampleSizeValue(CUSTOM_SAMPLE_SIZE);

      await header.waitUntilLoadingHasFinished();
      await discover.waitUntilSearchingHasFinished();

      await browser.refresh();

      await discover.waitUntilSearchingHasFinished();
      await dataGrid.clickGridSettings();

      expect(await dataGrid.getCurrentSampleSizeValue()).to.be(CUSTOM_SAMPLE_SIZE);
      await goToLastPageAndCheckFooterMessage(CUSTOM_SAMPLE_SIZE);
    });

    it('should save a custom sample size with a search', async () => {
      await dataGrid.clickGridSettings();
      expect(await dataGrid.getCurrentSampleSizeValue()).to.be(DEFAULT_SAMPLE_SIZE);

      await dataGrid.changeSampleSizeValue(CUSTOM_SAMPLE_SIZE_FOR_SAVED_SEARCH);

      await header.waitUntilLoadingHasFinished();
      await discover.waitUntilSearchingHasFinished();

      await discover.saveSearch(SAVED_SEARCH_NAME);

      await discover.waitUntilSearchingHasFinished();
      await dataGrid.clickGridSettings();

      expect(await dataGrid.getCurrentSampleSizeValue()).to.be(CUSTOM_SAMPLE_SIZE_FOR_SAVED_SEARCH);
      await goToLastPageAndCheckFooterMessage(CUSTOM_SAMPLE_SIZE_FOR_SAVED_SEARCH);

      // reset to the default value
      await discover.clickNewSearchButton();
      await dataGrid.clickGridSettings();
      expect(await dataGrid.getCurrentSampleSizeValue()).to.be(DEFAULT_SAMPLE_SIZE);
      await goToLastPageAndCheckFooterMessage(DEFAULT_SAMPLE_SIZE);

      // load the saved search again
      await discover.loadSavedSearch(SAVED_SEARCH_NAME);
      await dataGrid.clickGridSettings();
      expect(await dataGrid.getCurrentSampleSizeValue()).to.be(CUSTOM_SAMPLE_SIZE_FOR_SAVED_SEARCH);
      await goToLastPageAndCheckFooterMessage(CUSTOM_SAMPLE_SIZE_FOR_SAVED_SEARCH);

      // load another saved search without a custom sample size
      await discover.loadSavedSearch('A Saved Search');
      await dataGrid.clickGridSettings();
      expect(await dataGrid.getCurrentSampleSizeValue()).to.be(DEFAULT_SAMPLE_SIZE);
      await goToLastPageAndCheckFooterMessage(DEFAULT_SAMPLE_SIZE);
    });

    it('should use the default sample size on Dashboard', async () => {
      await common.navigateToApp('dashboard');
      await dashboard.clickNewDashboard();
      await dashboardAddPanel.clickOpenAddPanel();
      await dashboardAddPanel.addSavedSearch('A Saved Search');

      await dataGrid.clickGridSettings();
      expect(await dataGrid.getCurrentSampleSizeValue()).to.be(DEFAULT_SAMPLE_SIZE);
      await goToLastPageAndCheckFooterMessage(DEFAULT_SAMPLE_SIZE);
    });

    it('should use custom sample size on Dashboard when specified', async () => {
      await common.navigateToApp('dashboard');
      await dashboard.clickNewDashboard();
      await dashboardAddPanel.clickOpenAddPanel();
      await dashboardAddPanel.addSavedSearch(SAVED_SEARCH_NAME);

      await dataGrid.clickGridSettings();
      expect(await dataGrid.getCurrentSampleSizeValue()).to.be(CUSTOM_SAMPLE_SIZE_FOR_SAVED_SEARCH);

      await dataGrid.changeSampleSizeValue(CUSTOM_SAMPLE_SIZE_FOR_DASHBOARD_PANEL);

      await header.waitUntilLoadingHasFinished();

      await dataGrid.clickGridSettings();
      expect(await dataGrid.getCurrentSampleSizeValue()).to.be(
        CUSTOM_SAMPLE_SIZE_FOR_DASHBOARD_PANEL
      );
      await goToLastPageAndCheckFooterMessage(CUSTOM_SAMPLE_SIZE_FOR_DASHBOARD_PANEL);

      await dashboard.saveDashboard('test');

      await browser.refresh();
      await header.waitUntilLoadingHasFinished();

      await dataGrid.clickGridSettings();
      expect(await dataGrid.getCurrentSampleSizeValue()).to.be(
        CUSTOM_SAMPLE_SIZE_FOR_DASHBOARD_PANEL
      );
      await goToLastPageAndCheckFooterMessage(CUSTOM_SAMPLE_SIZE_FOR_DASHBOARD_PANEL);
    });
  });
}
