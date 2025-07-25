/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { DatasetQualityFtrProviderContext } from './config';

export default function ({ loadTestFile }: DatasetQualityFtrProviderContext) {
  describe('Dataset Quality', function () {
    loadTestFile(require.resolve('./dataset_quality_alerting'));
    loadTestFile(require.resolve('./dataset_quality_details'));
    loadTestFile(require.resolve('./dataset_quality_privileges'));
    loadTestFile(require.resolve('./dataset_quality_summary'));
    loadTestFile(require.resolve('./dataset_quality_table_filters'));
    loadTestFile(require.resolve('./dataset_quality_table'));
    loadTestFile(require.resolve('./degraded_field_flyout'));
    loadTestFile(require.resolve('./failed_docs_flyout'));
    loadTestFile(require.resolve('./home'));
  });
}
