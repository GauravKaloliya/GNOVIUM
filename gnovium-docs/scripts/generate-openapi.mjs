import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const METHODS = ['GET', 'POST', 'PATCH', 'DELETE'];

// Minimal endpoint representation from source
const ENDPOINTS_META = [
  { id: 'health-check', module: 'System', method: 'GET', path: '/health', summary: 'Check API health', description: 'Public liveness endpoint for load balancers, uptime checks, and deployment smoke tests.', tags: ['System'], operationId: 'healthCheck', security: [] },
  { id: 'auth-register', module: 'Auth', method: 'POST', path: '/auth/register', summary: 'Register a user', description: 'Cloud-only. Creates a user account. Passwords must be at least 8 characters.', tags: ['Auth'], operationId: 'authRegister', requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthRegisterRequest' } } } } },
  { id: 'auth-login', module: 'Auth', method: 'POST', path: '/auth/login', summary: 'Log in', description: 'Cloud-only. Authenticates with email and password.', tags: ['Auth'], operationId: 'authLogin', requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthLoginRequest' } } } } },
  { id: 'auth-check-email', module: 'Auth', method: 'GET', path: '/auth/check-email', summary: 'Check email availability', description: 'Cloud-only. Checks whether an email address is already registered. Public endpoint.', tags: ['Auth'], operationId: 'authCheckEmail', security: [] },
  { id: 'auth-google', module: 'Auth', method: 'POST', path: '/auth/google', summary: 'Sign in with Google', description: 'Cloud-only. Authenticates using a Google OAuth credential token.', tags: ['Auth'], operationId: 'authGoogle', security: [] },
  { id: 'auth-refresh', module: 'Auth', method: 'POST', path: '/auth/refresh', summary: 'Refresh access token', description: 'Cloud-only. Uses a valid refresh token to issue a new access token. Only a new access_token is returned — the existing refresh token is reused.', tags: ['Auth'], operationId: 'authRefresh' },
  { id: 'auth-logout', module: 'Auth', method: 'POST', path: '/auth/logout', summary: 'Log out', description: 'Cloud-only. Revokes the current refresh-token session so it cannot be used again.', tags: ['Auth'], operationId: 'authLogout' },
  { id: 'auth-me', module: 'Auth', method: 'GET', path: '/auth/me', summary: 'Get current user', description: 'Cloud-only. Returns the authenticated user\'s profile.', tags: ['Auth'], operationId: 'authMe' },
  { id: 'auth-me-update', module: 'Auth', method: 'PATCH', path: '/auth/me', summary: 'Update current user', description: 'Cloud-only. Partially updates the authenticated user\'s profile.', tags: ['Auth'], operationId: 'authMeUpdate', requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthMeUpdateRequest' } } } } },
  { id: 'workspaces-list', module: 'Workspaces', method: 'GET', path: '/workspaces', summary: 'List workspaces', description: 'Returns workspaces owned by or accessible to the current user.', tags: ['Workspaces'], operationId: 'workspacesList', parameters: [{ name: 'page', in: 'query', schema: { type: 'integer' }, description: 'Page number' }, { name: 'per_page', in: 'query', schema: { type: 'integer' }, description: 'Page size' }] },
  { id: 'workspaces-create', module: 'Workspaces', method: 'POST', path: '/workspaces', summary: 'Create workspace', description: 'Creates a workspace and associates it with the authenticated user.', tags: ['Workspaces'], operationId: 'workspacesCreate', requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateWorkspaceRequest' } } } } },
  { id: 'workspaces-get', module: 'Workspaces', method: 'GET', path: '/workspaces/{id}', summary: 'Get workspace', description: 'Retrieves a single workspace by ID.', tags: ['Workspaces'], operationId: 'workspacesGet', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }] },
  { id: 'workspaces-update', module: 'Workspaces', method: 'PATCH', path: '/workspaces/{id}', summary: 'Update workspace', description: 'Partially updates workspace name, description, or settings.', tags: ['Workspaces'], operationId: 'workspacesUpdate', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }] },
  { id: 'workspaces-delete', module: 'Workspaces', method: 'DELETE', path: '/workspaces/{id}', summary: 'Delete workspace', description: 'Deletes a workspace permanently.', tags: ['Workspaces'], operationId: 'workspacesDelete', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }] },
  { id: 'workspaces-stats', module: 'Workspaces', method: 'GET', path: '/workspaces/{id}/stats', summary: 'Workspace statistics', description: 'Returns workspace health and activity snapshot.', tags: ['Workspaces'], operationId: 'workspacesStats', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }] },
  { id: 'entities-list', module: 'Entities', method: 'GET', path: '/entities', summary: 'List entities', description: 'Returns entities, optionally filtered by workspace and entity type.', tags: ['Entities'], operationId: 'entitiesList', parameters: [{ name: 'workspace_id', in: 'query', schema: { type: 'string', format: 'uuid' } }, { name: 'entity_type_id', in: 'query', schema: { type: 'string', format: 'uuid' } }, { name: 'page', in: 'query', schema: { type: 'integer' } }, { name: 'per_page', in: 'query', schema: { type: 'integer' } }] },
  { id: 'entities-create', module: 'Entities', method: 'POST', path: '/entities', summary: 'Create entity', description: 'Creates a page, record, or graph node inside a workspace.', tags: ['Entities'], operationId: 'entitiesCreate', requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateEntityRequest' } } } } },
  { id: 'entities-get', module: 'Entities', method: 'GET', path: '/entities/{id}', summary: 'Get entity', description: 'Retrieves one entity by ID including its properties and metadata.', tags: ['Entities'], operationId: 'entitiesGet', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }] },
  { id: 'entities-update', module: 'Entities', method: 'PATCH', path: '/entities/{id}', summary: 'Update entity', description: 'Partially updates title, icon, cover image, archive flag, or properties.', tags: ['Entities'], operationId: 'entitiesUpdate', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }] },
  { id: 'entities-delete', module: 'Entities', method: 'DELETE', path: '/entities/{id}', summary: 'Delete entity', description: 'Deletes an entity permanently. Can be restored via POST /entities/{id}/restore.', tags: ['Entities'], operationId: 'entitiesDelete', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }] },
  { id: 'entities-archive', module: 'Entities', method: 'POST', path: '/entities/{id}/archive', summary: 'Archive entity', description: 'Archives an entity.', tags: ['Entities'], operationId: 'entitiesArchive', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }] },
  { id: 'entities-restore', module: 'Entities', method: 'POST', path: '/entities/{id}/restore', summary: 'Restore entity', description: 'Restores a deleted or archived entity.', tags: ['Entities'], operationId: 'entitiesRestore', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }] },
  { id: 'entities-duplicate', module: 'Entities', method: 'POST', path: '/entities/{id}/duplicate', summary: 'Duplicate entity', description: 'Deep copies an entity with all blocks and properties.', tags: ['Entities'], operationId: 'entitiesDuplicate', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }] },
  { id: 'entities-children-list', module: 'Entities', method: 'GET', path: '/entities/{id}/children', summary: 'List child entities', description: 'Returns direct child entities.', tags: ['Entities'], operationId: 'entitiesChildrenList', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }] },
  { id: 'entities-children-create', module: 'Entities', method: 'POST', path: '/entities/{id}/children', summary: 'Create child entity', description: 'Creates a child entity under a parent.', tags: ['Entities'], operationId: 'entitiesChildrenCreate', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }] },
  { id: 'entities-versions', module: 'Entities', method: 'GET', path: '/entities/{id}/versions', summary: 'List entity versions', description: 'Cloud-only. Returns version history for an entity. Returns 404 in local mode.', tags: ['Entities'], operationId: 'entitiesVersions', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }] },
  { id: 'entity-types-list', module: 'Entity Types', method: 'GET', path: '/entities/types', summary: 'List entity types', description: 'Returns entity type definitions for a workspace.', tags: ['Entity Types'], operationId: 'entityTypesList' },
  { id: 'entity-types-create', module: 'Entity Types', method: 'POST', path: '/entities/types', summary: 'Create entity type', description: 'Defines a reusable type for entities.', tags: ['Entity Types'], operationId: 'entityTypesCreate' },
  { id: 'properties-list', module: 'Properties', method: 'GET', path: '/entities/properties', summary: 'List properties', description: 'Returns property definitions.', tags: ['Properties'], operationId: 'propertiesList' },
  { id: 'properties-create', module: 'Properties', method: 'POST', path: '/entities/properties', summary: 'Create property', description: 'Adds a reusable typed property.', tags: ['Properties'], operationId: 'propertiesCreate' },
  { id: 'blocks-list', module: 'Blocks', method: 'GET', path: '/blocks', summary: 'List blocks', description: 'Returns blocks for an entity.', tags: ['Blocks'], operationId: 'blocksList' },
  { id: 'blocks-create', module: 'Blocks', method: 'POST', path: '/blocks', summary: 'Create block', description: 'Creates a block inside an entity.', tags: ['Blocks'], operationId: 'blocksCreate' },
  { id: 'blocks-get', module: 'Blocks', method: 'GET', path: '/blocks/{id}', summary: 'Get block', description: 'Retrieves a single block by ID.', tags: ['Blocks'], operationId: 'blocksGet', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }] },
  { id: 'blocks-update', module: 'Blocks', method: 'PATCH', path: '/blocks/{id}', summary: 'Update block', description: 'Partially updates a block.', tags: ['Blocks'], operationId: 'blocksUpdate', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }] },
  { id: 'blocks-move', module: 'Blocks', method: 'POST', path: '/blocks/{id}/move', summary: 'Move block', description: 'Moves a block to a new parent and/or position.', tags: ['Blocks'], operationId: 'blocksMove', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }] },
  { id: 'blocks-delete', module: 'Blocks', method: 'DELETE', path: '/blocks/{id}', summary: 'Delete block', description: 'Deletes a block permanently.', tags: ['Blocks'], operationId: 'blocksDelete', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }] },
  { id: 'blocks-reorder', module: 'Blocks', method: 'POST', path: '/blocks/reorder', summary: 'Reorder blocks', description: 'Batch-updates block positions.', tags: ['Blocks'], operationId: 'blocksReorder' },
  { id: 'blocks-entity-list', module: 'Blocks', method: 'GET', path: '/blocks/entity/{entity_id}', summary: 'List entity blocks', description: 'Lists all blocks for a specific entity.', tags: ['Blocks'], operationId: 'blocksEntityList', parameters: [{ name: 'entity_id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }] },
  { id: 'tags-list', module: 'Tags', method: 'GET', path: '/tags', summary: 'List tags', description: 'Returns all tags for a workspace.', tags: ['Tags'], operationId: 'tagsList' },
  { id: 'tags-create', module: 'Tags', method: 'POST', path: '/tags', summary: 'Create tag', description: 'Creates a new tag with optional color.', tags: ['Tags'], operationId: 'tagsCreate' },
  { id: 'tags-get', module: 'Tags', method: 'GET', path: '/tags/{id}', summary: 'Get tag', description: 'Retrieves a single tag by ID.', tags: ['Tags'], operationId: 'tagsGet', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }] },
  { id: 'tags-update', module: 'Tags', method: 'PATCH', path: '/tags/{id}', summary: 'Update tag', description: 'Updates a tag\'s name or color.', tags: ['Tags'], operationId: 'tagsUpdate', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }] },
  { id: 'tags-delete', module: 'Tags', method: 'DELETE', path: '/tags/{id}', summary: 'Delete tag', description: 'Permanently deletes a tag.', tags: ['Tags'], operationId: 'tagsDelete', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }] },
  { id: 'tags-tag-entity', module: 'Tags', method: 'POST', path: '/tags/{tag_id}/entities/{entity_id}', summary: 'Tag an entity', description: 'Applies a tag to an entity.', tags: ['Tags'], operationId: 'tagsTagEntity', parameters: [{ name: 'tag_id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }, { name: 'entity_id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }] },
  { id: 'tags-untag-entity', module: 'Tags', method: 'DELETE', path: '/tags/{tag_id}/entities/{entity_id}', summary: 'Untag an entity', description: 'Removes a tag from an entity.', tags: ['Tags'], operationId: 'tagsUntagEntity', parameters: [{ name: 'tag_id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }, { name: 'entity_id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }] },
  { id: 'relations-list', module: 'Relations', method: 'GET', path: '/relations', summary: 'List relations', description: 'Returns graph relations for a workspace.', tags: ['Relations'], operationId: 'relationsList' },
  { id: 'relations-create', module: 'Relations', method: 'POST', path: '/relations', summary: 'Create relation', description: 'Creates a typed edge between two entities.', tags: ['Relations'], operationId: 'relationsCreate' },
  { id: 'relations-get', module: 'Relations', method: 'GET', path: '/relations/{id}', summary: 'Get relation', description: 'Retrieves a single relation by ID.', tags: ['Relations'], operationId: 'relationsGet', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }] },
  { id: 'relations-delete', module: 'Relations', method: 'DELETE', path: '/relations/{id}', summary: 'Delete relation', description: 'Deletes a relation permanently.', tags: ['Relations'], operationId: 'relationsDelete', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }] },
  { id: 'relations-entity', module: 'Relations', method: 'GET', path: '/relations/entity/{entity_id}', summary: 'List outgoing relations', description: 'Returns relations where entity is source.', tags: ['Relations'], operationId: 'relationsEntity', parameters: [{ name: 'entity_id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }] },
  { id: 'relations-backlinks', module: 'Relations', method: 'GET', path: '/relations/backlinks/{entity_id}', summary: 'List backlinks', description: 'Returns relations where entity is target.', tags: ['Relations'], operationId: 'relationsBacklinks', parameters: [{ name: 'entity_id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }] },
  { id: 'relations-neighbors', module: 'Relations', method: 'GET', path: '/relations/neighbors/{entity_id}', summary: 'List graph neighbors', description: 'Returns neighboring entities.', tags: ['Relations'], operationId: 'relationsNeighbors', parameters: [{ name: 'entity_id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }] },
  { id: 'relations-path', module: 'Relations', method: 'GET', path: '/relations/path', summary: 'Find graph path', description: 'Finds shortest path between entities.', tags: ['Relations'], operationId: 'relationsPath' },
  { id: 'comments-list', module: 'Comments', method: 'GET', path: '/comments', summary: 'List comments', description: 'Lists all comments.', tags: ['Comments'], operationId: 'commentsList' },
  { id: 'comments-create', module: 'Comments', method: 'POST', path: '/comments', summary: 'Create comment', description: 'Creates a comment on entity or block.', tags: ['Comments'], operationId: 'commentsCreate' },
  { id: 'comments-get', module: 'Comments', method: 'GET', path: '/comments/{id}', summary: 'Get comment', description: 'Retrieves a single comment.', tags: ['Comments'], operationId: 'commentsGet', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }] },
  { id: 'comments-update', module: 'Comments', method: 'PATCH', path: '/comments/{id}', summary: 'Update comment', description: 'Updates comment text.', tags: ['Comments'], operationId: 'commentsUpdate', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }] },
  { id: 'comments-delete', module: 'Comments', method: 'DELETE', path: '/comments/{id}', summary: 'Delete comment', description: 'Deletes a comment permanently.', tags: ['Comments'], operationId: 'commentsDelete', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }] },
  { id: 'branches-list', module: 'Branches', method: 'GET', path: '/branches', summary: 'List branches', description: 'Returns branches for a workspace.', tags: ['Branches'], operationId: 'branchesList' },
  { id: 'branches-create', module: 'Branches', method: 'POST', path: '/branches', summary: 'Create branch', description: 'Creates a branch for experimentation.', tags: ['Branches'], operationId: 'branchesCreate' },
  { id: 'branches-get', module: 'Branches', method: 'GET', path: '/branches/{id}', summary: 'Get branch', description: 'Retrieves a single branch.', tags: ['Branches'], operationId: 'branchesGet', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }] },
  { id: 'branches-delete', module: 'Branches', method: 'DELETE', path: '/branches/{id}', summary: 'Delete branch', description: 'Permanently deletes a branch.', tags: ['Branches'], operationId: 'branchesDelete', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }] },
  { id: 'branches-merge-by-id', module: 'Branches', method: 'POST', path: '/branches/{id}/merge', summary: 'Merge branch', description: 'Merges a branch into target.', tags: ['Branches'], operationId: 'branchesMergeById', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }] },
  { id: 'branches-merge', module: 'Branches', method: 'POST', path: '/branches/merge', summary: 'Merge two branches', description: 'Merges any two branches.', tags: ['Branches'], operationId: 'branchesMerge' },
  { id: 'versions-changesets-list', module: 'Versions', method: 'GET', path: '/versions/changesets', summary: 'List changesets', description: 'Cloud-only. Returns changesets for a branch.', tags: ['Versions'], operationId: 'versionsChangesetsList' },
  { id: 'versions-changesets-create', module: 'Versions', method: 'POST', path: '/versions/changesets', summary: 'Create changeset', description: 'Cloud-only. Creates a changeset.', tags: ['Versions'], operationId: 'versionsChangesetsCreate' },
  { id: 'versions-snapshots-list', module: 'Versions', method: 'GET', path: '/versions/snapshots', summary: 'List snapshots', description: 'Cloud-only. Returns named snapshots.', tags: ['Versions'], operationId: 'versionsSnapshotsList' },
  { id: 'versions-snapshots-create', module: 'Versions', method: 'POST', path: '/versions/snapshots', summary: 'Create snapshot', description: 'Cloud-only. Creates a named snapshot.', tags: ['Versions'], operationId: 'versionsSnapshotsCreate' },
  { id: 'versions-entity-snapshot', module: 'Versions', method: 'POST', path: '/versions/entities/{entity_id}/snapshot', summary: 'Snapshot entity', description: 'Cloud-only. Captures current entity state.', tags: ['Versions'], operationId: 'versionsEntitySnapshot', parameters: [{ name: 'entity_id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }] },
  { id: 'versions-entities-list', module: 'Versions', method: 'GET', path: '/versions/entities/{entity_id}', summary: 'List entity versions', description: 'Cloud-only. Returns version history.', tags: ['Versions'], operationId: 'versionsEntitiesList', parameters: [{ name: 'entity_id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }] },
  { id: 'versions-blocks-list', module: 'Versions', method: 'GET', path: '/versions/blocks/{block_id}', summary: 'List block versions', description: 'Cloud-only. Returns block version history.', tags: ['Versions'], operationId: 'versionsBlocksList', parameters: [{ name: 'block_id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }] },
  { id: 'versions-compare', module: 'Versions', method: 'GET', path: '/versions/compare', summary: 'Compare versions', description: 'Cloud-only. Field-level diff between versions.', tags: ['Versions'], operationId: 'versionsCompare' },
  { id: 'versions-restore', module: 'Versions', method: 'POST', path: '/versions/restore/{version_id}', summary: 'Restore version', description: 'Cloud-only. Restores entity to a saved version.', tags: ['Versions'], operationId: 'versionsRestore', parameters: [{ name: 'version_id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }] },
  { id: 'diffs-compare', module: 'Diffs', method: 'POST', path: '/diffs/compare', summary: 'Compare snapshots', description: 'Cloud-only. Structured diff between snapshots or branches.', tags: ['Diffs'], operationId: 'diffsCompare' },
  { id: 'search-query', module: 'Search', method: 'GET', path: '/search', summary: 'Search workspace', description: 'Searches entities by keyword or semantic mode.', tags: ['Search'], operationId: 'searchQuery' },
  { id: 'ai-query', module: 'AI', method: 'POST', path: '/ai/query', summary: 'Ask workspace AI', description: 'Natural language question about workspace.', tags: ['AI'], operationId: 'aiQuery' },
  { id: 'files-list', module: 'Files', method: 'GET', path: '/files', summary: 'List files', description: 'Returns file metadata records.', tags: ['Files'], operationId: 'filesList' },
  { id: 'files-upload', module: 'Files', method: 'POST', path: '/files/upload', summary: 'Upload file', description: 'Uploads a file as multipart/form-data.', tags: ['Files'], operationId: 'filesUpload' },
  { id: 'files-create', module: 'Files', method: 'POST', path: '/files', summary: 'Create file metadata', description: 'Creates metadata for uploaded object.', tags: ['Files'], operationId: 'filesCreate' },
  { id: 'files-get', module: 'Files', method: 'GET', path: '/files/{id}', summary: 'Get file metadata', description: 'Retrieves file metadata.', tags: ['Files'], operationId: 'filesGet', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }] },
  { id: 'files-delete', module: 'Files', method: 'DELETE', path: '/files/{id}', summary: 'Delete file', description: 'Deletes a file permanently.', tags: ['Files'], operationId: 'filesDelete', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }] },
  { id: 'files-presign', module: 'Files', method: 'POST', path: '/files/presign', summary: 'Presigned URL (cloud-only)', description: 'Returns an S3 presigned upload URL. Only available in cloud mode; returns 404 in local mode.', tags: ['Files'], operationId: 'filesPresign' },
  { id: 'files-download', module: 'Files', method: 'GET', path: '/files/{id}/download', summary: 'Download file', description: 'Streams file content. Local mode serves from disk; cloud mode redirects to S3.', tags: ['Files'], operationId: 'filesDownload', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }] },
  { id: 'files-cleanup-orphans', module: 'Files', method: 'POST', path: '/files/cleanup-orphans', summary: 'Clean up orphaned files', description: 'Deletes file records with zero entity links (DB + disk).', tags: ['Files'], operationId: 'filesCleanupOrphans' },
  { id: 'files-link-entity', module: 'Files', method: 'POST', path: '/files/{file_id}/entities/{entity_id}', summary: 'Link file to entity', description: 'Associates file with entity.', tags: ['Files'], operationId: 'filesLinkEntity', parameters: [{ name: 'file_id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }, { name: 'entity_id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }] },
  { id: 'graph-get', module: 'Graph', method: 'GET', path: '/graph', summary: 'Get graph', description: 'Returns latest graph snapshot.', tags: ['Graph'], operationId: 'graphGet' },
  { id: 'graph-materialize', module: 'Graph', method: 'POST', path: '/graph/materialize', summary: 'Materialize graph', description: 'Builds fresh graph snapshot.', tags: ['Graph'], operationId: 'graphMaterialize' },
  { id: 'graph-query', module: 'Graph', method: 'POST', path: '/graph/query', summary: 'Query graph', description: 'Filtered graph query.', tags: ['Graph'], operationId: 'graphQuery' },
  { id: 'graph-traverse', module: 'Graph', method: 'POST', path: '/graph/traverse', summary: 'Traverse graph', description: 'BFS traversal from a node.', tags: ['Graph'], operationId: 'graphTraverse' },
  { id: 'graph-paths', module: 'Graph', method: 'POST', path: '/graph/paths', summary: 'Find graph path', description: 'Shortest BFS path between entities.', tags: ['Graph'], operationId: 'graphPaths' },
  { id: 'sync-list', module: 'Sync', method: 'GET', path: '/sync', summary: 'List sync operations', description: 'Cloud-only. Returns sync operations.', tags: ['Sync'], operationId: 'syncList' },
  { id: 'sync-create', module: 'Sync', method: 'POST', path: '/sync', summary: 'Create sync op', description: 'Cloud-only. Creates a sync operation.', tags: ['Sync'], operationId: 'syncCreate' },
  { id: 'sync-get', module: 'Sync', method: 'GET', path: '/sync/{id}', summary: 'Get sync op', description: 'Cloud-only. Retrieves a sync operation.', tags: ['Sync'], operationId: 'syncGet', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }] },
  { id: 'sync-ack', module: 'Sync', method: 'POST', path: '/sync/{id}/ack', summary: 'Acknowledge sync', description: 'Cloud-only. Marks sync as applied.', tags: ['Sync'], operationId: 'syncAck', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }] },
  { id: 'activity-list', module: 'Activity', method: 'GET', path: '/activity', summary: 'List activity', description: 'Returns activity log records.', tags: ['Activity'], operationId: 'activityList' },
  { id: 'governance-health', module: 'Governance', method: 'GET', path: '/governance/health', summary: 'Workspace health', description: 'Returns health report.', tags: ['Governance'], operationId: 'governanceHealth' },
  { id: 'governance-duplicates', module: 'Governance', method: 'GET', path: '/governance/duplicates', summary: 'Find duplicates', description: 'Returns duplicate entities.', tags: ['Governance'], operationId: 'governanceDuplicates' },
  { id: 'governance-orphans', module: 'Governance', method: 'GET', path: '/governance/orphans', summary: 'Find orphans', description: 'Returns orphaned entities.', tags: ['Governance'], operationId: 'governanceOrphans' },
  { id: 'governance-stale', module: 'Governance', method: 'GET', path: '/governance/stale', summary: 'Find stale content', description: 'Returns stale entities.', tags: ['Governance'], operationId: 'governanceStale' },
  { id: 'governance-health-score', module: 'Governance', method: 'POST', path: '/governance/health-score', summary: 'Recalculate health', description: 'Forces fresh health score calculation.', tags: ['Governance'], operationId: 'governanceHealthScore' },
  { id: 'dashboard-overview', module: 'Dashboard', method: 'GET', path: '/dashboard/overview', summary: 'Dashboard overview', description: 'Workspace activity and health snapshot.', tags: ['Dashboard'], operationId: 'dashboardOverview' },
  { id: 'notifications-list', module: 'Notifications', method: 'GET', path: '/notifications', summary: 'List notifications', description: 'Returns notifications.', tags: ['Notifications'], operationId: 'notificationsList' },
  { id: 'notifications-create', module: 'Notifications', method: 'POST', path: '/notifications', summary: 'Create notification', description: 'Creates a notification.', tags: ['Notifications'], operationId: 'notificationsCreate' },
  { id: 'notifications-read', module: 'Notifications', method: 'POST', path: '/notifications/{id}/read', summary: 'Mark read', description: 'Marks notification as read.', tags: ['Notifications'], operationId: 'notificationsRead', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }] },
  { id: 'jobs-list', module: 'Jobs', method: 'GET', path: '/jobs', summary: 'List jobs', description: 'Cloud-only. Returns background job records.', tags: ['Jobs'], operationId: 'jobsList' },
  { id: 'jobs-create', module: 'Jobs', method: 'POST', path: '/jobs', summary: 'Create job', description: 'Cloud-only. Creates a background job.', tags: ['Jobs'], operationId: 'jobsCreate' },
  { id: 'jobs-running', module: 'Jobs', method: 'POST', path: '/jobs/{id}/running', summary: 'Mark running', description: 'Cloud-only. Marks job as running.', tags: ['Jobs'], operationId: 'jobsRunning', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }] },
  { id: 'jobs-completed', module: 'Jobs', method: 'POST', path: '/jobs/{id}/completed', summary: 'Mark completed', description: 'Cloud-only. Marks job as completed.', tags: ['Jobs'], operationId: 'jobsCompleted', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }] },
  { id: 'backups-export', module: 'Backups', method: 'POST', path: '/backups/export', summary: 'Export workspace', description: 'Exports workspace data as a portable JSON bundle.', tags: ['Backups'], operationId: 'backupsExport' },
  { id: 'backups-export-to-disk', module: 'Backups', method: 'POST', path: '/backups/export-to-disk', summary: 'Export workspace to disk', description: 'Writes workspace export JSON to instance/backups/ on the server.', tags: ['Backups'], operationId: 'backupsExportToDisk' },
  { id: 'backups-import', module: 'Backups', method: 'POST', path: '/backups/import', summary: 'Import workspace', description: 'Imports workspace data from a JSON bundle. Note: the files field in the import body is informational only and is not imported.', tags: ['Backups'], operationId: 'backupsImport' },
];

const SCHEMAS = {
  ErrorResponse: {
    type: 'object',
    properties: {
      error: {
        type: 'object',
        properties: {
          code: { type: 'string' },
          message: { type: 'string' },
          details: { type: 'string' },
          request_id: { type: 'string' },
        },
      },
    },
  },
  DataEnvelope: {
    type: 'object',
    properties: {
      data: { type: 'object' },
    },
  },
  ListEnvelope: {
    type: 'object',
    properties: {
      data: { type: 'array', items: { type: 'object' } },
      meta: {
        type: 'object',
        properties: {
          page: { type: 'integer' },
          per_page: { type: 'integer' },
          total: { type: 'integer' },
          pages: { type: 'integer' },
        },
      },
    },
  },
  AuthRegisterRequest: {
    type: 'object',
    required: ['email', 'password', 'name'],
    properties: {
      email: { type: 'string', format: 'email', description: 'User email address' },
      password: { type: 'string', minLength: 8, description: 'Password (min 8 chars)' },
      name: { type: 'string', description: 'Full name' },
    },
  },
  AuthLoginRequest: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: { type: 'string', format: 'email' },
      password: { type: 'string' },
    },
  },
  AuthMeUpdateRequest: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      avatar_url: { type: 'string', format: 'uri' },
    },
  },
  CreateWorkspaceRequest: {
    type: 'object',
    required: ['name'],
    properties: {
      name: { type: 'string', description: 'Workspace name' },
      description: { type: 'string', description: 'Workspace description' },
      settings: { type: 'object', description: 'Flexible workspace settings' },
    },
  },
  CreateEntityRequest: {
    type: 'object',
    required: ['workspace_id', 'entity_type_id', 'title'],
    properties: {
      workspace_id: { type: 'string', format: 'uuid' },
      entity_type_id: { type: 'string', format: 'uuid' },
      title: { type: 'string' },
      icon: { type: 'string' },
      cover_image: { type: 'string', format: 'uri', nullable: true },
      properties: { type: 'object' },
    },
  },
  HealthResponse: {
    type: 'object',
    properties: {
      data: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['healthy', 'degraded', 'unhealthy'] },
          service: { type: 'string' },
          version: { type: 'string' },
          uptime: { type: 'number' },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
};

function toOpenApiPath(p) {
  return p.replace(/<([^>]+)>/g, '{$1}');
}

function buildPaths() {
  const paths = {};
  for (const ep of ENDPOINTS_META) {
    const openApiPath = toOpenApiPath(ep.path);
    if (!paths[openApiPath]) paths[openApiPath] = {};
    const method = ep.method.toLowerCase();
    const responses = {
      '200': { description: 'Success', content: { 'application/json': { schema: { $ref: '#/components/schemas/DataEnvelope' } } } },
      '400': { description: 'Bad Request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      '401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
    };
    const security = ep.security || [{ BearerAuth: [] }];
    paths[openApiPath][method] = {
      tags: ep.tags,
      summary: ep.summary,
      description: ep.description,
      operationId: ep.operationId,
      parameters: ep.parameters || [],
      ...(ep.requestBody ? { requestBody: ep.requestBody } : {}),
      responses,
      security,
    };
  }
  return paths;
}

const spec = {
  openapi: '3.0.3',
  info: {
    title: 'Gnovium Knowledge OS API',
    version: '1.1.0',
    description: `Gnovium API is a local-first Knowledge Operating System API for building applications where knowledge behaves like a living system rather than a collection of disconnected documents.

This API supports:
- Block-based content management with rich text editing
- Structured relational knowledge modeling with typed entities and properties
- Interactive knowledge graph with traversal, pathfinding, and queries
- Git-inspired versioning with branches, snapshots, and visual diffs
- AI-powered semantic search and natural language question answering
- Workspace governance with health scoring and duplicate detection
- Cross-device synchronization with conflict resolution
- File management with presigned URL uploads (cloud mode)

Deployment modes:
- **Local Mode** (default): SQLite storage, offline-first, local AI via Ollama
- **Cloud Mode**: PostgreSQL, S3 storage, managed infrastructure`,
    contact: {
      name: 'Gaurav Kaloliya — Founder & Creator',
      url: 'https://www.linkedin.com/in/gaurav-kaloliya-b44569417',
      email: 'gaurav@gnovium.com',
    },
    license: {
      name: 'MIT',
      url: 'https://github.com/GauravKaloliya/gnovium/blob/main/LICENSE',
    },
    termsOfService: 'https://gnovium.com/terms',
  },
  servers: [
    { url: 'https://api.gnovium.com/api/v1', description: 'Production (Cloud Mode)' },
    { url: 'http://localhost:5000/api/v1', description: 'Local Development (Local Mode)' },
    { url: 'https://staging.api.gnovium.com/api/v1', description: 'Staging' },
  ],
  paths: buildPaths(),
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT access token obtained via OAuth2 or direct login. Format: Bearer <token>',
      },
      ApiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
        description: 'API key for server-to-server authentication. Generate from workspace settings.',
      },
      OAuth2: {
        type: 'oauth2',
        flows: {
          authorizationCode: {
            authorizationUrl: 'https://api.gnovium.com/oauth/authorize',
            tokenUrl: 'https://api.gnovium.com/oauth/token',
            scopes: {
              'workspace:read': 'Read workspace metadata and content',
              'workspace:write': 'Create, update, and delete workspace content',
              'workspace:admin': 'Manage workspace settings, members, and billing',
              'user:read': 'Read user profile information',
              'user:write': 'Update user profile settings',
              'offline_access': 'Receive refresh tokens for long-lived access',
            },
          },
        },
      },
    },
    schemas: SCHEMAS,
  },
  tags: [
    { name: 'System', description: 'Health checks and system information' },
    { name: 'Auth', description: 'Authentication and user management' },
    { name: 'Workspaces', description: 'Workspace CRUD and management' },
    { name: 'Entities', description: 'Entity/page CRUD and management' },
    { name: 'Entity Types', description: 'Entity type definitions' },
    { name: 'Properties', description: 'Property definitions for entity types' },
    { name: 'Blocks', description: 'Content blocks within entities' },
    { name: 'Tags', description: 'Tag management and assignment' },
    { name: 'Relations', description: 'Typed relations between entities' },
    { name: 'Comments', description: 'Comment system with threads' },
    { name: 'Branches', description: 'Version control branches' },
    { name: 'Versions', description: 'Version history and snapshots' },
    { name: 'Diffs', description: 'Comparison between versions' },
    { name: 'Search', description: 'Full-text and semantic search' },
    { name: 'AI', description: 'AI-powered workspace assistant' },
    { name: 'Files', description: 'File upload and management' },
    { name: 'Graph', description: 'Knowledge graph queries' },
    { name: 'Sync', description: 'Cross-device synchronization' },
    { name: 'Activity', description: 'Activity and audit logs' },
    { name: 'Governance', description: 'Workspace health and governance' },
    { name: 'Dashboard', description: 'Workspace dashboard analytics' },
    { name: 'Notifications', description: 'User notifications' },
    { name: 'Jobs', description: 'Background job management' },
    { name: 'Backups', description: 'Workspace export and import' },
  ],
  externalDocs: {
    description: 'Gnovium API Documentation',
    url: 'https://api.gnovium.com/docs',
  },
};

function toYaml(obj, indent = 0) {
  const spaces = '  '.repeat(indent);
  let result = '';
  if (Array.isArray(obj)) {
    if (obj.length === 0) return '[]\n';
    for (const item of obj) {
      if (typeof item === 'object' && item !== null) {
        result += `${spaces}- `;
        const nested = toYaml(item, indent + 1).trimStart();
        const lines = nested.split('\n');
        result += lines[0] + '\n';
        for (let i = 1; i < lines.length; i++) {
          result += `${spaces}  ${lines[i]}\n`;
        }
      } else {
        result += `${spaces}- ${formatYamlValue(item)}\n`;
      }
    }
    return result;
  }
  if (typeof obj === 'object' && obj !== null) {
    const keys = Object.keys(obj);
    if (keys.length === 0) return '{}\n';
    for (const key of keys) {
      const val = obj[key];
      if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
        const nestedKeys = Object.keys(val);
        if (nestedKeys.length > 0) {
          result += `${spaces}${key}:\n`;
          result += toYaml(val, indent + 1);
        } else {
          result += `${spaces}${key}: {}\n`;
        }
      } else if (Array.isArray(val)) {
        result += `${spaces}${key}:\n`;
        result += toYaml(val, indent + 1);
      } else {
        result += `${spaces}${key}: ${formatYamlValue(val)}\n`;
      }
    }
    return result;
  }
  return `${formatYamlValue(obj)}\n`;
}

function formatYamlValue(val) {
  if (val === null || val === undefined) return 'null';
  if (typeof val === 'string') {
    if (val.includes(': ') || val.includes('#') || val.includes('\n') || val === 'true' || val === 'false' || val === 'null') {
      return `"${val.replace(/"/g, '\\"')}"`;
    }
    return val;
  }
  return String(val);
}

const publicDir = path.resolve(__dirname, '..', 'public');

// Write JSON
fs.writeFileSync(path.join(publicDir, 'openapi.json'), JSON.stringify(spec, null, 2), 'utf-8');
console.log('✓ Generated openapi.json');

// Write YAML
const yamlContent = `# Gnovium Knowledge OS API — OpenAPI 3.0.3 Specification
# Generated at ${new Date().toISOString()}

${toYaml(spec)}`;
fs.writeFileSync(path.join(publicDir, 'openapi.yaml'), yamlContent, 'utf-8');
console.log('✓ Generated openapi.yaml');

// Write minimal version for version badge
fs.writeFileSync(path.join(publicDir, 'api-version.json'), JSON.stringify({
  version: spec.info.version,
  specVersion: spec.openapi,
  endpoints: ENDPOINTS_META.length,
  generatedAt: new Date().toISOString(),
}), 'utf-8');
console.log('✓ Generated api-version.json');
