import json
import os
from datetime import datetime

from flask import current_app

from app.extensions import db
from app.models import Block, Comment, Entity, EntityPropertyValue, EntityType, File, Property, Relation, Tag
from app.repositories import EntityRepository


class BackupService:
    def export_workspace(self, workspace_id):
        entities = EntityRepository().query().filter_by(workspace_id=workspace_id).all()
        entity_types = EntityType.query.filter_by(workspace_id=workspace_id, is_deleted=False).all()
        properties = Property.query.filter_by(workspace_id=workspace_id, is_deleted=False).all()
        relations = Relation.query.filter_by(workspace_id=workspace_id, is_deleted=False).all()
        tags = Tag.query.filter_by(workspace_id=workspace_id, is_deleted=False).all()
        blocks = (
            Block.query.filter(
                Block.entity_id.in_([e.id for e in entities]),
                Block.is_deleted.is_(False),
            ).all()
        )
        comments = Comment.query.filter_by(workspace_id=workspace_id, is_deleted=False).all()
        files = File.query.filter_by(workspace_id=workspace_id, is_deleted=False).all()

        def serialize(records):
            return [
                {c.key: str(getattr(r, c.key)) if hasattr(getattr(r, c.key), "isoformat") else getattr(r, c.key)
                 for c in r.__table__.columns}
                for r in records
            ]

        return {
            "exported_at": datetime.utcnow().isoformat(),
            "workspace_id": str(workspace_id),
            "entity_types": serialize(entity_types),
            "entities": serialize(entities),
            "properties": serialize(properties),
            "relations": serialize(relations),
            "tags": serialize(tags),
            "blocks": serialize(blocks),
            "comments": serialize(comments),
            "files": serialize(files),
        }

    def export_to_disk(self, workspace_id, output_dir=None):
        data = self.export_workspace(workspace_id)
        if output_dir is None:
            output_dir = os.path.join(current_app.instance_path, "backups")
        os.makedirs(output_dir, exist_ok=True)
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        path = os.path.join(output_dir, f"workspace_{workspace_id}_{timestamp}.json")
        with open(path, "w") as f:
            json.dump(data, f, indent=2, default=str)
        return path

    def import_workspace(self, workspace_id, data):
        counts = {"entity_types": 0, "entities": 0, "properties": 0, "relations": 0, "tags": 0, "blocks": 0, "comments": 0}

        for item in data.get("entity_types", []):
            item.pop("id", None)
            item["workspace_id"] = workspace_id
            EntityType.query.filter_by(workspace_id=workspace_id, name=item["name"]).first()
            et = EntityType(**{k: v for k, v in item.items() if hasattr(EntityType, k)})
            db.session.add(et)
            counts["entity_types"] += 1

        for item in data.get("tags", []):
            item.pop("id", None)
            item["workspace_id"] = workspace_id
            t = Tag(**{k: v for k, v in item.items() if hasattr(Tag, k)})
            db.session.add(t)
            counts["tags"] += 1

        for item in data.get("properties", []):
            item.pop("id", None)
            item["workspace_id"] = workspace_id
            p = Property(**{k: v for k, v in item.items() if hasattr(Property, k)})
            db.session.add(p)
            counts["properties"] += 1

        for item in data.get("entities", []):
            item.pop("id", None)
            item["workspace_id"] = workspace_id
            e = Entity(**{k: v for k, v in item.items() if hasattr(Entity, k)})
            db.session.add(e)
            counts["entities"] += 1

        db.session.flush()

        for item in data.get("relations", []):
            item.pop("id", None)
            item["workspace_id"] = workspace_id
            r = Relation(**{k: v for k, v in item.items() if hasattr(Relation, k)})
            db.session.add(r)
            counts["relations"] += 1

        for item in data.get("blocks", []):
            item.pop("id", None)
            b = Block(**{k: v for k, v in item.items() if hasattr(Block, k)})
            db.session.add(b)
            counts["blocks"] += 1

        for item in data.get("comments", []):
            item.pop("id", None)
            item["workspace_id"] = workspace_id
            c = Comment(**{k: v for k, v in item.items() if hasattr(Comment, k)})
            db.session.add(c)
            counts["comments"] += 1

        db.session.commit()
        return {"workspace_id": str(workspace_id), "imported": counts}
