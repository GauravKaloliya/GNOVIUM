from flask import Blueprint, request

from app.api.v1.helpers import item_response, list_response, pagination_args, request_json
from app.core.validation import load_schema
from app.repositories.domain import BlockRepository
from app.schemas.domain import BlockCreateSchema, BlockUpdateSchema, MoveBlockSchema
from app.services.block_service import BlockService
from app.services.security import current_user_id, secured

bp = Blueprint("blocks", __name__)


@bp.get("/")
@secured
def list_blocks():
    args = pagination_args()
    return list_response(BlockRepository().list({"entity_id": request.args.get("entity_id")}, args["page"], args["per_page"]))


@bp.post("/")
@secured
def create_block():
    return item_response(BlockService().create(load_schema(BlockCreateSchema(), request_json()), current_user_id()), 201)


@bp.patch("/<uuid:block_id>")
@secured
def update_block(block_id):
    return item_response(BlockService().update(block_id, load_schema(BlockUpdateSchema(), request_json(), partial=True), current_user_id()))


@bp.post("/<uuid:block_id>/move")
@secured
def move_block(block_id):
    return item_response(BlockService().move(block_id, load_schema(MoveBlockSchema(), request_json())))


@bp.delete("/<uuid:block_id>")
@secured
def delete_block(block_id):
    return item_response(BlockService().delete(block_id))
