from flask import Blueprint, request

from app.api.v1.helpers import item_response, list_response, pagination_args, request_json
from app.core.validation import load_schema
from app.repositories import BranchRepository
from app.schemas.domain import BranchCreateSchema, MergeBranchSchema

from app.services.security import current_user_id, secured
from app.services.versioning_service import BranchService

bp = Blueprint("branches", __name__)


@bp.get("/")
@secured
def list_branches():
    args = pagination_args()
    return list_response(BranchRepository().list({"workspace_id": request.args.get("workspace_id")}, args["page"], args["per_page"]))


@bp.post("/")
@secured
def create_branch():
    return item_response(BranchService().create(load_schema(BranchCreateSchema(), request_json()), current_user_id()), 201)


@bp.get("/<string:branch_id>")
@secured
def get_branch(branch_id):
    return item_response(BranchRepository().get(branch_id))


@bp.delete("/<string:branch_id>")
@secured
def delete_branch(branch_id):
    return item_response(BranchService().delete(branch_id, current_user_id()))


@bp.post("/<string:branch_id>/merge")
@secured
def merge_branch(branch_id):
    data = request_json()
    target_branch_id = data.get("target_branch_id")
    if not target_branch_id:
        from app.core.response import error
        return error("target_branch_id is required", status=400)
    return item_response(BranchService().merge({
        "source_branch_id": branch_id,
        "target_branch_id": target_branch_id,
    }, current_user_id()), 201)


@bp.post("/merge")
@secured
def merge_branches():
    return item_response(BranchService().merge(load_schema(MergeBranchSchema(), request_json()), current_user_id()), 201)
