/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { EuiAvatar, EuiIcon } from '@elastic/eui';
import React, { memo } from 'react';
import styled from 'styled-components';

import { useEuiTheme } from '../../../../common/lib/theme/use_eui_theme';
import type { RuleStatusType } from '../../../common/types';

export interface RuleStatusIconProps {
  name: string;
  type: RuleStatusType;
}

const RuleStatusIconStyled = styled.div`
  position: relative;
  svg {
    position: absolute;
    top: 8px;
    left: 9px;
  }
`;

const RuleStatusIconComponent: React.FC<RuleStatusIconProps> = ({ name, type }) => {
  const theme = useEuiTheme();
  const color = type === 'passive' ? theme.euiColorLightestShade : theme.euiColorPrimary;
  return (
    <RuleStatusIconStyled>
      <EuiAvatar color={color} name={type === 'valid' ? '' : name} size="l" aria-label={name} />
      {type === 'valid' ? <EuiIcon type="check" color={theme.euiColorEmptyShade} size="l" /> : null}
    </RuleStatusIconStyled>
  );
};

export const RuleStatusIcon = memo(RuleStatusIconComponent);
