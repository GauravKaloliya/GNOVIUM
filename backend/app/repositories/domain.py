from sqlalchemy import and_, func, or_, text

from app.extensions import db
from app.models import (
    ActivityLog,
    Block,
    Branch,
    BranchMerge,
    Changeset,
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
    Job,
    Notification,
    Property,
    Relation,
    SearchDocument,
    Session,
    Snapshot,
    Tag,
    User,
    Workspace,
    WorkspaceMember,
)
from app.repositories.base import BaseRepository


class UserRepository(BaseRepository):
    model = User

    def find_by_email(self, email):
        return self.query().filter(func.lower(User.email) == email.lower()).first()


class SessionRepository(BaseRepository):
    model = Session

    def find_active_refresh(self, refresh_jti):
        return self.query(include_deleted=True).filter(
            Session.refresh_jti == refresh_jti,
            Session.revoked_at.is_(None),
            Session.expires_at > func.now(),
        ).first()


class WorkspaceRepository(BaseRepository):
    model = Workspace


class WorkspaceMemberRepository(BaseRepository):
    model = WorkspaceMember

    def membership(self, workspace_id, user_id):
        return self.query().filter_by(workspace_id=workspace_id, user_id=user_id).first()


class EntityTypeRepository(BaseRepository):
    model = EntityType


class PropertyRepository(BaseRepository):
    model = Property


class EntityPropertyValueRepository(BaseRepository):
    model = EntityPropertyValue


class EntityRepository(BaseRepository):
    model = Entity


class BlockRepository(BaseRepository):
    model = Block

    def next_position(self, entity_id, parent_block_id=None):
        query = db.session.query(func.coalesce(func.max(Block.position), 0)).filter(
            Block.entity_id == entity_id,
            Block.is_deleted.is_(False),
        )
        if parent_block_id:
            query = query.filter(Block.parent_block_id == parent_block_id)
        else:
            query = query.filter(Block.parent_block_id.is_(None))
        return query.scalar() + 1000


class RelationRepository(BaseRepository):
    model = Relation

    def backlinks(self, entity_id):
        return self.query().filter(Relation.target_entity_id == entity_id).all()

    def neighbors(self, entity_id):
        return self.query().filter(
            or_(Relation.source_entity_id == entity_id, Relation.target_entity_id == entity_id)
        ).all()


class BranchRepository(BaseRepository):
    model = Branch


class SnapshotRepository(BaseRepository):
    model = Snapshot


class ChangesetRepository(BaseRepository):
    model = Changeset


class EntityVersionRepository(BaseRepository):
    model = EntityVersion


class EntityBranchHeadRepository(BaseRepository):
    model = EntityBranchHead


class BranchMergeRepository(BaseRepository):
    model = BranchMerge


class EntityEventRepository(BaseRepository):
    model = EntityEvent


class SearchRepository(BaseRepository):
    model = SearchDocument

    def keyword(self, workspace_id, query, limit=20):
        return SearchDocument.query.filter(
            SearchDocument.workspace_id == workspace_id,
            SearchDocument.is_deleted.is_(False),
            or_(SearchDocument.title.ilike(f"%{query}%"), SearchDocument.content.ilike(f"%{query}%")),
        ).limit(limit).all()

    def postgres_full_text(self, workspace_id, query, limit=20):
        sql = text(
            """
            SELECT *, ts_rank_cd(search_vector, websearch_to_tsquery('english', :query)) AS rank
            FROM search_documents
            WHERE workspace_id = :workspace_id
              AND is_deleted = FALSE
              AND search_vector @@ websearch_to_tsquery('english', :query)
            ORDER BY rank DESC
            LIMIT :limit
            """
        )
        return db.session.execute(sql, {"workspace_id": workspace_id, "query": query, "limit": limit}).mappings().all()


class EmbeddingRepository(BaseRepository):
    model = Embedding


class FileRepository(BaseRepository):
    model = File


class EntityFileRepository(BaseRepository):
    model = EntityFile


class GovernanceReportRepository(BaseRepository):
    model = GovernanceReport


class NotificationRepository(BaseRepository):
    model = Notification


class JobRepository(BaseRepository):
    model = Job


class ActivityLogRepository(BaseRepository):
    model = ActivityLog

    def list_for_workspace(self, workspace_id, page=1, per_page=50):
        return (
            self.query(include_deleted=True)
            .filter(ActivityLog.workspace_id == workspace_id)
            .order_by(ActivityLog.created_at.desc())
            .paginate(page=page, per_page=per_page, error_out=False)
        )


from app.models import BlockVersion, Comment, GraphMaterialization, SyncOperation  # noqa: E402


class BlockVersionRepository(BaseRepository):
    model = BlockVersion

    def list_for_block(self, block_id, page=1, per_page=25):
        return (
            self.query(include_deleted=True)
            .filter(BlockVersion.block_id == block_id)
            .order_by(BlockVersion.created_at.desc())
            .paginate(page=page, per_page=per_page, error_out=False)
        )


class CommentRepository(BaseRepository):
    model = Comment

    def list_for_entity(self, entity_id, page=1, per_page=25):
        return (
            self.query()
            .filter(Comment.entity_id == entity_id, Comment.parent_comment_id.is_(None))
            .order_by(Comment.created_at.asc())
            .paginate(page=page, per_page=per_page, error_out=False)
        )

    def list_replies(self, parent_comment_id, page=1, per_page=25):
        return (
            self.query()
            .filter(Comment.parent_comment_id == parent_comment_id)
            .order_by(Comment.created_at.asc())
            .paginate(page=page, per_page=per_page, error_out=False)
        )


class SyncOperationRepository(BaseRepository):
    model = SyncOperation

    def pending_for_workspace(self, workspace_id, page=1, per_page=100):
        return (
            self.query()
            .filter(SyncOperation.workspace_id == workspace_id, SyncOperation.synced.is_(False))
            .order_by(SyncOperation.created_at.asc())
            .paginate(page=page, per_page=per_page, error_out=False)
        )


class GraphMaterializationRepository(BaseRepository):
    model = GraphMaterialization

    def latest(self, workspace_id):
        return (
            db.session.query(GraphMaterialization)
            .filter(GraphMaterialization.workspace_id == workspace_id)
            .order_by(GraphMaterialization.generated_at.desc())
            .first()
        )


class TagRepository(BaseRepository):
    model = Tag


class EntityTagRepository(BaseRepository):
    model = EntityTag

    def list_for_entity(self, entity_id):
        return self.query().filter(EntityTag.entity_id == entity_id).all()

    def list_for_tag(self, tag_id):
        return self.query().filter(EntityTag.tag_id == tag_id).all()

