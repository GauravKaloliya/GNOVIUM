import hashlib
import json
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
