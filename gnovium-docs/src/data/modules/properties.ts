import type { Endpoint } from '../types';
import { itemEnvelope, listEnvelope, j, authHeader, paginationParams, workspaceParam, entityTypeId, workspaceId } from '../common';

export const propertyEndpoints: Endpoint[] = [
  {
    id: 'properties-list',
    module: 'Properties',
    method: 'GET',
    path: '/entities/properties',
    summary: 'List properties',
    description: 'Returns property definitions for a workspace or entity type. Properties define the schema for entity metadata.',
    headers: authHeader,
    parameters: [{ ...workspaceParam, required: false }, ...paginationParams],
    response: listEnvelope([
      { id: 'd50b44d3-c5e4-407b-a15b-ec5ea6cb9831', workspace_id: workspaceId, entity_type_id: entityTypeId, name: 'Status', property_type: 'select' },
    ]),
  },
  {
    id: 'properties-create',
    module: 'Properties',
    method: 'POST',
    path: '/entities/properties',
    summary: 'Create property',
    description: 'Adds a reusable typed property to a workspace or entity type. Supported types: text, number, select, multi_select, date, boolean, url.',
    headers: authHeader,
    requestBody: j({
      workspace_id: workspaceId,
      entity_type_id: entityTypeId,
      name: 'Status',
      property_type: 'select',
      config: { options: ['active', 'review', 'archived'] },
    }),
    response: itemEnvelope({ id: 'd50b44d3-c5e4-407b-a15b-ec5ea6cb9831', name: 'Status', property_type: 'select' }),
  },
];
