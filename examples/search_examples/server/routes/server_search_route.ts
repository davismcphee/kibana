/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { Observable } from 'rxjs';
import type { IEsSearchRequest, IEsSearchResponse } from '@kbn/search-types';
import { schema } from '@kbn/config-schema';
import type { DataRequestHandlerContext } from '@kbn/data-plugin/server';
import type { IRouter } from '@kbn/core/server';
import { SERVER_SEARCH_ROUTE_PATH } from '../../common';

export function registerServerSearchRoute(router: IRouter<DataRequestHandlerContext>) {
  router.get(
    {
      path: SERVER_SEARCH_ROUTE_PATH,
      validate: {
        query: schema.object({
          index: schema.maybe(schema.string()),
          field: schema.maybe(schema.string()),
        }),
      },
      security: {
        authz: {
          enabled: false,
          reason: 'This route delegates authorization check to es.',
        },
      },
    },
    async (context, request, response) => {
      const { index, field } = request.query;

      // User may abort the request without waiting for the results
      // we need to handle this scenario by aborting underlying server requests
      const abortSignal = getRequestAbortedSignal(request.events.aborted$);

      try {
        const search = await context.search;
        const res = await search
          .search(
            {
              params: {
                index,
                aggs: {
                  '1': {
                    avg: {
                      field,
                    },
                  },
                },
              },
            } as IEsSearchRequest,
            { abortSignal }
          )
          .toPromise();

        return response.ok({
          body: {
            aggs: (res as IEsSearchResponse).rawResponse.aggregations,
          },
        });
      } catch (e) {
        return response.customError({
          statusCode: e.statusCode ?? 500,
          body: {
            message: e.message,
          },
        });
      }
    }
  );
}

function getRequestAbortedSignal(aborted$: Observable<void>): AbortSignal {
  const controller = new AbortController();
  aborted$.subscribe(() => controller.abort());
  return controller.signal;
}
