import os

from flask import Blueprint, request, send_from_directory

from app.api.v1.helpers import item_response, list_response, pagination_args, raw_response, request_json
from app.core.response import error, ok
from app.core.serialization import model_to_dict
from app.core.validation import load_schema
from app.repositories import FileRepository
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


@bp.post("/upload")
@secured
def upload_file():
    if "file" not in request.files:
        return error("file is required", status=400)
    file = request.files["file"]
    workspace_id = request.form.get("workspace_id")
    if not workspace_id:
        return error("workspace_id is required", status=400)
    try:
        result = FileService().upload(file, workspace_id, current_user_id())
        return raw_response(result, 201)
    except ValueError as e:
        return error(str(e), status=400)


@bp.post("/")
@secured
def create_file():
    return item_response(FileService().create_metadata(load_schema(FileCreateSchema(), request_json()), current_user_id()), 201)


@bp.get("/<string:file_id>")
@secured
def get_file(file_id):
    return item_response(FileRepository().get(file_id))


@bp.get("/<string:file_id>/download")
@secured
def download_file(file_id):
    from flask import current_app
    file_record = FileRepository().get(file_id)
    if file_record.storage_provider == "local":
        uploads_dir = os.path.join(current_app.instance_path, "uploads")
        filename = file_record.object_key.replace("/", "_")
        return send_from_directory(uploads_dir, filename, download_name=file_record.file_name)
    if file_record.public_url:
        from flask import redirect
        return redirect(file_record.public_url)
    return error("File not available for download", status=404)


@bp.delete("/<string:file_id>")
@secured
def delete_file(file_id):
    repo = FileRepository()
    file_record = repo.get(file_id)
    repo._remove_from_disk(file_record)
    repo.soft_delete(file_record, deleted_by=current_user_id())
    from app.extensions import db
    db.session.commit()
    return item_response(file_record)


@bp.post("/presign")
@secured
def presign():
    from flask import current_app
    if current_app.config.get("GNOVIUM_MODE") != "cloud":
        from app.core.response import error
        return error("Presigned uploads are only available in cloud mode", status=404)
    data = request_json()
    return raw_response(FileService().presign_upload(data["object_key"], data.get("content_type")))


@bp.post("/<string:file_id>/entities/<string:entity_id>")
@secured
def link_entity(file_id, entity_id):
    return item_response(FileService().link_entity(entity_id, file_id, request_json().get("block_id")), 201)


@bp.post("/cleanup-orphans")
@secured
def cleanup_orphans():
    workspace_id = request_json().get("workspace_id")
    count = FileRepository.cleanup_orphans(workspace_id)
    return ok({"deleted": count})
