from app.extensions import db
from app.repositories.domain import BranchRepository, ChangesetRepository, EntityBranchHeadRepository, EntityRepository, EntityVersionRepository, SnapshotRepository
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

    def compare_branches(self, left_branch_id, right_branch_id):
        from app.repositories.domain import EntityBranchHeadRepository
        left_heads = EntityBranchHeadRepository().list({"branch_id": left_branch_id}, 1, 1000)
        right_heads = EntityBranchHeadRepository().list({"branch_id": right_branch_id}, 1, 1000)
        left_map = {str(h.entity_id): h for h in left_heads.items}
        right_map = {str(h.entity_id): h for h in right_heads.items}
        all_entity_ids = set(left_map.keys()) | set(right_map.keys())
        diffs = []
        for eid in all_entity_ids:
            if eid in left_map and eid in right_map:
                if left_map[eid].current_version_id != right_map[eid].current_version_id:
                    diffs.append({"entity_id": eid, "status": "modified", "left_version": str(left_map[eid].current_version_id), "right_version": str(right_map[eid].current_version_id)})
            elif eid in left_map:
                diffs.append({"entity_id": eid, "status": "removed", "left_version": str(left_map[eid].current_version_id), "right_version": None})
            else:
                diffs.append({"entity_id": eid, "status": "added", "left_version": None, "right_version": str(right_map[eid].current_version_id)})
        return {"left_branch_id": str(left_branch_id), "right_branch_id": str(right_branch_id), "diffs": diffs, "diff_count": len(diffs)}

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

    def delete(self, branch_id):
        branch = BranchRepository().get(branch_id)
        BranchRepository().soft_delete(branch)
        db.session.commit()
        return branch

    def merge(self, data, user_id):
        from app.repositories.domain import BranchMergeRepository

        merge = BranchMergeRepository().create({**data, "created_by": user_id, "status": "completed", "merge_metadata": {}})
        db.session.commit()
        return merge
