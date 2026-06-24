from flask import Blueprint, request

from app.api.v1.helpers import item_response, list_response, pagination_args, request_json
from app.core.validation import load_schema
from app.repositories import BlockRepository, EntityRepository, EntityTypeRepository, PropertyRepository
from app.schemas.domain import EntityCreateSchema, EntityTypeCreateSchema, EntityUpdateSchema, PropertyCreateSchema
from app.services.entity_service import EntityService
from app.services.security import current_user_id, secured

bp = Blueprint("entities", __name__)


@bp.get("/")
@secured
def list_entities():
    args = pagination_args()
    filters = {"workspace_id": request.args.get("workspace_id"), "entity_type_id": request.args.get("entity_type_id")}
    return list_response(EntityRepository().list(filters, args["page"], args["per_page"]))


@bp.post("/")
@secured
def create_entity():
    return item_response(EntityService().create(load_schema(EntityCreateSchema(), request_json()), current_user_id()), 201)


@bp.get("/<string:entity_id>")
@secured
def get_entity(entity_id):
    return item_response(EntityRepository().get(entity_id))


@bp.patch("/<string:entity_id>")
@secured
def update_entity(entity_id):
    return item_response(
        EntityService().update(entity_id, load_schema(EntityUpdateSchema(), request_json(), partial=True), current_user_id())
    )


@bp.delete("/<string:entity_id>")
@secured
def delete_entity(entity_id):
    return item_response(EntityService().soft_delete(entity_id, current_user_id()))


@bp.post("/<string:entity_id>/restore")
@secured
def restore_entity(entity_id):
    return item_response(EntityService().restore(entity_id, current_user_id()))


@bp.post("/<string:entity_id>/archive")
@secured
def archive_entity(entity_id):
    return item_response(EntityService().archive(entity_id, True))


@bp.post("/<string:entity_id>/duplicate")
@secured
def duplicate_entity(entity_id):
    return item_response(EntityService().duplicate(entity_id, current_user_id()), 201)


@bp.get("/<string:entity_id>/children")
@secured
def get_children(entity_id):
    args = pagination_args()
    return list_response(EntityService().get_children(entity_id, args["page"], args["per_page"]))


@bp.post("/<string:entity_id>/children")
@secured
def create_child(entity_id):
    data = request_json()
    data["workspace_id"] = request_json().get("workspace_id")
    if not data.get("workspace_id"):
        from app.core.response import error
        return error("workspace_id is required", status=400)
    data["entity_type_id"] = request_json().get("entity_type_id")
    if not data.get("entity_type_id"):
        from app.core.response import error
        return error("entity_type_id is required", status=400)
    entity = EntityService().create({**data, "parent_id": entity_id}, current_user_id())
    return item_response(entity, 201)


@bp.get("/<string:entity_id>/versions")
@secured
def get_versions(entity_id):
    from flask import current_app
    if current_app.config.get("GNOVIUM_MODE") != "cloud":
        from app.core.response import error
        return error("Version history is not available in local mode", status=404)
    from app.repositories import EntityVersionRepository
    args = pagination_args()
    return list_response(EntityVersionRepository().list({"entity_id": entity_id}, args["page"], args["per_page"]))


@bp.post("/types")
@secured
def create_entity_type():
    return item_response(EntityService().create_type(load_schema(EntityTypeCreateSchema(), request_json())), 201)


@bp.get("/types")
@secured
def list_entity_types():
    args = pagination_args()
    return list_response(EntityTypeRepository().list({"workspace_id": request.args.get("workspace_id")}, args["page"], args["per_page"]))


@bp.post("/properties")
@secured
def create_property():
    return item_response(EntityService().create_property(load_schema(PropertyCreateSchema(), request_json())), 201)


@bp.get("/properties")
@secured
def list_properties():
    args = pagination_args()
    return list_response(PropertyRepository().list({"workspace_id": request.args.get("workspace_id")}, args["page"], args["per_page"]))
