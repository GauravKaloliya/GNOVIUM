import hashlib
import json
from collections import deque
from datetime import datetime

from app.extensions import db
from app.repositories.domain import GraphMaterializationRepository, RelationRepository, EntityRepository


class GraphService:
    def materialize(self, workspace_id):
        """Generate and store a graph snapshot for the given workspace."""
        entities = EntityRepository().query().filter_by(workspace_id=workspace_id).all()
        relations = RelationRepository().query().filter_by(workspace_id=workspace_id).all()

        nodes = [
            {"id": str(e.id), "title": e.title, "type": str(e.entity_type_id), "icon": e.icon}
            for e in entities
        ]
        edges = [
            {
                "id": str(r.id),
                "source": str(r.source_entity_id),
                "target": str(r.target_entity_id),
                "type": r.relation_type,
            }
            for r in relations
        ]
        snapshot = {"nodes": nodes, "edges": edges, "generated_at": datetime.utcnow().isoformat()}
        version_hash = hashlib.sha256(json.dumps(snapshot, sort_keys=True).encode()).hexdigest()

        mat = GraphMaterializationRepository().create(
            {
                "workspace_id": workspace_id,
                "graph_snapshot": snapshot,
                "version_hash": version_hash,
            }
        )
        db.session.commit()
        return mat

    def query_graph(self, workspace_id, relation_types=None, entity_type_ids=None, limit=200):
        """
        Query filtered nodes and edges from a workspace.
        Optionally filter by relation_types (list of strings) and entity_type_ids.
        """
        entity_q = EntityRepository().query().filter_by(workspace_id=workspace_id)
        if entity_type_ids:
            from app.models.domain import Entity
            entity_q = entity_q.filter(Entity.entity_type_id.in_(entity_type_ids))
        entities = entity_q.limit(limit).all()
        entity_ids = {str(e.id) for e in entities}

        relation_q = RelationRepository().query().filter_by(workspace_id=workspace_id)
        if relation_types:
            from app.models.domain import Relation
            relation_q = relation_q.filter(Relation.relation_type.in_(relation_types))
        relations = relation_q.all()
        # Only keep edges where both endpoints are in the node set
        edges = [
            {
                "id": str(r.id),
                "source": str(r.source_entity_id),
                "target": str(r.target_entity_id),
                "type": r.relation_type,
                "metadata": r.relation_metadata or {},
            }
            for r in relations
            if str(r.source_entity_id) in entity_ids and str(r.target_entity_id) in entity_ids
        ]

        nodes = [
            {
                "id": str(e.id),
                "title": e.title,
                "type": str(e.entity_type_id),
                "icon": e.icon,
                "is_archived": e.is_archived,
            }
            for e in entities
        ]

        return {
            "workspace_id": workspace_id,
            "nodes": nodes,
            "edges": edges,
            "node_count": len(nodes),
            "edge_count": len(edges),
        }

    def traverse_graph(self, workspace_id, center_node_id, depth=2, relation_types=None):
        """
        BFS traversal from a center node up to a given depth.
        Returns all reachable nodes and edges within the depth limit.
        Returns an error dict if center_node_id is not found.
        """
        all_relations = RelationRepository().query().filter_by(workspace_id=workspace_id).all()

        if relation_types:
            all_relations = [r for r in all_relations if r.relation_type in relation_types]

        # Build adjacency map: node_id -> list of (neighbor_id, relation)
        adjacency: dict[str, list] = {}
        for r in all_relations:
            src = str(r.source_entity_id)
            tgt = str(r.target_entity_id)
            adjacency.setdefault(src, []).append((tgt, r))
            adjacency.setdefault(tgt, []).append((src, r))

        # BFS
        visited_nodes: set[str] = {center_node_id}
        visited_edges: set[str] = set()
        queue = deque([(center_node_id, 0)])
        result_edges = []

        while queue:
            node_id, current_depth = queue.popleft()
            if current_depth >= depth:
                continue
            for neighbor_id, relation in adjacency.get(node_id, []):
                edge_id = str(relation.id)
                if edge_id not in visited_edges:
                    visited_edges.add(edge_id)
                    result_edges.append({
                        "id": edge_id,
                        "source": str(relation.source_entity_id),
                        "target": str(relation.target_entity_id),
                        "type": relation.relation_type,
                        "metadata": relation.relation_metadata or {},
                    })
                if neighbor_id not in visited_nodes:
                    visited_nodes.add(neighbor_id)
                    queue.append((neighbor_id, current_depth + 1))

        # Fetch entity details for all visited nodes
        from app.models.domain import Entity
        entity_ids = list(visited_nodes)
        entities = EntityRepository().query().filter(Entity.id.in_(entity_ids)).all()
        entity_map = {str(e.id): e for e in entities}

        if center_node_id not in entity_map:
            return None  # center node not found

        nodes = [
            {
                "id": str(e.id),
                "title": e.title,
                "type": str(e.entity_type_id),
                "icon": e.icon,
                "depth": 0 if str(e.id) == center_node_id else None,
            }
            for e in entity_map.values()
        ]

        return {
            "center_node": center_node_id,
            "depth": depth,
            "nodes": nodes,
            "edges": result_edges,
            "node_count": len(nodes),
            "edge_count": len(result_edges),
        }

    def find_shortest_path(self, workspace_id, source_entity_id, target_entity_id):
        """
        BFS-based shortest path between two entities within a workspace.
        Returns the path as a list of entity IDs and the traversed edges.
        Returns None if no path exists.
        """
        if source_entity_id == target_entity_id:
            return {
                "source": source_entity_id,
                "target": target_entity_id,
                "path": [source_entity_id],
                "edges": [],
                "distance": 0,
            }

        all_relations = RelationRepository().query().filter_by(workspace_id=workspace_id).all()

        # Build adjacency: node_id -> list of (neighbor_id, relation)
        adjacency: dict[str, list] = {}
        for r in all_relations:
            src = str(r.source_entity_id)
            tgt = str(r.target_entity_id)
            adjacency.setdefault(src, []).append((tgt, r))
            adjacency.setdefault(tgt, []).append((src, r))

        # BFS with parent tracking
        visited: set[str] = {source_entity_id}
        parent: dict[str, tuple | None] = {source_entity_id: None}  # node -> (parent_node, relation)
        queue = deque([source_entity_id])

        while queue:
            current = queue.popleft()
            if current == target_entity_id:
                break
            for neighbor, relation in adjacency.get(current, []):
                if neighbor not in visited:
                    visited.add(neighbor)
                    parent[neighbor] = (current, relation)
                    queue.append(neighbor)

        if target_entity_id not in parent:
            return None  # No path found

        # Reconstruct path
        path_nodes = []
        path_edges = []
        current = target_entity_id
        while current is not None:
            path_nodes.append(current)
            if parent[current] is not None:
                prev_node, relation = parent[current]
                path_edges.append({
                    "id": str(relation.id),
                    "source": str(relation.source_entity_id),
                    "target": str(relation.target_entity_id),
                    "type": relation.relation_type,
                })
                current = prev_node
            else:
                current = None

        path_nodes.reverse()
        path_edges.reverse()

        return {
            "source": source_entity_id,
            "target": target_entity_id,
            "path": path_nodes,
            "edges": path_edges,
            "distance": len(path_nodes) - 1,
        }
