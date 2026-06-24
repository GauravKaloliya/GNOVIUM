from datetime import datetime

from flask import current_app

from app.extensions import db
from app.models import Entity
from app.repositories import EntityRepository, WorkspaceRepository


class WorkspaceService:
    def create(self, data, user_id):
        workspace = WorkspaceRepository().create({**data, "owner_id": user_id})
        if current_app.config.get("GNOVIUM_MODE") == "cloud":
            from app.repositories import WorkspaceMemberRepository
            db.session.flush()
            WorkspaceMemberRepository().create({"workspace_id": workspace.id, "user_id": user_id, "role": "owner"})
        db.session.commit()
        return workspace

    def list_for_user(self, user_id, page=1, per_page=25):
        if current_app.config.get("GNOVIUM_MODE") == "cloud":
            from app.repositories import WorkspaceMemberRepository
            memberships = WorkspaceMemberRepository().list({"user_id": user_id}, page, per_page)
            workspace_ids = [item.workspace_id for item in memberships.items]
            items = WorkspaceRepository().query().filter(WorkspaceRepository.model.id.in_(workspace_ids)).all()
            memberships.items = items
            return memberships
        return WorkspaceRepository().list({}, page, per_page)

    def update(self, workspace_id, data):
        repo = WorkspaceRepository()
        workspace = repo.get(workspace_id)
        repo.update(workspace, data)
        db.session.commit()
        return workspace

    def delete(self, workspace_id, user_id=None):
        workspace = WorkspaceRepository().get(workspace_id)
        now = datetime.utcnow()
        WorkspaceRepository().soft_delete(workspace, deleted_by=user_id)

        from app.services.entity_service import EntityService
        for entity in EntityRepository().query().filter(Entity.workspace_id == str(workspace_id)).all():
            EntityService().soft_delete(entity.id, user_id)

        db.session.commit()
        return workspace

    def restore(self, workspace_id, user_id=None):
        workspace = WorkspaceRepository().get(workspace_id, include_deleted=True)
        workspace.is_deleted = False
        workspace.deleted_at = None
        workspace.deleted_by = None

        from app.services.entity_service import EntityService
        for entity in EntityRepository().query(include_deleted=True).filter(
            Entity.workspace_id == str(workspace_id),
            Entity.is_deleted.is_(True),
        ).all():
            EntityService().restore(entity.id, user_id)

        db.session.commit()
        return workspace
