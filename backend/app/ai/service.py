import requests
from flask import current_app

from app.services.search_service import SearchService


class AIService:
    def answer(self, workspace_id, question, limit=8):
        documents = SearchService().search(workspace_id, question, "hybrid", limit)
        context = self._build_context(documents)
        prompt = (
            "You are Gnovium's knowledge assistant. Answer only from the provided context. "
            "If the answer is not present, say what context is missing.\n\n"
            f"Context:\n{context}\n\nQuestion: {question}"
        )
        response = self._ollama_generate(prompt)
        return {"answer": response, "sources": documents}

    def _build_context(self, documents):
        if isinstance(documents, dict):
            return ""
        return "\n\n".join(
            f"Title: {doc.get('title') or 'Untitled'}\nContent: {doc.get('content') or ''}" for doc in documents
        )

    def _ollama_generate(self, prompt):
        try:
            response = requests.post(
                f"{current_app.config['OLLAMA_BASE_URL']}/api/generate",
                json={"model": current_app.config["OLLAMA_MODEL"], "prompt": prompt, "stream": False},
                timeout=60,
            )
            response.raise_for_status()
            return response.json().get("response", "")
        except Exception as exc:
            return f"AI provider unavailable: {exc}"
