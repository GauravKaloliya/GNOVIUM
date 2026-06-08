-- =============================================
-- GNOVIUM KNOWLEDGE OS - SCHEMA
-- Production-Grade Knowledge Operating System
-- =============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- =============================================
-- USERS & WORKSPACES
-- =============================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    avatar_url TEXT,
    password_hash TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_jti TEXT UNIQUE NOT NULL,
    user_agent TEXT,
    ip_address TEXT,
    revoked_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    description TEXT,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE workspace_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

-- =============================================
-- ENTITY TYPES & ENTITIES
-- =============================================

CREATE TABLE entity_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    icon TEXT,
    config JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    UNIQUE(workspace_id, name)
);

CREATE TABLE entities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    entity_type_id UUID NOT NULL REFERENCES entity_types(id) ON DELETE RESTRICT,
    title TEXT,
    icon TEXT,
    cover_image TEXT,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- BLOCKS
-- =============================================

CREATE TABLE blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    parent_block_id UUID REFERENCES blocks(id) ON DELETE CASCADE,
    block_type TEXT NOT NULL,
    position NUMERIC(20,10) NOT NULL,
    content JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    UNIQUE(entity_id, position)
);

-- =============================================
-- PROPERTIES
-- =============================================

CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    entity_type_id UUID REFERENCES entity_types(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    property_type TEXT NOT NULL,
    config JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    UNIQUE(workspace_id, name, entity_type_id)
);

CREATE TABLE entity_property_values (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    value JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

-- =============================================
-- KNOWLEDGE GRAPH
-- =============================================

CREATE TABLE relations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    source_entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    target_entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    relation_type TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT no_self_relation CHECK (source_entity_id != target_entity_id),
    CONSTRAINT unique_relation UNIQUE(source_entity_id, target_entity_id, relation_type)
);

-- =============================================
-- VERSIONING & BRANCHING (History Protected)
-- =============================================

CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    parent_branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_default BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    name TEXT,
    description TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE changesets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    snapshot_id UUID REFERENCES snapshots(id) ON DELETE SET NULL,
    message TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE entity_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE RESTRICT,  -- Protected
    changeset_id UUID REFERENCES changesets(id) ON DELETE SET NULL,
    snapshot JSONB NOT NULL,
    content_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE block_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    block_id UUID NOT NULL REFERENCES blocks(id) ON DELETE RESTRICT,   -- Protected
    changeset_id UUID REFERENCES changesets(id) ON DELETE SET NULL,
    snapshot JSONB NOT NULL,
    content_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE entity_branch_heads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    current_version_id UUID REFERENCES entity_versions(id) ON DELETE SET NULL,
    base_version_id UUID REFERENCES entity_versions(id) ON DELETE SET NULL,
    UNIQUE(branch_id, entity_id)
);

CREATE TABLE branch_merges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    target_branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    merged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    status TEXT NOT NULL DEFAULT 'completed' 
        CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
    metadata JSONB DEFAULT '{}',
    CONSTRAINT no_self_merge CHECK (source_branch_id != target_branch_id)
);

CREATE TABLE merge_conflicts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merge_id UUID NOT NULL REFERENCES branch_merges(id) ON DELETE CASCADE,
    entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    conflict_type TEXT NOT NULL,
    details JSONB NOT NULL,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    resolution TEXT,
    resolved_at TIMESTAMPTZ
);

CREATE TABLE entity_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE RESTRICT,  -- Protected
    changeset_id UUID REFERENCES changesets(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- AI / SEARCH / FILES / COLLAB
-- =============================================

CREATE TABLE embeddings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    entity_id UUID REFERENCES entities(id) ON DELETE CASCADE,
    block_id UUID REFERENCES blocks(id) ON DELETE CASCADE,
    model TEXT NOT NULL,
    embedding VECTOR(1024),
    content_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE search_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    entity_id UUID REFERENCES entities(id) ON DELETE CASCADE,
    block_id UUID REFERENCES blocks(id) ON DELETE CASCADE,
    title TEXT,
    content TEXT,
    content_hash TEXT NOT NULL,
    search_vector TSVECTOR,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    mime_type TEXT,
    file_size BIGINT,
    storage_provider TEXT DEFAULT 'aws_s3',
    object_key TEXT NOT NULL,
    public_url TEXT,
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE entity_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    block_id UUID REFERENCES blocks(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    entity_id UUID REFERENCES entities(id) ON DELETE CASCADE,
    block_id UUID REFERENCES blocks(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    entity_id UUID REFERENCES entities(id) ON DELETE RESTRICT,   -- Protected
    block_id UUID REFERENCES blocks(id) ON DELETE RESTRICT,
    action TEXT NOT NULL,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE governance_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    health_score NUMERIC(5,2),
    duplicate_count INTEGER DEFAULT 0,
    orphan_count INTEGER DEFAULT 0,
    stale_count INTEGER DEFAULT 0,
    report JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    entity_id UUID REFERENCES entities(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE graph_materializations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    graph_snapshot JSONB NOT NULL,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    version_hash TEXT
);

CREATE TABLE sync_operations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    operation_type TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    payload JSONB NOT NULL,
    device_id TEXT,
    client_clock BIGINT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    synced BOOLEAN DEFAULT FALSE,
    synced_at TIMESTAMPTZ,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    job_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    payload JSONB NOT NULL,
    result JSONB,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

-- =============================================
-- PARTIAL UNIQUE INDEXES (Soft-Delete Safe)
-- =============================================

CREATE UNIQUE INDEX uq_workspace_members_active 
    ON workspace_members(workspace_id, user_id) 
    WHERE is_deleted = FALSE;

CREATE UNIQUE INDEX uq_entity_files_active 
    ON entity_files(entity_id, file_id) 
    WHERE is_deleted = FALSE;

CREATE UNIQUE INDEX uq_entity_property_values_active 
    ON entity_property_values(entity_id, property_id) 
    WHERE is_deleted = FALSE;

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX idx_entities_workspace_active ON entities(workspace_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_sessions_user_active ON sessions(user_id, expires_at) WHERE revoked_at IS NULL;
CREATE INDEX idx_blocks_entity_active ON blocks(entity_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_relations_source_active ON relations(source_entity_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_search_vector_active ON search_documents USING GIN(search_vector) WHERE is_deleted = FALSE;
CREATE INDEX idx_activity_logs_workspace ON activity_logs(workspace_id, created_at DESC);
CREATE INDEX idx_branches_workspace ON branches(workspace_id);
CREATE INDEX idx_entity_branch_heads_branch ON entity_branch_heads(branch_id);
CREATE INDEX idx_entity_versions_entity ON entity_versions(entity_id);
CREATE INDEX idx_entity_property_values_entity ON entity_property_values(entity_id) WHERE is_deleted = FALSE;

-- =============================================
-- TRIGGERS
-- =============================================

CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_entities_updated_at BEFORE UPDATE ON entities FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trigger_blocks_updated_at BEFORE UPDATE ON blocks FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trigger_comments_updated_at BEFORE UPDATE ON comments FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trigger_entity_property_values_updated_at BEFORE UPDATE ON entity_property_values FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trigger_workspace_members_updated_at BEFORE UPDATE ON workspace_members FOR EACH ROW EXECUTE FUNCTION update_timestamp();
