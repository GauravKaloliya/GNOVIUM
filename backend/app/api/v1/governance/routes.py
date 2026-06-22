from flask import Blueprint, request

from app.api.v1.helpers import item_response, raw_response
from app.services.governance_service import GovernanceService
from app.services.security import secured

bp = Blueprint("governance", __name__)


@bp.get("/health")
@secured
def health():
    workspace_id = request.args.get("workspace_id")
    if not workspace_id:
        from app.core.response import error
        return error("workspace_id query param is required", status=400)
    return item_response(GovernanceService().calculate_health_score(workspace_id))


@bp.get("/duplicates")
@secured
def duplicates():
    return raw_response(GovernanceService().find_duplicates(request.args["workspace_id"]))


@bp.get("/orphans")
@secured
def orphans():
    return raw_response(GovernanceService().find_orphans(request.args["workspace_id"]))


@bp.get("/stale")
@secured
def stale():
    return raw_response(GovernanceService().find_stale_entities(request.args["workspace_id"]))


@bp.post("/health-score")
@secured
def health_score():
    return item_response(GovernanceService().calculate_health_score(request.args["workspace_id"]), 201)
