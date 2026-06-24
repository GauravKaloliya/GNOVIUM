from app.core.serialization import to_json
from app.repositories import SearchRepository


class SearchService:
    def search(self, workspace_id, query, mode="hybrid", limit=20):
        repo = SearchRepository()
        if mode == "hybrid":
            return repo.hybrid_search(workspace_id, query, limit)
        if mode == "full_text":
            try:
                rows = repo.fts5_search(workspace_id, query, limit)
                return [to_json(dict(row)) for row in rows]
            except Exception:
                pass
        if mode == "blocks":
            try:
                rows = repo.blocks_fts_search(query, limit=limit)
                return [to_json(dict(row)) for row in rows]
            except Exception:
                pass
        if mode == "semantic":
            return {
                "results": [],
                "queued": False,
                "message": "Semantic search is ready for pgvector-backed embeddings; run embedding jobs first.",
            }
        keyword_results = repo.keyword(workspace_id, query, limit)
        return [
            {
                "id": str(doc.id),
                "entity_id": str(doc.entity_id) if doc.entity_id else None,
                "block_id": None,
                "title": doc.title,
                "content": doc.content,
                "score": 0.5,
            }
            for doc in keyword_results
        ]

    def rebuild_entity_index(self, entity_id):
        repo = SearchRepository()
        repo.rebuild_entity_index(entity_id)

    def delete_entity_index(self, entity_id):
        repo = SearchRepository()
        repo.delete_entity_index(entity_id)
