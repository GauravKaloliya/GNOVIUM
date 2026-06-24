from collections import deque

from app.repositories import RelationRepository


class GraphService:
    def get_neighbors(self, entity_id):
        relations = RelationRepository().neighbors(entity_id)
        return [
            {
                "relation_id": str(relation.id),
                "source_entity_id": str(relation.source_entity_id),
                "target_entity_id": str(relation.target_entity_id),
                "relation_type": relation.relation_type,
                "metadata": relation.relation_metadata or {},
            }
            for relation in relations
        ]

    def find_backlinks(self, entity_id):
        return RelationRepository().backlinks(entity_id)

    def find_path(self, source_entity_id, target_entity_id, max_depth=4):
        queue = deque([(str(source_entity_id), [])])
        visited = {str(source_entity_id)}
        while queue:
            current, path = queue.popleft()
            if len(path) >= max_depth:
                continue
            for edge in self.get_neighbors(current):
                next_id = edge["target_entity_id"] if edge["source_entity_id"] == current else edge["source_entity_id"]
                if next_id in visited:
                    continue
                next_path = [*path, edge]
                if next_id == str(target_entity_id):
                    return next_path
                visited.add(next_id)
                queue.append((next_id, next_path))
        return []

    def centrality_score(self, entity_id):
        return len(self.get_neighbors(entity_id))

    def related_entities(self, entity_id, limit=20):
        neighbors = self.get_neighbors(entity_id)
        ids = []
        for edge in neighbors:
            ids.append(edge["target_entity_id"] if edge["source_entity_id"] == str(entity_id) else edge["source_entity_id"])
        return ids[:limit]
