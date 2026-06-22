from app.events.service import EventService
from app.extensions import db
from app.models import Block
from app.repositories.domain import BlockRepository, EntityRepository, JobRepository


class BlockService:
    def create(self, data, user_id):
        entity = EntityRepository().get(data["entity_id"])
        if data.get("position") is None:
            data["position"] = BlockRepository().next_position(data["entity_id"], data.get("parent_block_id"))
        block = BlockRepository().create(data)
        EventService().entity_event(entity.id, "block.created", {"block_id": str(block.id), "type": block.block_type})
        JobRepository().create(
            {
                "workspace_id": entity.workspace_id,
                "job_type": "embedding.generate",
                "payload": {"entity_id": str(entity.id), "block_id": str(block.id)},
                "created_by": user_id,
            }
        )
        db.session.commit()
        return block

    def update(self, block_id, data, user_id):
        block = BlockRepository().get(block_id)
        BlockRepository().update(block, data)
        entity = EntityRepository().get(block.entity_id)
        EventService().entity_event(entity.id, "block.updated", {"block_id": str(block.id)})
        JobRepository().create(
            {
                "workspace_id": entity.workspace_id,
                "job_type": "embedding.generate",
                "payload": {"entity_id": str(entity.id), "block_id": str(block.id)},
                "created_by": user_id,
            }
        )
        db.session.commit()
        return block

    def move(self, block_id, data):
        block = BlockRepository().get(block_id)
        block.parent_block_id = data.get("parent_block_id")
        block.position = data["position"]
        EventService().entity_event(block.entity_id, "block.moved", {"block_id": str(block.id)})
        db.session.commit()
        return block

    def reorder(self, entity_id, block_order):
        repo = BlockRepository()
        updated = []
        for item in block_order:
            block = repo.query().filter(Block.id == str(item["id"]), Block.entity_id == str(entity_id)).first()
            if block:
                block.position = item["position"]
                updated.append(block)
        db.session.commit()
        return updated

    def delete(self, block_id):
        block = BlockRepository().get(block_id)
        BlockRepository().soft_delete(block)
        EventService().entity_event(block.entity_id, "block.deleted", {"block_id": str(block.id)})
        db.session.commit()
        return block
