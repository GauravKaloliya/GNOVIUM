import type { Endpoint } from '../types';
import { j, authHeader, workspaceParam, workspaceId, entityId } from '../common';

export const searchEndpoints: Endpoint[] = [
  {
    id: 'search-query',
    module: 'Search',
    method: 'GET',
    path: '/search/',
    summary: 'Search workspace',
    description: 'Searches entities and blocks by keyword, PostgreSQL full text, hybrid, or semantic mode. Hybrid mode combines keyword matching with embedding similarity for the best results.',
    headers: authHeader,
    parameters: [
      workspaceParam,
      { name: 'q', type: 'String', required: true, description: 'Search query. Minimum 1 character.' },
      { name: 'mode', type: 'String', required: false, description: 'Search mode: keyword, full_text, hybrid (default), or semantic.' },
      { name: 'limit', type: 'Integer', required: false, description: 'Maximum results. Range 1–50. Defaults to 20.' },
    ],
    response: j({
      data: [
        { id: entityId, type: 'entity', title: 'Research Notes', content: 'Authentication strategy notes', score: 0.95, updated_at: '2026-06-21T08:30:00Z' },
      ],
      meta: { total: 1, mode: 'hybrid' },
    }),
  },
];
