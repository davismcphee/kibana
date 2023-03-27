/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import {
  EuiButtonEmpty,
  EuiButtonIcon,
  EuiFlexGroup,
  EuiFlexItem,
  EuiHorizontalRule,
  EuiTab,
  EuiTabs,
  useEuiPaddingSize,
  useEuiTheme,
} from '@elastic/eui';
import { css } from '@emotion/react';
import React, { ReactNode } from 'react';
import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { DiscoverMainRoute } from './discover_main_route';

interface DiscoverInstance {
  name: string;
  route: string;
}

export const DiscoverTabsWrapper = ({ isDev }: { isDev: boolean }) => {
  const { euiTheme } = useEuiTheme();
  const history = useHistory();
  const [selectedTab, setSelectedTab] = useState(0);
  const [tabs, setTabs] = useState<DiscoverInstance[]>([
    {
      name: 'Default',
      route: '/',
    },
  ]);

  const addTab = () => {
    const newTabs = [
      ...tabs,
      {
        name: `Tab ${tabs.length + 1}`,
        route: '/',
      },
    ];

    changeTab(newTabs.length - 1, newTabs);
  };

  const removeTab = (index: number) => {
    const newTabs = [...tabs];

    newTabs.splice(index, 1);

    if (selectedTab === index) {
      changeTab(index - 1, newTabs);
    } else {
      setTabs(newTabs);
    }
  };

  const changeTab = (index: number, newTabs = [...tabs]) => {
    const route = history.location.pathname + history.location.search;
    const currentTab = newTabs[selectedTab];

    if (currentTab) {
      newTabs[selectedTab] = {
        ...currentTab,
        route,
      };
    }

    setTabs(newTabs);
    setSelectedTab(index);
    history.push(newTabs[index].route);
  };

  return (
    <>
      <EuiFlexGroup
        direction="column"
        gutterSize="none"
        responsive={false}
        className="dscTabsWrapper"
      >
        <EuiFlexItem grow={false}>
          <EuiFlexGroup
            gutterSize="none"
            alignItems="center"
            responsive={false}
            css={css`
              padding-inline: ${useEuiPaddingSize('s')};
            `}
          >
            <EuiFlexItem grow={false}>
              <EuiTabs
                bottomBorder={false}
                css={css`
                  gap: ${euiTheme.base / 4}px;
                `}
              >
                {tabs.map((tab, i) => (
                  <EuiFlexGroup
                    key={i}
                    gutterSize="none"
                    alignItems="center"
                    responsive={false}
                    css={css`
                      .tabClose {
                        opacity: 0;
                      }

                      &:hover .tabClose {
                        opacity: 1;
                      }
                    `}
                  >
                    <EuiFlexItem
                      grow={false}
                      css={
                        i === 0
                          ? css`
                              padding-inline-end: ${euiTheme.base * 1.5}px;
                            `
                          : undefined
                      }
                    >
                      <EuiTab isSelected={selectedTab === i} onClick={() => changeTab(i)}>
                        {tab.name}
                      </EuiTab>
                    </EuiFlexItem>
                    {i !== 0 && (
                      <EuiFlexItem>
                        <EuiButtonIcon
                          iconType="cross"
                          onClick={() => removeTab(i)}
                          className="tabClose"
                          css={css`
                            &:focus {
                              opacity: 1;
                            }
                          `}
                        />
                      </EuiFlexItem>
                    )}
                  </EuiFlexGroup>
                ))}
              </EuiTabs>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButtonEmpty iconType="plus" size="s" onClick={addTab}>
                New tab
              </EuiButtonEmpty>
            </EuiFlexItem>
          </EuiFlexGroup>
          <EuiHorizontalRule margin="none" />
        </EuiFlexItem>
        <EuiFlexItem>
          <DiscoverMainRoute isDev={isDev} />
        </EuiFlexItem>
      </EuiFlexGroup>
    </>
  );
};
