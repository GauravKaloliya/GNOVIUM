import os

_mode = os.environ.get("GNOVIUM_MODE", "local").strip().lower()

if _mode == "cloud":
    from app.models.domain import (
        ActivityLog,
        Block,
        BlockVersion,
        Branch,
        BranchMerge,
        Changeset,
        Comment,
        Embedding,
        Entity,
        EntityBranchHead,
        EntityEvent,
        EntityFile,
        EntityPropertyValue,
        EntityTag,
        EntityType,
        EntityVersion,
        File,
        GovernanceReport,
        GraphMaterialization,
        Job,
        MergeConflict,
        Notification,
        Property,
        Relation,
        SearchDocument,
        Session,
        Snapshot,
        SyncOperation,
        Tag,
        User,
        Workspace,
        WorkspaceMember,
    )
else:
    from app.models.local import (
        ActivityLog,
        Block,
        Branch,
        BranchHead,
        BranchMerge,
        Comment,
        Embedding,
        Entity,
        EntityBranchHead,
        EntityEvent,
        EntityFile,
        EntityPropertyValue,
        EntityTag,
        EntityType,
        File,
        GovernanceReport,
        GraphMaterialization,
        MergeConflict,
        Notification,
        Property,
        Relation,
        SearchDocument,
        Snapshot,
        SnapshotBlock,
        Tag,
        Workspace,
    )
    # Stubs for cloud-only models — these prevent ImportError in shared modules
    # (e.g. app/repositories/domain.py) that are never loaded in local mode.
    BlockVersion = None
    Changeset = None
    EntityVersion = None
    Job = None
    Session = None
    SyncOperation = None
    User = None
    WorkspaceMember = None
