from flask import Blueprint, request

from app.api.v1.helpers import item_response, list_response, pagination_args, raw_response, request_json
from app.core.validation import load_schema
from app.repositories import TagRepository
from app.schemas.domain import TagCreateSchema, TagUpdateSchema
from app.services.security import current_user_id, secured
from app.services.tag_service import TagService

bp = Blueprint("tags", __name__)


@bp.get("/")
@secured
def list_tags():
    args = pagination_args()
    return list_response(TagRepository().list({"workspace_id": request.args.get("workspace_id")}, args["page"], args["per_page"]))


@bp.post("/")
@secured
def create_tag():
    return item_response(TagService().create(load_schema(TagCreateSchema(), request_json())), 201)


@bp.get("/<string:tag_id>")
@secured
def get_tag(tag_id):
    return item_response(TagRepository().get(tag_id))


@bp.patch("/<string:tag_id>")
@secured
def update_tag(tag_id):
    return item_response(TagService().update(tag_id, load_schema(TagUpdateSchema(), request_json(), partial=True)))


@bp.delete("/<string:tag_id>")
@secured
def delete_tag(tag_id):
    return item_response(TagService().delete(tag_id, current_user_id()))


@bp.post("/<string:tag_id>/entities/<string:entity_id>")
@secured
def tag_entity(tag_id, entity_id):
    return item_response(TagService().tag_entity(entity_id, tag_id), 201)


@bp.delete("/<string:tag_id>/entities/<string:entity_id>")
@secured
def untag_entity(tag_id, entity_id):
    return raw_response(TagService().untag_entity(entity_id, tag_id))
