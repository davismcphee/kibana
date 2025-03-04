/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { getGenerateOrEndDecision } from '.';

describe('getGenerateOrEndDecision', () => {
  it('returns "end" when hasZeroEvents is true', () => {
    const result = getGenerateOrEndDecision(true);

    expect(result).toEqual('end');
  });

  it('returns "generate" when hasZeroEvents is false', () => {
    const result = getGenerateOrEndDecision(false);

    expect(result).toEqual('generate');
  });
});
