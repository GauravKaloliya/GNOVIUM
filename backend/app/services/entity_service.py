import hashlib
import json

from app.events.service import EventService
from app.extensions import db
from app.models import Entity
from app.repositories.domain import (
    EntityPropertyValueRepository,
    EntityRepository,
    EntityTypeRepository,
    JobRepository,
    PropertyRepository,
    RelationRepository,
    SearchRepository,
)


def content_hash(payload):
    return hashlib.sha256(json.dumps(payload, sort_keys=True, default=str).encode()).hexdigest()


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
        SearchRepository().create(
            {
                "workspace_id": entity.workspace_id,
                "entity_id": entity.id,
                "title": entity.title,
                "content": json.dumps(properties, default=str),
                "content_hash": content_hash({"title": entity.title, "properties": properties}),
            }
        )
        JobRepository().create(
            {
                "workspace_id": entity.workspace_id,
                "job_type": "embedding.generate",
                "payload": {"entity_id": str(entity.id)},
                "created_by": user_id,
            }
        )
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
        EventService().entity_event(entity.id, "entity.updated", data)
        JobRepository().create(
            {
                "workspace_id": entity.workspace_id,
                "job_type": "embedding.generate",
                "payload": {"entity_id": str(entity.id)},
                "created_by": user_id,
            }
        )
        db.session.commit()
        return entity

    def soft_delete(self, entity_id):
        entity = EntityRepository().get(entity_id)
        EntityRepository().soft_delete(entity)
        EventService().entity_event(entity.id, "entity.deleted", {})
        db.session.commit()
        return entity

    def restore(self, entity_id):
        entity = EntityRepository().get(entity_id, include_deleted=True)
        entity.is_deleted = False
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
