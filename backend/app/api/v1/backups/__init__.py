from flask import Blueprint, request

from app.api.v1.helpers import raw_response, request_json
from app.core.response import ok
from app.services.backup_service import BackupService
from app.services.security import secured

bp = Blueprint("backups", __name__)


@bp.post("/export")
@secured
def export_workspace():
    data = request_json()
    workspace_id = data.get("workspace_id")
    if not workspace_id:
        from app.core.response import error
        return error("workspace_id is required", status=400)
    return raw_response(BackupService().export_workspace(workspace_id))


@bp.post("/export-to-disk")
@secured
def export_to_disk():
    data = request_json()
    workspace_id = data.get("workspace_id")
    if not workspace_id:
        from app.core.response import error
        return error("workspace_id is required", status=400)
    path = BackupService().export_to_disk(workspace_id)
    return ok({"path": path})


@bp.post("/import")
@secured
def import_workspace():
    data = request_json()
    workspace_id = data.get("workspace_id")
    if not workspace_id:
        from app.core.response import error
        return error("workspace_id is required", status=400)
    return raw_response(BackupService().import_workspace(workspace_id, data), 201)
