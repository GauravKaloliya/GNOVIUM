from flask import Blueprint, request

from app.api.v1.helpers import item_response, raw_response, request_json
from app.services.security import secured
from app.services.versioning_service import VersioningService

bp = Blueprint("diffs", __name__)


@bp.post("/compare")
@secured
def compare():
    data = request_json()
    left_id = data.get("left_version_id") or data.get("left_snapshot_id")
    right_id = data.get("right_version_id") or data.get("right_snapshot_id")
    left_branch_id = data.get("left_branch_id")
    right_branch_id = data.get("right_branch_id")

    if left_id and right_id:
        return raw_response(VersioningService().compare_versions(left_id, right_id))

    if left_branch_id and right_branch_id:
        return raw_response(VersioningService().compare_branches(left_branch_id, right_branch_id))

    from app.core.response import error
    return error("Provide either left_version_id+right_version_id or left_branch_id+right_branch_id", status=400)
