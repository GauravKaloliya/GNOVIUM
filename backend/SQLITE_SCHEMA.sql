-- =============================================
-- GNOVIUM KNOWLEDGE OS - SQLITE SCHEMA (LOCAL MODE)
-- =============================================

PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA recursive_triggers = OFF;

-- =============================================
-- 1. USERS & AUTH
-- =============================================

CREATE TABLE users (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    avatar_url TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT 0
);

CREATE TABLE sessions (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_jti TEXT UNIQUE NOT NULL,
    user_agent TEXT,
    ip_address TEXT,
    revoked_at DATETIME,
    expires_at DATETIME NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 2. WORKSPACES & MEMBERS
-- =============================================

CREATE TABLE workspaces (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    description TEXT,
    settings TEXT DEFAULT '{}' CHECK(json_valid(settings)),
    deployment_mode TEXT CHECK (deployment_mode IN ('local', 'cloud')) DEFAULT 'local',
    sync_enabled BOOLEAN DEFAULT 0,
    cloud_workspace_id TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT 0
);

CREATE TABLE workspace_members (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
    joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX uq_workspace_members_active ON workspace_members(workspace_id, user_id) WHERE is_deleted = 0;

-- =============================================
-- 3. ENTITY TYPES & ENTITIES
-- =============================================

CREATE TABLE entity_types (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    icon TEXT,
    config TEXT DEFAULT '{}' CHECK(json_valid(config)),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT 0,
    UNIQUE(workspace_id, name)
);

CREATE TABLE entities (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    entity_type_id TEXT NOT NULL REFERENCES entity_types(id) ON DELETE RESTRICT,
    title TEXT,
    icon TEXT,
    cover_image TEXT,
    is_archived BOOLEAN NOT NULL DEFAULT 0,
    is_deleted BOOLEAN NOT NULL DEFAULT 0,
    created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 4. BLOCKS & PROPERTIES
-- =============================================

CREATE TABLE blocks (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    entity_id TEXT NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    parent_block_id TEXT REFERENCES blocks(id) ON DELETE CASCADE,
    block_type TEXT NOT NULL,
    position TEXT NOT NULL,
    content TEXT NOT NULL DEFAULT '{}' CHECK(json_valid(content)),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT 0,
    UNIQUE(entity_id, position)
);

CREATE TABLE properties (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    entity_type_id TEXT REFERENCES entity_types(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    property_type TEXT NOT NULL,
    config TEXT DEFAULT '{}' CHECK(json_valid(config)),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT 0,
    UNIQUE(workspace_id, name, entity_type_id)
);

CREATE TABLE entity_property_values (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    entity_id TEXT NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    value TEXT NOT NULL CHECK(json_valid(value)),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX uq_entity_property_values_active 
ON entity_property_values(entity_id, property_id) WHERE is_deleted = 0;

-- =============================================
-- 5. RELATIONS & EVENTS
-- =============================================

CREATE TABLE relations (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    source_entity_id TEXT NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    target_entity_id TEXT NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    relation_type TEXT NOT NULL,
    metadata TEXT DEFAULT '{}' CHECK(json_valid(metadata)),
    created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT 0,
    CHECK (source_entity_id != target_entity_id)
);

CREATE UNIQUE INDEX uq_relations_active 
ON relations(source_entity_id, target_entity_id, relation_type) WHERE is_deleted = 0;

CREATE TABLE entity_events (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    entity_id TEXT NOT NULL REFERENCES entities(id) ON DELETE RESTRICT,
    changeset_id TEXT REFERENCES changesets(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    payload TEXT NOT NULL CHECK(json_valid(payload)),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 6. VERSIONING & BRANCHING
-- =============================================

CREATE TABLE branches (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    parent_branch_id TEXT REFERENCES branches(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_default BOOLEAN DEFAULT 0,
    is_deleted BOOLEAN NOT NULL DEFAULT 0
);

CREATE TABLE snapshots (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    branch_id TEXT NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    name TEXT,
    description TEXT,
    created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE changesets (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    branch_id TEXT NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    snapshot_id TEXT REFERENCES snapshots(id) ON DELETE SET NULL,
    message TEXT,
    created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE entity_versions (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    entity_id TEXT NOT NULL REFERENCES entities(id) ON DELETE RESTRICT,
    changeset_id TEXT REFERENCES changesets(id) ON DELETE SET NULL,
    snapshot TEXT NOT NULL,
    content_hash TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE block_versions (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    block_id TEXT NOT NULL REFERENCES blocks(id) ON DELETE RESTRICT,
    changeset_id TEXT REFERENCES changesets(id) ON DELETE SET NULL,
    snapshot TEXT NOT NULL,
    content_hash TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE entity_branch_heads (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    branch_id TEXT NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    entity_id TEXT NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    current_version_id TEXT REFERENCES entity_versions(id) ON DELETE SET NULL,
    base_version_id TEXT REFERENCES entity_versions(id) ON DELETE SET NULL,
    UNIQUE(branch_id, entity_id)
);

CREATE TABLE branch_merges (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    source_branch_id TEXT NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    target_branch_id TEXT NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    merged_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
    metadata TEXT DEFAULT '{}' CHECK(json_valid(metadata)),
    CHECK (source_branch_id != target_branch_id)
);

CREATE TABLE merge_conflicts (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    merge_id TEXT NOT NULL REFERENCES branch_merges(id) ON DELETE CASCADE,
    entity_id TEXT NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    conflict_type TEXT NOT NULL,
    details TEXT NOT NULL CHECK(json_valid(details)),
    resolved BOOLEAN DEFAULT 0,
    resolved_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    resolution TEXT,
    resolved_at DATETIME
);

-- =============================================
-- 7. AI, SEARCH, FILES, DEVICES & COLLAB
-- =============================================

CREATE TABLE graph_materializations (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    graph_snapshot TEXT NOT NULL,
    generated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version_hash TEXT
);

CREATE TABLE embeddings (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    entity_id TEXT REFERENCES entities(id) ON DELETE CASCADE,
    block_id TEXT REFERENCES blocks(id) ON DELETE CASCADE,
    model TEXT NOT NULL,
    embedding BLOB,
    content_hash TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT 0
);

CREATE VIRTUAL TABLE search_documents_fts USING fts5(title, content);

CREATE TABLE search_documents (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    entity_id TEXT REFERENCES entities(id) ON DELETE CASCADE,
    block_id TEXT REFERENCES blocks(id) ON DELETE CASCADE,
    title TEXT,
    content TEXT,
    content_hash TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT 0
);

CREATE TABLE files (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    mime_type TEXT,
    file_size INTEGER,
    storage_provider TEXT DEFAULT 'local',
    object_key TEXT NOT NULL,
    public_url TEXT,
    uploaded_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    uploaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT 0
);

CREATE TABLE entity_files (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    entity_id TEXT NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    file_id TEXT NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    block_id TEXT REFERENCES blocks(id) ON DELETE SET NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX uq_entity_files_active ON entity_files(entity_id, file_id) WHERE is_deleted = 0;

CREATE TABLE devices (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    device_name TEXT,
    platform TEXT,
    version TEXT,
    last_seen DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- COLLABORATION & GOVERNANCE
-- =============================================

CREATE TABLE comments (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    entity_id TEXT REFERENCES entities(id) ON DELETE CASCADE,
    block_id TEXT REFERENCES blocks(id) ON DELETE CASCADE,
    parent_comment_id TEXT REFERENCES comments(id) ON DELETE CASCADE,
    author_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    content TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT 0
);

CREATE TABLE activity_logs (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    entity_id TEXT REFERENCES entities(id) ON DELETE RESTRICT,
    block_id TEXT REFERENCES blocks(id) ON DELETE RESTRICT,
    action TEXT NOT NULL,
    details TEXT DEFAULT '{}' CHECK(json_valid(details)),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE governance_reports (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    health_score REAL,
    duplicate_count INTEGER DEFAULT 0,
    orphan_count INTEGER DEFAULT 0,
    stale_count INTEGER DEFAULT 0,
    report TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notifications (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    entity_id TEXT REFERENCES entities(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    is_read BOOLEAN DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT 0
);

CREATE TABLE sync_operations (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    operation_type TEXT NOT NULL,
    entity_type TEXT,
    entity_id TEXT,
    payload TEXT NOT NULL CHECK(json_valid(payload)),
    device_id TEXT,
    client_clock INTEGER,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    synced BOOLEAN DEFAULT 0,
    synced_at DATETIME,
    is_deleted BOOLEAN NOT NULL DEFAULT 0
);

CREATE TABLE jobs (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
    job_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    payload TEXT NOT NULL CHECK(json_valid(payload)),
    result TEXT,
    created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    started_at DATETIME,
    completed_at DATETIME,
    is_deleted BOOLEAN NOT NULL DEFAULT 0
);

-- =============================================
-- INDEXES & TRIGGERS
-- =============================================

CREATE INDEX idx_entities_workspace_active ON entities(workspace_id) WHERE is_deleted = 0;
CREATE INDEX idx_blocks_entity_active ON blocks(entity_id) WHERE is_deleted = 0;
CREATE INDEX idx_relations_source_active ON relations(source_entity_id) WHERE is_deleted = 0;
CREATE INDEX idx_entity_versions_entity ON entity_versions(entity_id);
CREATE INDEX idx_block_versions_block ON block_versions(block_id);
CREATE INDEX idx_changesets_branch ON changesets(branch_id);
CREATE INDEX idx_comments_entity ON comments(entity_id) WHERE is_deleted = 0;

-- Safe Updated_at Triggers
CREATE TRIGGER trigger_entities_updated_at AFTER UPDATE ON entities BEGIN
    UPDATE entities SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id AND updated_at != CURRENT_TIMESTAMP;
END;

CREATE TRIGGER trigger_blocks_updated_at AFTER UPDATE ON blocks BEGIN
    UPDATE blocks SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id AND updated_at != CURRENT_TIMESTAMP;
END;

CREATE TRIGGER trigger_comments_updated_at AFTER UPDATE ON comments BEGIN
    UPDATE comments SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id AND updated_at != CURRENT_TIMESTAMP;
END;

CREATE TRIGGER trigger_entity_property_values_updated_at AFTER UPDATE ON entity_property_values BEGIN
    UPDATE entity_property_values SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id AND updated_at != CURRENT_TIMESTAMP;
END;

CREATE TRIGGER trigger_workspace_members_updated_at AFTER UPDATE ON workspace_members BEGIN
    UPDATE workspace_members SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id AND updated_at != CURRENT_TIMESTAMP;
END;