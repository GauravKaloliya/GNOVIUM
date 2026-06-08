from app.extensions import db
from app.repositories.domain import WorkspaceMemberRepository, WorkspaceRepository


class WorkspaceService:
    def create(self, data, user_id):
        workspace = WorkspaceRepository().create({**data, "owner_id": user_id})
        db.session.flush()
        WorkspaceMemberRepository().create({"workspace_id": workspace.id, "user_id": user_id, "role": "owner"})
        db.session.commit()
        return workspace

    def list_for_user(self, user_id, page=1, per_page=25):
        memberships = WorkspaceMemberRepository().list({"user_id": user_id}, page, per_page)
        workspace_ids = [item.workspace_id for item in memberships.items]
        items = WorkspaceRepository().query().filter(WorkspaceRepository.model.id.in_(workspace_ids)).all()
        memberships.items = items
        return memberships

    def update(self, workspace_id, data):
        repo = WorkspaceRepository()
        workspace = repo.get(workspace_id)
        repo.update(workspace, data)
        db.session.commit()
        return workspace

    def delete(self, workspace_id):
        workspace = WorkspaceRepository().get(workspace_id)
        WorkspaceRepository().soft_delete(workspace)
        db.session.commit()
        return workspace
