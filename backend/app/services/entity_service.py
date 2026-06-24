import hashlib
import json

from flask import current_app

from datetime import datetime

from app.events.service import EventService
from app.extensions import db
from app.models import Block, Comment, Embedding, Entity, Notification
from app.repositories import (
    EntityFileRepository,
    EntityPropertyValueRepository,
    EntityRepository,
    EntityTagRepository,
    EntityTypeRepository,
    PropertyRepository,
    RelationRepository,
)
from app.services.search_service import SearchService


def content_hash(payload):
    return hashlib.sha256(json.dumps(payload, sort_keys=True, default=str).encode()).hexdigest()


def _maybe_create_job(workspace_id, entity_id, user_id):
    if current_app.config.get("GNOVIUM_MODE") == "cloud":
        from app.repositories import JobRepository
        JobRepository().create(
            {
                "workspace_id": workspace_id,
                "job_type": "embedding.generate",
                "payload": {"entity_id": str(entity_id)},
                "created_by": user_id,
            }
        )


class EntityService:
    def create_type(self, data):
        entity_type = EntityTypeRepository().create(data)
        db.session.commit()
        return entity_type

    def create_property(self, data):
        prop = PropertyRepository().create(data)
        db.session.commit()
        return prop

    def create(self, data, user_id):
        properties = data.pop("properties", {})
        entity = EntityRepository().create({**data, "created_by": user_id})
        db.session.flush()
        self._upsert_properties(entity.id, properties)
        SearchService().rebuild_entity_index(entity.id)
        _maybe_create_job(entity.workspace_id, entity.id, user_id)
        EventService().entity_event(entity.id, "entity.created", {"title": entity.title})
        db.session.commit()
        return entity

    def update(self, entity_id, data, user_id):
        repo = EntityRepository()
        entity = repo.get(entity_id)
        properties = data.pop("properties", None)
        repo.update(entity, data)
        if properties is not None:
            self._upsert_properties(entity.id, properties)
        SearchService().rebuild_entity_index(entity.id)
        EventService().entity_event(entity.id, "entity.updated", data)
        _maybe_create_job(entity.workspace_id, entity.id, user_id)
        db.session.commit()
        return entity

    def soft_delete(self, entity_id, user_id=None):
        entity = EntityRepository().get(entity_id)
        now = datetime.utcnow()
        EntityRepository().soft_delete(entity, deleted_by=user_id)

        from app.models import Block, Comment, Embedding, Notification
        from app.repositories import (
            EntityFileRepository,
            EntityPropertyValueRepository,
            EntityTagRepository,
        )

        Block.query.filter(
            Block.entity_id == str(entity_id),
            Block.is_deleted.is_(False),
        ).update({"is_deleted": True, "deleted_at": now, "deleted_by": str(user_id) if user_id else None})

        EntityPropertyValueRepository().query().filter_by(entity_id=str(entity_id)).update(
            {"is_deleted": True, "deleted_at": now, "deleted_by": str(user_id) if user_id else None}
        )

        for rel in RelationRepository().query().filter(
            db.or_(
                Relation.source_entity_id == str(entity_id),
                Relation.target_entity_id == str(entity_id),
            )
        ).all():
            RelationRepository().soft_delete(rel, deleted_by=user_id)

        EntityTagRepository().query().filter_by(entity_id=str(entity_id)).update(
            {"is_deleted": True, "deleted_at": now, "deleted_by": str(user_id) if user_id else None}
        )

        EntityFileRepository().query().filter_by(entity_id=str(entity_id)).update(
            {"is_deleted": True, "deleted_at": now, "deleted_by": str(user_id) if user_id else None}
        )

        Comment.query.filter(
            Comment.entity_id == str(entity_id),
            Comment.is_deleted.is_(False),
        ).update({"is_deleted": True, "deleted_at": now, "deleted_by": str(user_id) if user_id else None})

        Embedding.query.filter(
            Embedding.entity_id == str(entity_id),
            Embedding.is_deleted.is_(False),
        ).update({"is_deleted": True, "deleted_at": now, "deleted_by": str(user_id) if user_id else None})

        Notification.query.filter(
            Notification.entity_id == str(entity_id),
            Notification.is_deleted.is_(False),
        ).update({"is_deleted": True, "deleted_at": now, "deleted_by": str(user_id) if user_id else None})

        SearchService().delete_entity_index(entity_id)
        EventService().entity_event(entity.id, "entity.deleted", {})
        db.session.commit()
        return entity

    def restore(self, entity_id, user_id=None):
        entity = EntityRepository().get(entity_id, include_deleted=True)
        entity.is_deleted = False
        entity.deleted_at = None
        entity.deleted_by = None

        from app.repositories import EntityFileRepository, EntityPropertyValueRepository, EntityTagRepository

        Block.query.filter(
            Block.entity_id == str(entity_id),
            Block.is_deleted.is_(True),
        ).update({"is_deleted": False, "deleted_at": None, "deleted_by": None})

        EntityPropertyValueRepository().query().filter_by(entity_id=str(entity_id), is_deleted=True).update(
            {"is_deleted": False, "deleted_at": None, "deleted_by": None}
        )

        for rel in RelationRepository().query(include_deleted=True).filter(
            db.or_(
                Relation.source_entity_id == str(entity_id),
                Relation.target_entity_id == str(entity_id),
            ),
            Relation.is_deleted.is_(True),
        ).all():
            rel.is_deleted = False
            rel.deleted_at = None
            rel.deleted_by = None

        EntityTagRepository().query(include_deleted=True).filter_by(entity_id=str(entity_id), is_deleted=True).update(
            {"is_deleted": False, "deleted_at": None, "deleted_by": None}
        )

        EntityFileRepository().query(include_deleted=True).filter_by(entity_id=str(entity_id), is_deleted=True).update(
            {"is_deleted": False, "deleted_at": None, "deleted_by": None}
        )

        Comment.query.filter(
            Comment.entity_id == str(entity_id),
            Comment.is_deleted.is_(True),
        ).update({"is_deleted": False, "deleted_at": None, "deleted_by": None})

        Embedding.query.filter(
            Embedding.entity_id == str(entity_id),
            Embedding.is_deleted.is_(True),
        ).update({"is_deleted": False, "deleted_at": None, "deleted_by": None})

        Notification.query.filter(
            Notification.entity_id == str(entity_id),
            Notification.is_deleted.is_(True),
        ).update({"is_deleted": False, "deleted_at": None, "deleted_by": None})

        SearchService().rebuild_entity_index(entity_id)
        EventService().entity_event(entity.id, "entity.restored", {})
        db.session.commit()
        return entity

    def get_children(self, entity_id, page=1, per_page=25):
        child_ids = (
            RelationRepository().query()
            .filter_by(source_entity_id=entity_id, relation_type="parent")
            .all()
        )
        target_ids = [r.target_entity_id for r in child_ids]
        if not target_ids:
            return EntityRepository().query().filter(Entity.id.in_([-1])).paginate(page=page, per_page=per_page, error_out=False)
        return EntityRepository().query().filter(Entity.id.in_(target_ids)).paginate(page=page, per_page=per_page, error_out=False)

    def archive(self, entity_id, archived=True):
        entity = EntityRepository().get(entity_id)
        entity.is_archived = archived
        EventService().entity_event(entity.id, "entity.archived" if archived else "entity.restored", {})
        db.session.commit()
        return entity

    def duplicate(self, entity_id, user_id):
        source = EntityRepository().get(entity_id)
        duplicate = EntityRepository().create(
            {
                "workspace_id": source.workspace_id,
                "entity_type_id": source.entity_type_id,
                "title": f"{source.title or 'Untitled'} Copy",
                "icon": source.icon,
                "cover_image": source.cover_image,
                "created_by": user_id,
            }
        )
        EventService().entity_event(source.id, "entity.duplicated", {"duplicate_id": str(duplicate.id)})
        db.session.commit()
        return duplicate

    def _upsert_properties(self, entity_id, values):
        prop_repo = PropertyRepository()
        value_repo = EntityPropertyValueRepository()
        for property_id, value in values.items():
            prop_repo.get(property_id)
            existing = value_repo.query().filter_by(entity_id=entity_id, property_id=property_id).first()
            if existing:
                existing.value = value
            else:
                value_repo.create({"entity_id": entity_id, "property_id": property_id, "value": value})
