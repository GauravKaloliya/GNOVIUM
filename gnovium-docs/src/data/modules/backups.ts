import type { Endpoint } from '../types';
import { itemEnvelope, j, authHeader, workspaceId } from '../common';

export const backupEndpoints: Endpoint[] = [
  {
    id: 'backups-export',
    module: 'Backups',
    method: 'POST',
    path: '/backups/export',
    summary: 'Export workspace',
    description: 'Exports all workspace data as a portable JSON bundle. Includes entities, blocks, relations, tags, branches, versions, and file metadata. Works across local and cloud modes.',
    headers: authHeader,
    requestBody: j({ workspace_id: workspaceId }),
    response: j({
      data: {
        workspace_id: workspaceId,
        exported_at: '2026-06-21T12:30:00Z',
        entity_count: 42,
        block_count: 215,
        relation_count: 18,
        tag_count: 5,
        branch_count: 2,
        version_count: 14,
      },
    }),
  },
  {
    id: 'backups-import',
    module: 'Backups',
    method: 'POST',
    path: '/backups/import',
    summary: 'Import workspace',
    description: 'Imports workspace data from a JSON bundle. Creates entities, blocks, relations, tags, and more from the provided data.',
    headers: authHeader,
    requestBody: j({
      workspace_id: workspaceId,
      entities: [{ id: 'fa82a0b1-12c8-47fb-ba2e-ff6a39226cb3', title: 'Research Notes' }],
      blocks: [],
      relations: [],
      tags: [],
    }),
    response: itemEnvelope({
      workspace_id: workspaceId,
      imported_at: '2026-06-21T12:30:00Z',
      entities_imported: 1,
      blocks_imported: 0,
      relations_imported: 0,
    }),
  },
];
