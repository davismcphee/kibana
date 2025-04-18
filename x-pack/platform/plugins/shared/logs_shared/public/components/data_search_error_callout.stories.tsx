/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { PropsOf } from '@elastic/eui';
import { Meta, StoryFn } from '@storybook/react';
import React from 'react';
import { decorateWithGlobalStorybookThemeProviders } from '../test_utils/use_global_storybook_theme';
import { DataSearchErrorCallout } from './data_search_error_callout';

export default {
  title: 'infra/dataSearch/DataSearchErrorCallout',
  decorators: [
    (wrappedStory) => <div style={{ width: 600 }}>{wrappedStory()}</div>,
    decorateWithGlobalStorybookThemeProviders,
  ],
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    errors: {
      control: {
        type: 'object',
      },
    },
  },
} as Meta;

type DataSearchErrorCalloutProps = PropsOf<typeof DataSearchErrorCallout>;

const DataSearchErrorCalloutTemplate: StoryFn<DataSearchErrorCalloutProps> = (args) => (
  <DataSearchErrorCallout {...args} />
);

const commonArgs = {
  title: 'Failed to load data',
  errors: [
    {
      type: 'generic' as const,
      message: 'A generic error message',
    },
    {
      type: 'shardFailure' as const,
      shardInfo: {
        index: 'filebeat-7.9.3-2020.12.01-000003',
        node: 'a45hJUm3Tba4U8MkvkCU_g',
        shard: 0,
      },
      message: 'No mapping found for [@timestamp] in order to sort on',
    },
  ],
};

export const ErrorCallout = {
  render: DataSearchErrorCalloutTemplate,

  args: {
    ...commonArgs,
  },
};

export const ErrorCalloutWithRetry = {
  render: DataSearchErrorCalloutTemplate,

  args: {
    ...commonArgs,
  },

  argTypes: {
    onRetry: { action: 'retrying' },
  },
};

export const AbortedErrorCallout = {
  render: DataSearchErrorCalloutTemplate,

  args: {
    ...commonArgs,
    errors: [
      {
        type: 'aborted',
      },
    ],
  },

  argTypes: {
    onRetry: { action: 'retrying' },
  },
};
