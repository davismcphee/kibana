/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import expect from '@kbn/expect';
import { USERS, User, ExpectedResponse } from '../../../common/lib';
import { FtrProviderContext } from '../services';
import { createTestSpaces, deleteTestSpaces, createTags, deleteTags } from './test_utils';

// eslint-disable-next-line import/no-default-export
export default function (ftrContext: FtrProviderContext) {
  const supertest = ftrContext.getService('supertestWithoutAuth');

  describe('GET /api/saved_objects_tagging/tags', () => {
    before(async () => {
      await createTestSpaces(ftrContext);
    });

    after(async () => {
      await deleteTestSpaces(ftrContext);
    });

    beforeEach(async () => {
      await createTags(ftrContext);
    });

    afterEach(async () => {
      await deleteTags(ftrContext);
    });

    const responses: Record<string, ExpectedResponse> = {
      authorized: {
        httpCode: 200,
        expectResponse: ({ body }) => {
          if (!Array.isArray(body.tags)) {
            throw new Error('Expected body.tags to be an array');
          }

          const tags = (body.tags as [{ id: string }])
            // sort the tags by ID alphabetically
            .sort((a, b) => {
              return a.id.localeCompare(b.id);
            });

          expect(tags).to.eql([
            {
              id: 'default-space-tag-1',
              name: 'tag-1',
              description: 'Tag 1 in default space',
              color: '#FF00FF',
              managed: false,
            },
            {
              id: 'default-space-tag-2',
              name: 'tag-2',
              description: 'Tag 2 in default space',
              color: '#77CC11',
              managed: false,
            },
          ]);
        },
      },
      unauthorized: {
        httpCode: 403,
        expectResponse: ({ body }) => {
          expect(body).to.eql({
            error: 'Forbidden',
            message: 'unauthorized',
            statusCode: 403,
          });
        },
      },
    };

    const expectedResults: Record<string, User[]> = {
      authorized: [
        USERS.SUPERUSER,
        USERS.DEFAULT_SPACE_READ_USER,
        USERS.DEFAULT_SPACE_SO_MANAGEMENT_WRITE_USER,
        USERS.DEFAULT_SPACE_SO_TAGGING_READ_USER,
        USERS.DEFAULT_SPACE_SO_TAGGING_WRITE_USER,
        USERS.DEFAULT_SPACE_DASHBOARD_READ_USER,
        USERS.DEFAULT_SPACE_VISUALIZE_READ_USER,
        USERS.DEFAULT_SPACE_MAPS_READ_USER,
      ],
      unauthorized: [USERS.NOT_A_KIBANA_USER],
    };

    const createUserTest = (
      { username, password, description }: User,
      { httpCode, expectResponse }: ExpectedResponse
    ) => {
      it(`returns expected ${httpCode} response for ${description ?? username}`, async () => {
        await supertest
          .get(`/api/saved_objects_tagging/tags`)
          .auth(username, password)
          .expect(httpCode)
          .then(expectResponse);
      });
    };

    const createTestSuite = () => {
      Object.entries(expectedResults).forEach(([responseId, users]) => {
        const response: ExpectedResponse = responses[responseId];
        users.forEach((user) => {
          createUserTest(user, response);
        });
      });
    };

    createTestSuite();
  });
}
