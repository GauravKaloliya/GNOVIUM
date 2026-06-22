from app.core.serialization import to_json
from app.repositories.domain import SearchRepository


class SearchService:
    def search(self, workspace_id, query, mode="hybrid", limit=20):
        repo = SearchRepository()
        if mode == "full_text":
            try:
                return [to_json(dict(row)) for row in repo.postgres_full_text(workspace_id, query, limit)]
            except Exception:
                return [to_json(doc.__dict__) for doc in repo.keyword(workspace_id, query, limit)]
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
                "block_id": str(doc.block_id) if doc.block_id else None,
                "title": doc.title,
                "content": doc.content,
                "score": 1.0,
            }
            for doc in keyword_results
        ]
