from datetime import datetime

from app.events.service import EventService
from app.extensions import db
from app.models import Block
from app.repositories import BlockRepository, EntityRepository
from app.services.search_service import SearchService


class BlockService:
    def create(self, data, user_id):
        entity = EntityRepository().get(data["entity_id"])
        if data.get("position") is None:
            data["position"] = BlockRepository().next_position(data["entity_id"], data.get("parent_block_id"))
        block = BlockRepository().create(data)
        entity.updated_at = datetime.utcnow()
        EventService().entity_event(entity.id, "block.created", {"block_id": str(block.id), "type": block.block_type})
        db.session.flush()
        SearchService().rebuild_entity_index(entity.id)
        db.session.commit()
        return block

    def update(self, block_id, data, user_id):
        block = BlockRepository().get(block_id)
        entity = EntityRepository().get(block.entity_id)
        new_block = BlockRepository().update(block, data)
        entity.updated_at = datetime.utcnow()
        EventService().entity_event(entity.id, "block.updated", {"block_id": str(block.id)})
        db.session.flush()
        SearchService().rebuild_entity_index(entity.id)
        db.session.commit()
        return new_block

    def move(self, block_id, data):
        block = BlockRepository().get(block_id)
        entity = EntityRepository().get(block.entity_id)
        block.parent_block_id = data.get("parent_block_id")
        block.position = data["position"]
        entity.updated_at = datetime.utcnow()
        EventService().entity_event(block.entity_id, "block.moved", {"block_id": str(block.id)})
        db.session.flush()
        SearchService().rebuild_entity_index(entity.id)
        db.session.commit()
        return block

    def reorder(self, entity_id, block_order):
        entity = EntityRepository().get(entity_id)
        repo = BlockRepository()
        updated = []
        for item in block_order:
            block = repo.query().filter(Block.id == str(item["id"]), Block.entity_id == str(entity_id)).first()
            if block:
                block.position = item["position"]
                updated.append(block)
        entity.updated_at = datetime.utcnow()
        db.session.flush()
        SearchService().rebuild_entity_index(entity_id)
        db.session.commit()
        return updated

    def delete(self, block_id, user_id=None):
        block = BlockRepository().get(block_id)
        entity = EntityRepository().get(block.entity_id)
        deleted = BlockRepository().soft_delete(block, deleted_by=user_id)
        entity.updated_at = datetime.utcnow()
        EventService().entity_event(block.entity_id, "block.deleted", {"block_id": str(block.id)})
        db.session.flush()
        SearchService().rebuild_entity_index(entity.id)
        db.session.commit()
        return deleted

    def restore(self, block_id, branch_id="main"):
        block = BlockRepository().get(block_id, include_deleted=True, branch_id=branch_id)
        data = {
            "id": block.id,
            "branch_id": block.branch_id,
            "entity_id": block.entity_id,
            "parent_block_id": block.parent_block_id,
            "block_type": block.block_type,
            "content": block.content,
            "position": block.position,
            "indent": block.indent,
            "content_hash": block.content_hash,
            "is_deleted": False,
        }
        from app.repositories import BlockRepository as Repo
        new_block = Repo().create(data)
        entity = EntityRepository().get(block.entity_id)
        entity.updated_at = datetime.utcnow()
        EventService().entity_event(block.entity_id, "block.restored", {"block_id": str(block.id)})
        db.session.flush()
        SearchService().rebuild_entity_index(entity.id)
        db.session.commit()
        return new_block
