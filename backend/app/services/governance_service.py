from datetime import datetime, timedelta, timezone

from sqlalchemy import func

from app.extensions import db
from app.models import Entity, Relation
from app.repositories import GovernanceReportRepository


class GovernanceService:
    def find_duplicates(self, workspace_id):
        rows = (
            db.session.query(func.lower(Entity.title).label("title"), func.count(Entity.id).label("count"))
            .filter(Entity.workspace_id == workspace_id, Entity.is_deleted.is_(False), Entity.title.isnot(None))
            .group_by(func.lower(Entity.title))
            .having(func.count(Entity.id) > 1)
            .all()
        )
        return [{"title": row.title, "count": row.count} for row in rows]

    def find_orphans(self, workspace_id):
        related_ids = db.session.query(Relation.source_entity_id).filter(Relation.workspace_id == workspace_id).union(
            db.session.query(Relation.target_entity_id).filter(Relation.workspace_id == workspace_id)
        )
        entities = Entity.query.filter(
            Entity.workspace_id == workspace_id,
            Entity.is_deleted.is_(False),
            ~Entity.id.in_(related_ids),
        ).all()
        return [{"id": str(entity.id), "title": entity.title} for entity in entities]

    def find_stale_entities(self, workspace_id, days=90):
        cutoff = datetime.now(timezone.utc) - timedelta(days=days)
        entities = Entity.query.filter(
            Entity.workspace_id == workspace_id,
            Entity.is_deleted.is_(False),
            Entity.updated_at < cutoff,
        ).all()
        return [{"id": str(entity.id), "title": entity.title, "updated_at": entity.updated_at.isoformat()} for entity in entities]

    def calculate_health_score(self, workspace_id):
        duplicates = self.find_duplicates(workspace_id)
        orphans = self.find_orphans(workspace_id)
        stale = self.find_stale_entities(workspace_id)
        total = Entity.query.filter(Entity.workspace_id == workspace_id, Entity.is_deleted.is_(False)).count() or 1
        penalty = min(70, len(duplicates) * 5 + len(orphans) * 2 + len(stale))
        score = max(0, 100 - penalty)
        report = GovernanceReportRepository().create(
            {
                "workspace_id": workspace_id,
                "health_score": score,
                "duplicate_count": len(duplicates),
                "orphan_count": len(orphans),
                "stale_count": len(stale),
                "report": {"duplicates": duplicates, "orphans": orphans, "stale": stale, "entity_count": total},
            }
        )
        db.session.commit()
        return report
