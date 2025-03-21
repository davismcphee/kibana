/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { journey, step, expect, before } from '@elastic/synthetics';
import { recordVideo } from '@kbn/observability-synthetics-test-data';
import { UXDashboardDatePicker } from '../page_objects/date_picker';
import { loginToKibana, waitForLoadingToFinish } from './utils';

journey('Core Web Vitals', async ({ page, params }) => {
  recordVideo(page);

  before(async () => {
    await waitForLoadingToFinish({ page });
  });

  const queryParams = {
    percentile: '50',
    rangeFrom: '2020-05-18T11:51:00.000Z',
    rangeTo: '2021-10-30T06:37:15.536Z',
  };
  const queryString = new URLSearchParams(queryParams).toString();

  const baseUrl = `${params.kibanaUrl}/app/ux`;

  step('Go to UX Dashboard', async () => {
    await page.goto(`${baseUrl}?${queryString}`, {
      waitUntil: 'networkidle',
    });
    await loginToKibana({
      page,
      user: { username: 'viewer', password: 'changeme' },
    });
  });

  step('Set date range', async () => {
    const datePickerPage = new UXDashboardDatePicker(page);
    await datePickerPage.setDefaultE2eRange();
  });

  step('Check Core Web Vitals', async () => {
    expect(await page.$('text=Largest contentful paint'));
    expect(await page.$('text=First input delay'));
    expect(await page.$('text=Cumulative layout shift'));
    const cwvSummary = await page.innerText('text=traffic represented');
    expect(
      // match any three digits followed by string constant
      // note this regex is suceptible to accepting values > 100
      new RegExp('[0-9]{1,3}% of the traffic represented').test(cwvSummary)
    ).toBe(true);
  });
});
