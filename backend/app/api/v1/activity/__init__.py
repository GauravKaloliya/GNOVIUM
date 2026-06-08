from flask import Blueprint, request

from app.api.v1.helpers import item_response, list_response, pagination_args, raw_response, request_json
from app.repositories.domain import ActivityLogRepository
from app.services.security import secured
from app.services.graph_service import GraphService
from app.repositories.domain import GraphMaterializationRepository

bp = Blueprint("activity", __name__)


@bp.get("/")
@secured
def list_activity():
    """List activity logs for a workspace (most recent first)."""
    args = pagination_args()
    workspace_id = request.args.get("workspace_id")
    if not workspace_id:
        from app.core.response import error
        return error("workspace_id query param is required", status=400)
    return list_response(ActivityLogRepository().list_for_workspace(workspace_id, args["page"], args["per_page"]))
