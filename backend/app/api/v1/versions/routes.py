from flask import Blueprint, request

from app.api.v1.helpers import item_response, list_response, pagination_args, raw_response, request_json
from app.core.validation import load_schema
from app.repositories.domain import BlockVersionRepository, ChangesetRepository, EntityVersionRepository, SnapshotRepository
from app.schemas.domain import ChangesetCreateSchema, SnapshotCreateSchema
from app.services.security import current_user_id, secured
from app.services.versioning_service import VersioningService

bp = Blueprint("versions", __name__)


@bp.get("/changesets")
@secured
def list_changesets():
    args = pagination_args()
    return list_response(ChangesetRepository().list({"branch_id": request.args.get("branch_id")}, args["page"], args["per_page"]))


@bp.post("/changesets")
@secured
def create_changeset():
    return item_response(VersioningService().create_changeset(load_schema(ChangesetCreateSchema(), request_json()), current_user_id()), 201)


@bp.get("/snapshots")
@secured
def list_snapshots():
    args = pagination_args()
    return list_response(SnapshotRepository().list({"branch_id": request.args.get("branch_id")}, args["page"], args["per_page"]))


@bp.post("/snapshots")
@secured
def create_snapshot():
    return item_response(VersioningService().create_snapshot(load_schema(SnapshotCreateSchema(), request_json()), current_user_id()), 201)


@bp.post("/entities/<string:entity_id>/snapshot")
@secured
def snapshot_entity(entity_id):
    return item_response(VersioningService().snapshot_entity(entity_id, request_json().get("changeset_id")), 201)


@bp.get("/entities/<string:entity_id>")
@secured
def list_entity_versions(entity_id):
    args = pagination_args()
    return list_response(EntityVersionRepository().list({"entity_id": entity_id}, args["page"], args["per_page"]))


@bp.get("/blocks/<string:block_id>")
@secured
def list_block_versions(block_id):
    args = pagination_args()
    return list_response(BlockVersionRepository().list_for_block(block_id, args["page"], args["per_page"]))


@bp.get("/compare")
@secured
def compare_versions():
    return raw_response(VersioningService().compare_versions(request.args["left_version_id"], request.args["right_version_id"]))


@bp.post("/restore/<string:version_id>")
@secured
def restore_version(version_id):
    return item_response(VersioningService().restore_entity_version(version_id))

