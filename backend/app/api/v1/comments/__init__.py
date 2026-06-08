from flask import Blueprint, request

from app.api.v1.helpers import item_response, list_response, pagination_args, request_json
from app.core.validation import load_schema
from app.repositories.domain import CommentRepository
from app.schemas.domain import CommentCreateSchema, CommentUpdateSchema
from app.services.comment_service import CommentService
from app.services.security import current_user_id, secured

bp = Blueprint("comments", __name__)


@bp.get("/")
@secured
def list_comments():
    args = pagination_args()
    entity_id = request.args.get("entity_id")
    parent_comment_id = request.args.get("parent_comment_id")
    repo = CommentRepository()
    if parent_comment_id:
        return list_response(repo.list_replies(parent_comment_id, args["page"], args["per_page"]))
    if entity_id:
        return list_response(repo.list_for_entity(entity_id, args["page"], args["per_page"]))
    return list_response(repo.list({}, args["page"], args["per_page"]))


@bp.post("/")
@secured
def create_comment():
    return item_response(
        CommentService().create(load_schema(CommentCreateSchema(), request_json()), current_user_id()),
        201,
    )


@bp.get("/<uuid:comment_id>")
@secured
def get_comment(comment_id):
    return item_response(CommentRepository().get(comment_id))


@bp.patch("/<uuid:comment_id>")
@secured
def update_comment(comment_id):
    return item_response(
        CommentService().update(comment_id, load_schema(CommentUpdateSchema(), request_json()), current_user_id())
    )


@bp.delete("/<uuid:comment_id>")
@secured
def delete_comment(comment_id):
    return item_response(CommentService().delete(comment_id, current_user_id()))
