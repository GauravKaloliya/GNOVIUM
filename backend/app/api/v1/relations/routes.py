from flask import Blueprint, request

from app.api.v1.helpers import item_response, list_response, raw_response, pagination_args, request_json
from app.core.serialization import model_to_dict
from app.core.validation import load_schema
from app.graph.service import GraphService
from app.repositories import RelationRepository
from app.schemas.domain import RelationCreateSchema
from app.services.relation_service import RelationService
from app.services.security import current_user_id, secured

bp = Blueprint("relations", __name__)


@bp.get("/")
@secured
def list_relations():
    args = pagination_args()
    return list_response(RelationRepository().list({"workspace_id": request.args.get("workspace_id")}, args["page"], args["per_page"]))


@bp.post("/")
@secured
def create_relation():
    return item_response(RelationService().create(load_schema(RelationCreateSchema(), request_json()), current_user_id()), 201)


@bp.get("/<string:relation_id>")
@secured
def get_relation(relation_id):
    return item_response(RelationRepository().get(relation_id))


@bp.delete("/<string:relation_id>")
@secured
def delete_relation(relation_id):
    return item_response(RelationService().delete(relation_id, current_user_id()))


@bp.get("/entity/<string:entity_id>")
@secured
def entity_relations(entity_id):
    return raw_response([model_to_dict(item) for item in RelationService().outgoing(entity_id)])


@bp.get("/backlinks/<string:entity_id>")
@secured
def backlinks(entity_id):
    return raw_response([model_to_dict(item) for item in RelationService().backlinks(entity_id)])


@bp.get("/neighbors/<string:entity_id>")
@secured
def neighbors(entity_id):
    return raw_response(GraphService().get_neighbors(entity_id))


@bp.get("/path")
@secured
def path():
    return raw_response(GraphService().find_path(request.args["source_entity_id"], request.args["target_entity_id"]))
