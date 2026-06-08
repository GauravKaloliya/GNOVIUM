from flask import Blueprint, request

from app.api.v1.helpers import item_response, list_response, pagination_args, request_json
from app.core.validation import load_schema
from app.repositories.domain import BranchRepository
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


@bp.get("/<uuid:branch_id>")
@secured
def get_branch(branch_id):
    return item_response(BranchRepository().get(branch_id))


@bp.post("/merge")
@secured
def merge_branch():
    return item_response(BranchService().merge(load_schema(MergeBranchSchema(), request_json()), current_user_id()), 201)
