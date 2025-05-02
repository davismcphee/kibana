/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { ForwardedRef, useCallback, useImperativeHandle, useRef, useState } from 'react';
import useUnmount from 'react-use/lib/useUnmount';

export interface ScrollableSectionWrapperApi {
  openAndScrollToSection: () => void;
}

export const useScrollableSection = (ref: ForwardedRef<ScrollableSectionWrapperApi>) => {
  const [openState, setOpenState] = useState<'closed' | 'open'>('closed');
  const onToggle = useCallback((isOpen: boolean) => setOpenState(isOpen ? 'open' : 'closed'), []);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const getAccordionWrapper = useRef(() =>
    wrapperRef.current?.querySelector<HTMLDivElement>('.euiAccordion__childWrapper')
  );
  const cancelPrevTransitionEnd = useRef(() => {});

  useImperativeHandle(
    ref,
    () => ({
      openAndScrollToSection: () => {
        cancelPrevTransitionEnd.current();

        const accordionWrapper = getAccordionWrapper.current();

        if (!accordionWrapper) {
          return;
        }

        const scrollIntoView = () =>
          accordionWrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });

        if (openState === 'open') {
          scrollIntoView();
        } else {
          setOpenState('open');

          const onTransitionEnd = (e: TransitionEvent) => {
            if (e.propertyName === 'height') {
              scrollIntoView();
              accordionWrapper.removeEventListener('transitionend', onTransitionEnd);
            }
          };

          cancelPrevTransitionEnd.current = () => {
            accordionWrapper.removeEventListener('transitionend', onTransitionEnd);
          };

          accordionWrapper.addEventListener('transitionend', onTransitionEnd);
        }
      },
    }),
    [openState]
  );

  useUnmount(() => {
    cancelPrevTransitionEnd.current();
  });

  return { wrapperRef, forceState: openState, onToggle };
};
