from flask import Blueprint, request

from app.api.v1.helpers import item_response, request_json
from app.repositories import GraphMaterializationRepository
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


@bp.post("/query")
@secured
def query_graph():
    """
    Query filtered nodes and edges from a workspace graph.

    Body:
      workspace_id   (required) UUID
      relation_types (optional) list[str]  — filter edges by type
      entity_type_ids(optional) list[UUID] — filter nodes by entity type
      limit          (optional) int         — max nodes to return (default 200)
    """
    from app.core.response import error
    data = request_json()
    workspace_id = data.get("workspace_id")
    if not workspace_id:
        return error("workspace_id is required", status=400)

    result = GraphService().query_graph(
        workspace_id=workspace_id,
        relation_types=data.get("relation_types"),
        entity_type_ids=data.get("entity_type_ids"),
        limit=int(data.get("limit", 200)),
    )
    return item_response(result)


@bp.post("/traverse")
@secured
def traverse_graph():
    """
    BFS traversal from a center node up to a configurable depth.

    Body:
      workspace_id   (required) UUID
      center_node    (required) UUID  — starting entity ID
      depth          (optional) int   — traversal depth limit (default 2, max 5)
      relation_types (optional) list[str] — filter traversal by edge type
    """
    from app.core.response import error
    data = request_json()
    workspace_id = data.get("workspace_id")
    center_node = data.get("center_node")
    if not workspace_id or not center_node:
        return error("workspace_id and center_node are required", status=400)

    depth = min(int(data.get("depth", 2)), 5)  # cap at 5 to prevent runaway queries
    result = GraphService().traverse_graph(
        workspace_id=workspace_id,
        center_node_id=center_node,
        depth=depth,
        relation_types=data.get("relation_types"),
    )
    if result is None:
        return error("center_node not found in this workspace", status=404, code="not_found")
    return item_response(result)


@bp.post("/paths")
@secured
def find_path():
    """
    Find the shortest path between two entities in the workspace graph.

    Body:
      workspace_id      (required) UUID
      source_entity_id  (required) UUID
      target_entity_id  (required) UUID
    """
    from app.core.response import error
    data = request_json()
    workspace_id = data.get("workspace_id")
    source = data.get("source_entity_id")
    target = data.get("target_entity_id")
    if not workspace_id or not source or not target:
        return error("workspace_id, source_entity_id, and target_entity_id are required", status=400)

    result = GraphService().find_shortest_path(
        workspace_id=workspace_id,
        source_entity_id=source,
        target_entity_id=target,
    )
    if result is None:
        return item_response({"source": source, "target": target, "path": [], "edges": [], "distance": -1})
    return item_response(result)
