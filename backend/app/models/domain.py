from datetime import datetime

from sqlalchemy import CheckConstraint, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB, TSVECTOR, UUID

from app.extensions import db
from app.models.base import CreatedOnlyMixin, SoftDeleteMixin, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.types import Vector

FK = UUID(as_uuid=True)


# ─────────────────────────────────────────────
# USERS & AUTH
# ─────────────────────────────────────────────

class User(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, db.Model):
    __tablename__ = "users"

    email = db.Column(db.Text, unique=True, nullable=False)
    name = db.Column(db.Text)
    avatar_url = db.Column(db.Text)
    password_hash = db.Column(db.Text)


class Session(UUIDPrimaryKeyMixin, db.Model):
    __tablename__ = "sessions"

    user_id = db.Column(FK, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    refresh_jti = db.Column(db.Text, unique=True, nullable=False)
    user_agent = db.Column(db.Text)
    ip_address = db.Column(db.Text)
    revoked_at = db.Column(db.DateTime(timezone=True))
    expires_at = db.Column(db.DateTime(timezone=True), nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=datetime.utcnow)


# ─────────────────────────────────────────────
# WORKSPACES
# ─────────────────────────────────────────────

class Workspace(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, db.Model):
    __tablename__ = "workspaces"

    owner_id = db.Column(FK, db.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    name = db.Column(db.Text, nullable=False)
    description = db.Column(db.Text)
    settings = db.Column(JSONB, default=dict)


class WorkspaceMember(UUIDPrimaryKeyMixin, SoftDeleteMixin, db.Model):
    __tablename__ = "workspace_members"

    workspace_id = db.Column(FK, db.ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    user_id = db.Column(FK, db.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    role = db.Column(db.Text, nullable=False)
    joined_at = db.Column(db.DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime(timezone=True), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)


# ─────────────────────────────────────────────
# ENTITY TYPES & ENTITIES
# ─────────────────────────────────────────────

class EntityType(UUIDPrimaryKeyMixin, CreatedOnlyMixin, SoftDeleteMixin, db.Model):
    __tablename__ = "entity_types"
    __table_args__ = (
        UniqueConstraint("workspace_id", "name", name="uq_entity_types_workspace_name"),
    )

    workspace_id = db.Column(FK, db.ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    name = db.Column(db.Text, nullable=False)
    icon = db.Column(db.Text)
    config = db.Column(JSONB, default=dict)


class Entity(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, db.Model):
    __tablename__ = "entities"

    workspace_id = db.Column(FK, db.ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    entity_type_id = db.Column(FK, db.ForeignKey("entity_types.id", ondelete="RESTRICT"), nullable=False)
    title = db.Column(db.Text)
    icon = db.Column(db.Text)
    cover_image = db.Column(db.Text)
    is_archived = db.Column(db.Boolean, nullable=False, default=False)
    created_by = db.Column(FK, db.ForeignKey("users.id", ondelete="SET NULL"))


# ─────────────────────────────────────────────
# BLOCKS
# ─────────────────────────────────────────────

class Block(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, db.Model):
    __tablename__ = "blocks"
    __table_args__ = (
        UniqueConstraint("entity_id", "position", name="uq_blocks_entity_position"),
    )

    entity_id = db.Column(FK, db.ForeignKey("entities.id", ondelete="CASCADE"), nullable=False)
    parent_block_id = db.Column(FK, db.ForeignKey("blocks.id", ondelete="CASCADE"))
    block_type = db.Column(db.Text, nullable=False)
    position = db.Column(db.Numeric(20, 10), nullable=False)
    content = db.Column(JSONB, nullable=False, default=dict)


# ─────────────────────────────────────────────
# PROPERTIES
# ─────────────────────────────────────────────

class Property(UUIDPrimaryKeyMixin, CreatedOnlyMixin, SoftDeleteMixin, db.Model):
    __tablename__ = "properties"
    __table_args__ = (
        UniqueConstraint("workspace_id", "name", "entity_type_id", name="uq_properties_workspace_name_type"),
    )

    workspace_id = db.Column(FK, db.ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    entity_type_id = db.Column(FK, db.ForeignKey("entity_types.id", ondelete="RESTRICT"))
    name = db.Column(db.Text, nullable=False)
    property_type = db.Column(db.Text, nullable=False)
    config = db.Column(JSONB, default=dict)


class EntityPropertyValue(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, db.Model):
    __tablename__ = "entity_property_values"

    entity_id = db.Column(FK, db.ForeignKey("entities.id", ondelete="CASCADE"), nullable=False)
    property_id = db.Column(FK, db.ForeignKey("properties.id", ondelete="CASCADE"), nullable=False)
    value = db.Column(JSONB, nullable=False)


# ─────────────────────────────────────────────
# KNOWLEDGE GRAPH
# ─────────────────────────────────────────────

class Relation(UUIDPrimaryKeyMixin, CreatedOnlyMixin, SoftDeleteMixin, db.Model):
    __tablename__ = "relations"
    __table_args__ = (
        CheckConstraint("source_entity_id != target_entity_id", name="no_self_relation"),
        UniqueConstraint("source_entity_id", "target_entity_id", "relation_type", name="unique_relation"),
    )

    workspace_id = db.Column(FK, db.ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    source_entity_id = db.Column(FK, db.ForeignKey("entities.id", ondelete="CASCADE"), nullable=False)
    target_entity_id = db.Column(FK, db.ForeignKey("entities.id", ondelete="CASCADE"), nullable=False)
    relation_type = db.Column(db.Text, nullable=False)
    relation_metadata = db.Column("metadata", JSONB, default=dict)
    created_by = db.Column(FK, db.ForeignKey("users.id", ondelete="SET NULL"))


# ─────────────────────────────────────────────
# VERSIONING & BRANCHING
# ─────────────────────────────────────────────

class Branch(UUIDPrimaryKeyMixin, CreatedOnlyMixin, SoftDeleteMixin, db.Model):
    __tablename__ = "branches"

    workspace_id = db.Column(FK, db.ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    parent_branch_id = db.Column(FK, db.ForeignKey("branches.id", ondelete="SET NULL"))
    name = db.Column(db.Text, nullable=False)
    description = db.Column(db.Text)
    created_by = db.Column(FK, db.ForeignKey("users.id", ondelete="SET NULL"))
    is_default = db.Column(db.Boolean, default=False)


class Snapshot(UUIDPrimaryKeyMixin, CreatedOnlyMixin, db.Model):
    __tablename__ = "snapshots"

    branch_id = db.Column(FK, db.ForeignKey("branches.id", ondelete="CASCADE"), nullable=False)
    name = db.Column(db.Text)
    description = db.Column(db.Text)
    created_by = db.Column(FK, db.ForeignKey("users.id", ondelete="SET NULL"))


class Changeset(UUIDPrimaryKeyMixin, CreatedOnlyMixin, db.Model):
    __tablename__ = "changesets"

    branch_id = db.Column(FK, db.ForeignKey("branches.id", ondelete="CASCADE"), nullable=False)
    snapshot_id = db.Column(FK, db.ForeignKey("snapshots.id", ondelete="SET NULL"))
    message = db.Column(db.Text)
    created_by = db.Column(FK, db.ForeignKey("users.id", ondelete="SET NULL"))


class EntityVersion(UUIDPrimaryKeyMixin, CreatedOnlyMixin, db.Model):
    __tablename__ = "entity_versions"

    entity_id = db.Column(FK, db.ForeignKey("entities.id", ondelete="RESTRICT"), nullable=False)
    changeset_id = db.Column(FK, db.ForeignKey("changesets.id", ondelete="SET NULL"))
    snapshot = db.Column(JSONB, nullable=False)
    content_hash = db.Column(db.Text, nullable=False)


class BlockVersion(UUIDPrimaryKeyMixin, CreatedOnlyMixin, db.Model):
    __tablename__ = "block_versions"

    block_id = db.Column(FK, db.ForeignKey("blocks.id", ondelete="RESTRICT"), nullable=False)
    changeset_id = db.Column(FK, db.ForeignKey("changesets.id", ondelete="SET NULL"))
    snapshot = db.Column(JSONB, nullable=False)
    content_hash = db.Column(db.Text, nullable=False)


class EntityBranchHead(UUIDPrimaryKeyMixin, db.Model):
    __tablename__ = "entity_branch_heads"
    __table_args__ = (
        UniqueConstraint("branch_id", "entity_id", name="uq_entity_branch_heads"),
    )

    branch_id = db.Column(FK, db.ForeignKey("branches.id", ondelete="CASCADE"), nullable=False)
    entity_id = db.Column(FK, db.ForeignKey("entities.id", ondelete="CASCADE"), nullable=False)
    current_version_id = db.Column(FK, db.ForeignKey("entity_versions.id", ondelete="SET NULL"))
    base_version_id = db.Column(FK, db.ForeignKey("entity_versions.id", ondelete="SET NULL"))


class BranchMerge(UUIDPrimaryKeyMixin, db.Model):
    __tablename__ = "branch_merges"
    __table_args__ = (
        CheckConstraint("source_branch_id != target_branch_id", name="no_self_merge"),
    )

    source_branch_id = db.Column(FK, db.ForeignKey("branches.id", ondelete="CASCADE"), nullable=False)
    target_branch_id = db.Column(FK, db.ForeignKey("branches.id", ondelete="CASCADE"), nullable=False)
    created_by = db.Column(FK, db.ForeignKey("users.id", ondelete="SET NULL"))
    merged_at = db.Column(db.DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    status = db.Column(db.Text, nullable=False, default="completed")
    merge_metadata = db.Column("metadata", JSONB, default=dict)


class MergeConflict(UUIDPrimaryKeyMixin, db.Model):
    __tablename__ = "merge_conflicts"

    merge_id = db.Column(FK, db.ForeignKey("branch_merges.id", ondelete="CASCADE"), nullable=False)
    entity_id = db.Column(FK, db.ForeignKey("entities.id", ondelete="CASCADE"), nullable=False)
    conflict_type = db.Column(db.Text, nullable=False)
    details = db.Column(JSONB, nullable=False)
    resolved = db.Column(db.Boolean, default=False)
    resolved_by = db.Column(FK, db.ForeignKey("users.id", ondelete="SET NULL"))
    resolution = db.Column(db.Text)
    resolved_at = db.Column(db.DateTime(timezone=True))


class EntityEvent(UUIDPrimaryKeyMixin, CreatedOnlyMixin, db.Model):
    __tablename__ = "entity_events"

    entity_id = db.Column(FK, db.ForeignKey("entities.id", ondelete="RESTRICT"), nullable=False)
    changeset_id = db.Column(FK, db.ForeignKey("changesets.id", ondelete="SET NULL"))
    event_type = db.Column(db.Text, nullable=False)
    payload = db.Column(JSONB, nullable=False)


# ─────────────────────────────────────────────
# AI / SEARCH / FILES / COLLAB
# ─────────────────────────────────────────────

class Embedding(UUIDPrimaryKeyMixin, CreatedOnlyMixin, SoftDeleteMixin, db.Model):
    __tablename__ = "embeddings"

    workspace_id = db.Column(FK, db.ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    entity_id = db.Column(FK, db.ForeignKey("entities.id", ondelete="CASCADE"))
    block_id = db.Column(FK, db.ForeignKey("blocks.id", ondelete="CASCADE"))
    model = db.Column(db.Text, nullable=False)
    embedding = db.Column(Vector(1024))
    content_hash = db.Column(db.Text, nullable=False)


class SearchDocument(UUIDPrimaryKeyMixin, CreatedOnlyMixin, SoftDeleteMixin, db.Model):
    __tablename__ = "search_documents"

    workspace_id = db.Column(FK, db.ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    entity_id = db.Column(FK, db.ForeignKey("entities.id", ondelete="CASCADE"))
    block_id = db.Column(FK, db.ForeignKey("blocks.id", ondelete="CASCADE"))
    title = db.Column(db.Text)
    content = db.Column(db.Text)
    content_hash = db.Column(db.Text, nullable=False)
    search_vector = db.Column(TSVECTOR)


class File(UUIDPrimaryKeyMixin, SoftDeleteMixin, db.Model):
    __tablename__ = "files"

    workspace_id = db.Column(FK, db.ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    file_name = db.Column(db.Text, nullable=False)
    mime_type = db.Column(db.Text)
    file_size = db.Column(db.BigInteger)
    storage_provider = db.Column(db.Text, default="aws_s3")
    object_key = db.Column(db.Text, nullable=False)
    public_url = db.Column(db.Text)
    uploaded_by = db.Column(FK, db.ForeignKey("users.id", ondelete="SET NULL"))
    uploaded_at = db.Column(db.DateTime(timezone=True), nullable=False, default=datetime.utcnow)


class EntityFile(UUIDPrimaryKeyMixin, CreatedOnlyMixin, SoftDeleteMixin, db.Model):
    __tablename__ = "entity_files"

    entity_id = db.Column(FK, db.ForeignKey("entities.id", ondelete="CASCADE"), nullable=False)
    file_id = db.Column(FK, db.ForeignKey("files.id", ondelete="CASCADE"), nullable=False)
    block_id = db.Column(FK, db.ForeignKey("blocks.id", ondelete="SET NULL"))


class Comment(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, db.Model):
    __tablename__ = "comments"

    workspace_id = db.Column(FK, db.ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    entity_id = db.Column(FK, db.ForeignKey("entities.id", ondelete="CASCADE"))
    block_id = db.Column(FK, db.ForeignKey("blocks.id", ondelete="CASCADE"))
    parent_comment_id = db.Column(FK, db.ForeignKey("comments.id", ondelete="CASCADE"))
    author_id = db.Column(FK, db.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    content = db.Column(db.Text, nullable=False)


class ActivityLog(UUIDPrimaryKeyMixin, CreatedOnlyMixin, db.Model):
    __tablename__ = "activity_logs"

    workspace_id = db.Column(FK, db.ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    user_id = db.Column(FK, db.ForeignKey("users.id", ondelete="SET NULL"))
    entity_id = db.Column(FK, db.ForeignKey("entities.id", ondelete="RESTRICT"))
    block_id = db.Column(FK, db.ForeignKey("blocks.id", ondelete="RESTRICT"))
    action = db.Column(db.Text, nullable=False)
    details = db.Column(JSONB, default=dict)


class GovernanceReport(UUIDPrimaryKeyMixin, CreatedOnlyMixin, db.Model):
    __tablename__ = "governance_reports"

    workspace_id = db.Column(FK, db.ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    health_score = db.Column(db.Numeric(5, 2))
    duplicate_count = db.Column(db.Integer, default=0)
    orphan_count = db.Column(db.Integer, default=0)
    stale_count = db.Column(db.Integer, default=0)
    report = db.Column(JSONB)


class Notification(UUIDPrimaryKeyMixin, CreatedOnlyMixin, SoftDeleteMixin, db.Model):
    __tablename__ = "notifications"

    workspace_id = db.Column(FK, db.ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    user_id = db.Column(FK, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    entity_id = db.Column(FK, db.ForeignKey("entities.id", ondelete="CASCADE"))
    type = db.Column(db.Text, nullable=False)
    title = db.Column(db.Text, nullable=False)
    message = db.Column(db.Text)
    is_read = db.Column(db.Boolean, default=False)


class GraphMaterialization(UUIDPrimaryKeyMixin, db.Model):
    __tablename__ = "graph_materializations"

    workspace_id = db.Column(FK, db.ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    graph_snapshot = db.Column(JSONB, nullable=False)
    generated_at = db.Column(db.DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    version_hash = db.Column(db.Text)


class SyncOperation(UUIDPrimaryKeyMixin, CreatedOnlyMixin, SoftDeleteMixin, db.Model):
    __tablename__ = "sync_operations"

    workspace_id = db.Column(FK, db.ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    operation_type = db.Column(db.Text, nullable=False)
    entity_type = db.Column(db.Text)
    entity_id = db.Column(FK)
    payload = db.Column(JSONB, nullable=False)
    device_id = db.Column(db.Text)
    client_clock = db.Column(db.BigInteger)
    synced = db.Column(db.Boolean, default=False)
    synced_at = db.Column(db.DateTime(timezone=True))


class Job(UUIDPrimaryKeyMixin, CreatedOnlyMixin, SoftDeleteMixin, db.Model):
    __tablename__ = "jobs"

    workspace_id = db.Column(FK, db.ForeignKey("workspaces.id", ondelete="CASCADE"))
    job_type = db.Column(db.Text, nullable=False)
    status = db.Column(db.Text, nullable=False, default="pending")
    payload = db.Column(JSONB, nullable=False)
    result = db.Column(JSONB)
    created_by = db.Column(FK, db.ForeignKey("users.id", ondelete="SET NULL"))
    started_at = db.Column(db.DateTime(timezone=True))
    completed_at = db.Column(db.DateTime(timezone=True))
