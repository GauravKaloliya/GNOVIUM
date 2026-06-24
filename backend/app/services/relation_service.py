from app.events.service import EventService
from app.extensions import db
from app.models import Relation
from app.repositories import EntityRepository, RelationRepository


class RelationService:
    def create(self, data, user_id):
        if data["source_entity_id"] == data["target_entity_id"]:
            from app.core.errors import ApiError

            raise ApiError("An entity cannot relate to itself", 422, "validation_error")
        EntityRepository().get(data["source_entity_id"])
        EntityRepository().get(data["target_entity_id"])
        data["relation_metadata"] = data.pop("metadata", {})
        relation = RelationRepository().create({**data, "created_by": user_id})
        EventService().entity_event(
            relation.source_entity_id,
            "relation.created",
            {"target_entity_id": str(relation.target_entity_id), "relation_type": relation.relation_type},
        )
        db.session.commit()
        return relation

    def outgoing(self, entity_id):
        return RelationRepository().query().filter(Relation.source_entity_id == entity_id).all()

    def backlinks(self, entity_id):
        return RelationRepository().backlinks(entity_id)

    def delete(self, relation_id, user_id=None):
        relation = RelationRepository().get(relation_id)
        RelationRepository().soft_delete(relation, deleted_by=user_id)
        EventService().entity_event(relation.source_entity_id, "relation.deleted", {"relation_id": str(relation.id)})
        db.session.commit()
        return relation

    def restore(self, relation_id):
        relation = RelationRepository().get(relation_id, include_deleted=True)
        relation.is_deleted = False
        relation.deleted_at = None
        relation.deleted_by = None
        EventService().entity_event(relation.source_entity_id, "relation.restored", {"relation_id": str(relation.id)})
        db.session.commit()
        return relation
