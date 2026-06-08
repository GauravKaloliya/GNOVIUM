from flask import Blueprint, request

from app.api.v1.helpers import item_response, list_response, pagination_args, raw_response, request_json
from app.core.validation import load_schema
from app.repositories.domain import FileRepository
from app.schemas.domain import FileCreateSchema
from app.services.file_service import FileService
from app.services.security import current_user_id, secured

bp = Blueprint("files", __name__)


@bp.get("/")
@secured
def list_files():
    args = pagination_args()
    filters = {"workspace_id": request.args.get("workspace_id"), "uploaded_by": request.args.get("uploaded_by")}
    return list_response(FileRepository().list(filters, args["page"], args["per_page"]))


@bp.post("/")
@secured
def create_file():
    return item_response(FileService().create_metadata(load_schema(FileCreateSchema(), request_json()), current_user_id()), 201)


@bp.get("/<uuid:file_id>")
@secured
def get_file(file_id):
    return item_response(FileRepository().get(file_id))


@bp.delete("/<uuid:file_id>")
@secured
def delete_file(file_id):
    repo = FileRepository()
    file = repo.get(file_id)
    repo.soft_delete(file)
    from app.extensions import db
    db.session.commit()
    return item_response(file)


@bp.post("/presign")
@secured
def presign():
    data = request_json()
    return raw_response(FileService().presign_upload(data["object_key"], data.get("content_type")))


@bp.post("/<uuid:file_id>/entities/<uuid:entity_id>")
@secured
def link_entity(file_id, entity_id):
    return item_response(FileService().link_entity(entity_id, file_id, request_json().get("block_id")), 201)
