/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { ChangeEvent } from 'react';
import React, { Component } from 'react';
import type { EuiSwitchEvent } from '@elastic/eui';
import { EuiForm, EuiFormRow, EuiSpacer, EuiSelect, EuiSwitch, EuiToolTip } from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import { ES_FIELD_TYPES } from '@kbn/data-plugin/public';
import type { OnFileSelectParameters } from './geo_file_picker';
import { GeoFilePicker } from './geo_file_picker';
import { IndexNameForm } from './index_name_form';
import { validateIndexName } from '../../validate_index_name';

const GEO_FIELD_TYPE_OPTIONS = [
  {
    text: ES_FIELD_TYPES.GEO_POINT,
    value: ES_FIELD_TYPES.GEO_POINT,
  },
  {
    text: ES_FIELD_TYPES.GEO_SHAPE,
    value: ES_FIELD_TYPES.GEO_SHAPE,
  },
];

interface Props {
  geoFieldType: ES_FIELD_TYPES.GEO_POINT | ES_FIELD_TYPES.GEO_SHAPE;
  indexName: string;
  indexNameError?: string;
  smallChunks: boolean;
  onFileClear: () => void;
  onFileSelect: (onFileSelectParameters: OnFileSelectParameters) => void;
  onGeoFieldTypeSelect: (geoFieldType: ES_FIELD_TYPES.GEO_POINT | ES_FIELD_TYPES.GEO_SHAPE) => void;
  onIndexNameChange: (name: string, error?: string) => void;
  onIndexNameValidationStart: () => void;
  onIndexNameValidationEnd: () => void;
  onSmallChunksChange: (smallChunks: boolean) => void;
}

interface State {
  hasFile: boolean;
  isPointsOnly: boolean;
}

export class GeoUploadForm extends Component<Props, State> {
  private _isMounted = false;
  state: State = {
    hasFile: false,
    isPointsOnly: false,
  };

  componentDidMount() {
    this._isMounted = true;
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  _onFileSelect = async (onFileSelectParameters: OnFileSelectParameters) => {
    this.setState({
      hasFile: true,
      isPointsOnly: onFileSelectParameters.hasPoints && !onFileSelectParameters.hasShapes,
    });

    this.props.onFileSelect(onFileSelectParameters);

    this.props.onIndexNameValidationStart();
    const indexNameError = await validateIndexName(onFileSelectParameters.indexName);
    if (!this._isMounted) {
      return;
    }
    this.props.onIndexNameValidationEnd();
    this.props.onIndexNameChange(onFileSelectParameters.indexName, indexNameError);

    const geoFieldType =
      onFileSelectParameters.hasPoints && !onFileSelectParameters.hasShapes
        ? ES_FIELD_TYPES.GEO_POINT
        : ES_FIELD_TYPES.GEO_SHAPE;
    this.props.onGeoFieldTypeSelect(geoFieldType);
  };

  _onFileClear = () => {
    this.setState({
      hasFile: false,
      isPointsOnly: false,
    });

    this.props.onFileClear();

    this.props.onIndexNameChange('');
  };

  _onGeoFieldTypeSelect = (event: ChangeEvent<HTMLSelectElement>) => {
    return this.props.onGeoFieldTypeSelect(
      event.target.value as ES_FIELD_TYPES.GEO_POINT | ES_FIELD_TYPES.GEO_SHAPE
    );
  };

  _onSmallChunksChange = (event: EuiSwitchEvent) => {
    this.props.onSmallChunksChange(event.target.checked);
  };

  _renderGeoFieldTypeSelect() {
    return this.state.hasFile && this.state.isPointsOnly ? (
      <EuiFormRow
        label={i18n.translate('xpack.fileUpload.indexSettings.enterIndexTypeLabel', {
          defaultMessage: 'Index type',
        })}
      >
        <EuiSelect
          data-test-subj="fileImportIndexSelect"
          options={GEO_FIELD_TYPE_OPTIONS}
          value={this.props.geoFieldType}
          onChange={this._onGeoFieldTypeSelect}
        />
      </EuiFormRow>
    ) : null;
  }

  render() {
    return (
      <EuiForm>
        <GeoFilePicker onSelect={this._onFileSelect} onClear={this._onFileClear} />
        {this._renderGeoFieldTypeSelect()}
        {this.state.hasFile ? (
          <>
            <IndexNameForm
              indexName={this.props.indexName}
              indexNameError={this.props.indexNameError}
              onIndexNameChange={this.props.onIndexNameChange}
              onIndexNameValidationStart={this.props.onIndexNameValidationStart}
              onIndexNameValidationEnd={this.props.onIndexNameValidationEnd}
            />
            <EuiSpacer size="m" />
            <EuiFormRow display="columnCompressed">
              <EuiToolTip
                position="top"
                content={i18n.translate('xpack.fileUpload.smallChunks.tooltip', {
                  defaultMessage: 'Use to alleviate request timeout failures.',
                })}
              >
                <EuiSwitch
                  label={i18n.translate('xpack.fileUpload.smallChunks.switchLabel', {
                    defaultMessage: 'Upload file in smaller chunks',
                  })}
                  checked={this.props.smallChunks}
                  onChange={this._onSmallChunksChange}
                  compressed
                />
              </EuiToolTip>
            </EuiFormRow>
          </>
        ) : null}
      </EuiForm>
    );
  }
}
