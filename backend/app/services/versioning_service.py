from app.extensions import db
from app.repositories.domain import BranchRepository, ChangesetRepository, EntityRepository, EntityVersionRepository, SnapshotRepository
from app.services.entity_service import content_hash


class VersioningService:
    def create_changeset(self, data, user_id):
        changeset = ChangesetRepository().create({**data, "created_by": user_id})
        db.session.commit()
        return changeset

    def create_snapshot(self, data, user_id):
        snapshot = SnapshotRepository().create({**data, "created_by": user_id})
        db.session.commit()
        return snapshot

    def snapshot_entity(self, entity_id, changeset_id=None):
        entity = EntityRepository().get(entity_id)
        payload = {
            "id": str(entity.id),
            "workspace_id": str(entity.workspace_id),
            "entity_type_id": str(entity.entity_type_id),
            "title": entity.title,
            "icon": entity.icon,
            "cover_image": entity.cover_image,
            "is_archived": entity.is_archived,
        }
        version = EntityVersionRepository().create(
            {
                "entity_id": entity.id,
                "changeset_id": changeset_id,
                "snapshot": payload,
                "content_hash": content_hash(payload),
            }
        )
        db.session.commit()
        return version

    def compare_versions(self, left_id, right_id):
        repo = EntityVersionRepository()
        left = repo.get(left_id)
        right = repo.get(right_id)
        keys = sorted(set(left.snapshot.keys()) | set(right.snapshot.keys()))
        return {
            "left_version_id": str(left.id),
            "right_version_id": str(right.id),
            "diff": {
                key: {"left": left.snapshot.get(key), "right": right.snapshot.get(key)}
                for key in keys
                if left.snapshot.get(key) != right.snapshot.get(key)
            },
        }

    def restore_entity_version(self, version_id):
        version = EntityVersionRepository().get(version_id)
        entity = EntityRepository().get(version.entity_id)
        for key in ("title", "icon", "cover_image", "is_archived"):
            setattr(entity, key, version.snapshot.get(key))
        db.session.commit()
        return entity


class BranchService:
    def create(self, data, user_id):
        branch = BranchRepository().create({**data, "created_by": user_id})
        db.session.commit()
        return branch

    def merge(self, data, user_id):
        from app.repositories.domain import BranchMergeRepository

        merge = BranchMergeRepository().create({**data, "created_by": user_id, "status": "completed", "merge_metadata": {}})
        db.session.commit()
        return merge
