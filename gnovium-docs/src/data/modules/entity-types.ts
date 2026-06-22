import type { Endpoint } from '../types';
import { itemEnvelope, listEnvelope, j, authHeader, paginationParams, workspaceParam, entityTypeId, workspaceId } from '../common';

export const entityTypeEndpoints: Endpoint[] = [
  {
    id: 'entity-types-list',
    module: 'Entity Types',
    method: 'GET',
    path: '/entities/types',
    summary: 'List entity types',
    description: 'Returns entity type definitions for a workspace. Each type defines a reusable schema for entities.',
    headers: authHeader,
    parameters: [{ ...workspaceParam, required: false }, ...paginationParams],
    response: listEnvelope([
      { id: entityTypeId, workspace_id: workspaceId, name: 'Document', icon: 'doc', config: { color: 'blue' } },
    ]),
  },
  {
    id: 'entity-types-create',
    module: 'Entity Types',
    method: 'POST',
    path: '/entities/types',
    summary: 'Create entity type',
    description: 'Defines a reusable type for entities in a workspace. Custom types enable structured knowledge modeling.',
    headers: authHeader,
    requestBody: j({ workspace_id: workspaceId, name: 'Document', icon: 'doc', config: { color: 'blue' } }),
    response: itemEnvelope({ id: entityTypeId, workspace_id: workspaceId, name: 'Document' }),
  },
];
