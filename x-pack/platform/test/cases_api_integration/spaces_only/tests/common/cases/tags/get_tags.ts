/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import expect from '@kbn/expect';
import type { FtrProviderContext } from '../../../../../common/ftr_provider_context';

import {
  deleteCasesByESQuery,
  createCase,
  getTags,
  getAuthWithSuperUser,
} from '../../../../../common/lib/api';
import { getPostCaseRequest } from '../../../../../common/lib/mock';

export default ({ getService }: FtrProviderContext): void => {
  const supertestWithoutAuth = getService('supertestWithoutAuth');
  const es = getService('es');
  const authSpace1 = getAuthWithSuperUser();
  const authSpace2 = getAuthWithSuperUser('space2');

  describe('get_tags', () => {
    afterEach(async () => {
      await deleteCasesByESQuery(es);
    });

    it('should return case tags in space1', async () => {
      await createCase(supertestWithoutAuth, getPostCaseRequest(), 200, authSpace1);
      await createCase(
        supertestWithoutAuth,
        getPostCaseRequest({ tags: ['unique'] }),
        200,
        authSpace2
      );

      const tagsSpace1 = await getTags({ supertest: supertestWithoutAuth, auth: authSpace1 });
      const tagsSpace2 = await getTags({ supertest: supertestWithoutAuth, auth: authSpace2 });

      expect(tagsSpace1).to.eql(['defacement']);
      expect(tagsSpace2).to.eql(['unique']);
    });
  });
};
