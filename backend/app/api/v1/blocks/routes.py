from flask import Blueprint, request

from app.api.v1.helpers import item_response, list_response, pagination_args, raw_response, request_json
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


@bp.get("/<string:block_id>")
@secured
def get_block(block_id):
    return item_response(BlockRepository().get(block_id))


@bp.patch("/<string:block_id>")
@secured
def update_block(block_id):
    return item_response(BlockService().update(block_id, load_schema(BlockUpdateSchema(), request_json(), partial=True), current_user_id()))


@bp.post("/<string:block_id>/move")
@secured
def move_block(block_id):
    return item_response(BlockService().move(block_id, load_schema(MoveBlockSchema(), request_json())))


@bp.delete("/<string:block_id>")
@secured
def delete_block(block_id):
    return item_response(BlockService().delete(block_id))


@bp.post("/reorder")
@secured
def reorder_blocks():
    data = request_json()
    entity_id = data.get("entity_id")
    block_order = data.get("blocks", [])
    if not entity_id or not block_order:
        from app.core.response import error
        return error("entity_id and blocks are required", status=400)
    from app.core.serialization import model_to_dict
    return raw_response([model_to_dict(b) for b in BlockService().reorder(entity_id, block_order)])


@bp.get("/entity/<string:entity_id>")
@secured
def entity_blocks(entity_id):
    args = pagination_args()
    return list_response(BlockRepository().list({"entity_id": entity_id}, args["page"], args["per_page"]))
