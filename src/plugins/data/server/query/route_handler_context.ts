/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { CustomRequestHandlerContext, RequestHandlerContext, SavedObject } from '@kbn/core/server';
import { isFilters, isOfQueryType, nodeBuilder, nodeTypes } from '@kbn/es-query';
import { omit } from 'lodash';
import { isQuery, SavedQueryAttributes } from '../../common';
import { extract, inject } from '../../common/query/filters/persistable_state';
import { SavedQueryRestBody, SavedQueryRestResponse } from './route_types';

export interface InternalSavedQueryAttributes extends SavedQueryAttributes {
  titleKeyword: string;
}

function injectReferences({
  id,
  attributes: internalAttributes,
  namespaces,
  references,
}: Pick<
  SavedObject<InternalSavedQueryAttributes>,
  'id' | 'attributes' | 'namespaces' | 'references'
>) {
  const attributes: SavedQueryAttributes = omit(internalAttributes, 'titleKeyword');
  const { query } = attributes;
  if (isOfQueryType(query) && typeof query.query === 'string') {
    try {
      const parsed = JSON.parse(query.query);
      query.query = parsed instanceof Object ? parsed : query.query;
    } catch (e) {
      // Just keep it as a string
    }
  }
  const filters = inject(attributes.filters ?? [], references);
  return { id, attributes: { ...attributes, filters }, namespaces };
}

function extractReferences({
  title,
  description,
  query,
  filters = [],
  timefilter,
}: SavedQueryAttributes) {
  const { state: extractedFilters, references } = extract(filters);
  const isOfQueryTypeQuery = isOfQueryType(query);
  let queryString = '';
  if (isOfQueryTypeQuery) {
    if (typeof query.query === 'string') {
      queryString = query.query;
    } else {
      queryString = JSON.stringify(query.query);
    }
  }

  const attributes: InternalSavedQueryAttributes = {
    title: title.trim(),
    titleKeyword: title.trim(),
    description: description.trim(),
    query: {
      ...query,
      ...(queryString && { query: queryString }),
    },
    filters: extractedFilters,
    ...(timefilter && { timefilter }),
  };

  return { attributes, references };
}

function createBadRequestError(message: string): SavedQueryRestResponse {
  return {
    status: 400,
    body: {
      message,
    },
  };
}

function verifySavedQuery({ title, query, filters = [] }: SavedQueryAttributes) {
  if (!isQuery(query)) {
    return createBadRequestError(`Invalid query: ${JSON.stringify(query, null, 2)}`);
  }

  if (!isFilters(filters)) {
    return createBadRequestError(`Invalid filters: ${JSON.stringify(filters, null, 2)}`);
  }

  if (!title.trim().length) {
    return createBadRequestError('Cannot create query without a title');
  }
}

export async function registerSavedQueryRouteHandlerContext(context: RequestHandlerContext) {
  const soClient = (await context.core).savedObjects.client;

  const validateSavedQueryTitle = async (attributes: InternalSavedQueryAttributes, id?: string) => {
    const { savedQueries } = await findSavedQueries({
      page: 1,
      perPage: 1,
      search: attributes.title,
    });
    const existingQuery = savedQueries[0];

    if (
      existingQuery &&
      existingQuery.attributes.title === attributes.title &&
      (!id || existingQuery.id !== id)
    ) {
      return createBadRequestError(`Query with title "${attributes.title}" already exists`);
    }
  };

  const createSavedQuery = async (attrs: SavedQueryAttributes): Promise<SavedQueryRestResponse> => {
    const verifyResult = verifySavedQuery(attrs);

    if (verifyResult) {
      return verifyResult;
    }

    const { attributes, references } = extractReferences(attrs);
    const validateTitleResult = await validateSavedQueryTitle(attributes);

    if (validateTitleResult) {
      return validateTitleResult;
    }

    const savedObject = await soClient.create<InternalSavedQueryAttributes>('query', attributes, {
      references,
    });

    // TODO: Handle properly
    if (savedObject.error) throw new Error(savedObject.error.message);

    return {
      status: 200,
      body: injectReferences(savedObject),
    };
  };

  const updateSavedQuery = async (
    id: string,
    attrs: SavedQueryAttributes
  ): Promise<SavedQueryRestResponse> => {
    const verifyResult = verifySavedQuery(attrs);

    if (verifyResult) {
      return verifyResult;
    }

    const { attributes, references } = extractReferences(attrs);
    const validateTitleResult = await validateSavedQueryTitle(attributes, id);

    if (validateTitleResult) {
      return validateTitleResult;
    }

    const savedObject = await soClient.update<InternalSavedQueryAttributes>(
      'query',
      id,
      attributes,
      {
        references,
      }
    );

    // TODO: Handle properly
    if (savedObject.error) throw new Error(savedObject.error.message);

    return {
      status: 200,
      body: injectReferences({ id, attributes, references }),
    };
  };

  const getSavedQuery = async (id: string): Promise<SavedQueryRestBody> => {
    const { saved_object: savedObject, outcome } =
      await soClient.resolve<InternalSavedQueryAttributes>('query', id);
    if (outcome === 'conflict') {
      throw new Error(`Multiple saved queries found with ID: ${id} (legacy URL alias conflict)`);
    } else if (savedObject.error) {
      throw new Error(savedObject.error.message);
    }
    return injectReferences(savedObject);
  };

  const getSavedQueriesCount = async () => {
    const { total } = await soClient.find<InternalSavedQueryAttributes>({
      type: 'query',
      page: 0,
      perPage: 0,
    });
    return total;
  };

  const findSavedQueries = async ({ page = 1, perPage = 50, search = '' } = {}): Promise<{
    total: number;
    savedQueries: SavedQueryRestBody[];
  }> => {
    const { total, saved_objects: savedObjects } =
      await soClient.find<InternalSavedQueryAttributes>({
        type: 'query',
        page,
        perPage,
        filter: search
          ? nodeBuilder.is('query.attributes.title', nodeTypes.wildcard.buildNode(search))
          : undefined,
        sortField: 'titleKeyword',
        sortOrder: 'asc',
      });

    const savedQueries = savedObjects.map(injectReferences);

    return { total, savedQueries };
  };

  const deleteSavedQuery = async (id: string) => {
    return await soClient.delete('query', id, { force: true });
  };

  return {
    create: createSavedQuery,
    update: updateSavedQuery,
    get: getSavedQuery,
    count: getSavedQueriesCount,
    find: findSavedQueries,
    delete: deleteSavedQuery,
  };
}

export type SavedQueryRouteHandlerContext = CustomRequestHandlerContext<{
  savedQuery: Promise<ReturnType<typeof registerSavedQueryRouteHandlerContext>>;
}>;
