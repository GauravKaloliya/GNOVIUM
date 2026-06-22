from flask import Blueprint

from app.api.v1.helpers import item_response, list_response, pagination_args, request_json
from app.core.validation import load_schema
from app.repositories.domain import WorkspaceRepository
from app.schemas.domain import WorkspaceCreateSchema, WorkspaceUpdateSchema
from app.services.security import current_user_id, secured
from app.services.workspace_service import WorkspaceService

bp = Blueprint("workspaces", __name__)


@bp.get("/")
@secured
def list_workspaces():
    args = pagination_args()
    return list_response(WorkspaceService().list_for_user(current_user_id(), args["page"], args["per_page"]))


@bp.post("/")
@secured
def create_workspace():
    data = load_schema(WorkspaceCreateSchema(), request_json())
    return item_response(WorkspaceService().create(data, current_user_id()), 201)


@bp.get("/<string:workspace_id>")
@secured
def get_workspace(workspace_id):
    return item_response(WorkspaceRepository().get(workspace_id))


@bp.patch("/<string:workspace_id>")
@secured
def update_workspace(workspace_id):
    data = load_schema(WorkspaceUpdateSchema(), request_json(), partial=True)
    return item_response(WorkspaceService().update(workspace_id, data))


@bp.delete("/<string:workspace_id>")
@secured
def delete_workspace(workspace_id):
    return item_response(WorkspaceService().delete(workspace_id))


@bp.get("/<string:workspace_id>/stats")
@secured
def workspace_stats(workspace_id):
    from app.services.dashboard_service import DashboardService
    from app.api.v1.helpers import raw_response
    return raw_response(DashboardService().overview(workspace_id))
