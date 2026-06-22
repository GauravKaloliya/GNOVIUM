from flask import Blueprint, request

from app.api.v1.helpers import item_response, list_response, pagination_args, request_json
from app.core.validation import load_schema
from app.repositories.domain import SyncOperationRepository
from app.schemas.domain import SyncOperationCreateSchema
from app.services.security import current_user_id, secured
from app.services.sync_service import SyncService

bp = Blueprint("sync", __name__)


@bp.get("/")
@secured
def list_sync_operations():
    args = pagination_args()
    workspace_id = request.args.get("workspace_id")
    pending_only = request.args.get("pending", "false").lower() == "true"
    repo = SyncOperationRepository()
    if pending_only and workspace_id:
        return list_response(repo.pending_for_workspace(workspace_id, args["page"], args["per_page"]))
    return list_response(repo.list({"workspace_id": workspace_id}, args["page"], args["per_page"]))


@bp.post("/")
@secured
def create_sync_operation():
    return item_response(
        SyncService().ingest(load_schema(SyncOperationCreateSchema(), request_json()), current_user_id()),
        201,
    )


@bp.get("/<string:op_id>")
@secured
def get_sync_operation(op_id):
    return item_response(SyncOperationRepository().get(op_id))


@bp.post("/<string:op_id>/ack")
@secured
def ack_sync_operation(op_id):
    """Acknowledge (mark synced) a sync operation after client applies it."""
    return item_response(SyncService().mark_synced(op_id))
