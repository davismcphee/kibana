/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { DeploymentAgnosticFtrProviderContext } from '../../ftr_provider_context';

export default function ({ loadTestFile }: DeploymentAgnosticFtrProviderContext) {
  describe('Dataset quality', () => {
    loadTestFile(require.resolve('./chart_preview'));
    loadTestFile(require.resolve('./check_and_load_integration'));
    loadTestFile(require.resolve('./data_stream_details'));
    loadTestFile(require.resolve('./data_stream_rollover'));
    loadTestFile(require.resolve('./data_stream_settings'));
    loadTestFile(require.resolve('./data_stream_total_docs'));
    loadTestFile(require.resolve('./degraded_docs'));
    loadTestFile(require.resolve('./degraded_field_analyze'));
    loadTestFile(require.resolve('./degraded_field_values'));
    loadTestFile(require.resolve('./degraded_fields'));
    loadTestFile(require.resolve('./failed_docs_errors'));
    loadTestFile(require.resolve('./failed_docs_stats'));
    loadTestFile(require.resolve('./failed_docs'));
    loadTestFile(require.resolve('./integration_dashboards'));
    loadTestFile(require.resolve('./integrations'));
    loadTestFile(require.resolve('./update_field_limit'));
    loadTestFile(require.resolve('./data_streams_failure_store'));
  });
}
