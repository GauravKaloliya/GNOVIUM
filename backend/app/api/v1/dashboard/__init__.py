from flask import Blueprint, request

from app.api.v1.helpers import raw_response
from app.services.dashboard_service import DashboardService
from app.services.security import secured

bp = Blueprint("dashboard", __name__)


@bp.get("/overview")
@secured
def overview():
    workspace_id = request.args.get("workspace_id")
    if not workspace_id:
        from app.core.response import error
        return error("workspace_id query param is required", status=400)
    return raw_response(DashboardService().overview(workspace_id))
