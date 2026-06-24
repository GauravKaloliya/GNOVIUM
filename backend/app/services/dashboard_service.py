from datetime import datetime, timedelta, timezone

from flask import current_app
from sqlalchemy import func

from app.extensions import db
from app.models import Block, Comment, Entity, Relation, Workspace


class DashboardService:
    def overview(self, workspace_id):
        now = datetime.now(timezone.utc)
        thirty_days_ago = now - timedelta(days=30)

        entity_count = Entity.query.filter(
            Entity.workspace_id == workspace_id, Entity.is_deleted.is_(False)
        ).count()

        block_count = db.session.query(func.count(Block.id)).filter(
            Block.entity_id.in_(
                db.session.query(Entity.id).filter(
                    Entity.workspace_id == workspace_id, Entity.is_deleted.is_(False)
                )
            ),
            Block.is_deleted.is_(False),
        ).scalar() or 0

        relation_count = Relation.query.filter(
            Relation.workspace_id == workspace_id, Relation.is_deleted.is_(False)
        ).count()

        recent_entities = (
            Entity.query.filter(
                Entity.workspace_id == workspace_id,
                Entity.is_deleted.is_(False),
                Entity.updated_at >= thirty_days_ago,
            )
            .order_by(Entity.updated_at.desc())
            .limit(10)
            .all()
        )

        comment_count = Comment.query.filter(
            Comment.workspace_id == workspace_id, Comment.is_deleted.is_(False)
        ).count()

        if current_app.config.get("GNOVIUM_MODE") == "cloud":
            from app.models import WorkspaceMember
            member_count = WorkspaceMember.query.filter(
                WorkspaceMember.workspace_id == workspace_id, WorkspaceMember.is_deleted.is_(False)
            ).count()
        else:
            member_count = 1

        archived_count = Entity.query.filter(
            Entity.workspace_id == workspace_id,
            Entity.is_deleted.is_(False),
            Entity.is_archived.is_(True),
        ).count()

        return {
            "workspace_id": str(workspace_id),
            "entity_count": entity_count,
            "block_count": block_count,
            "relation_count": relation_count,
            "comment_count": comment_count,
            "member_count": member_count,
            "archived_count": archived_count,
            "recent_entities": [
                {"id": str(e.id), "title": e.title, "updated_at": e.updated_at.isoformat() if e.updated_at else None}
                for e in recent_entities
            ],
        }
