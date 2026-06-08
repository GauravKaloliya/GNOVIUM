from flask import Blueprint, request

from app.api.v1.helpers import item_response, list_response, raw_response, request_json
from app.repositories.domain import GraphMaterializationRepository
from app.services.graph_service import GraphService
from app.services.security import secured

bp = Blueprint("graph", __name__)


@bp.get("/")
@secured
def get_graph():
    """Return the latest materialized graph snapshot for a workspace."""
    workspace_id = request.args.get("workspace_id")
    if not workspace_id:
        from app.core.response import error
        return error("workspace_id query param is required", status=400)
    mat = GraphMaterializationRepository().latest(workspace_id)
    if mat is None:
        from app.core.response import error
        return error("No graph materialization found. POST /graph/materialize first.", status=404, code="not_found")
    return item_response(mat)


@bp.post("/materialize")
@secured
def materialize_graph():
    """Generate a fresh graph snapshot and store it."""
    data = request_json()
    workspace_id = data.get("workspace_id")
    if not workspace_id:
        from app.core.response import error
        return error("workspace_id is required", status=400)
    return item_response(GraphService().materialize(workspace_id), 201)
