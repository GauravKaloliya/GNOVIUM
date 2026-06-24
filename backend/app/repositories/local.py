from datetime import datetime

from sqlalchemy import func, or_, text

from app.extensions import db
from app.models import Block, SearchDocument
from app.repositories.base import BaseRepository


class BlockRepository(BaseRepository):
    model = Block

    def _make_id(self):
        return __import__("uuid").uuid4().hex

    def next_position(self, entity_id, parent_block_id=None):
        query = db.session.query(func.coalesce(func.max(Block.position), 0)).filter(
            Block.entity_id == entity_id,
            Block.is_deleted.is_(False),
        )
        if parent_block_id:
            query = query.filter(Block.parent_block_id == parent_block_id)
        else:
            query = query.filter(Block.parent_block_id.is_(None))
        return query.scalar() + 1000

    def get(self, block_id, include_deleted=False, branch_id="main"):
        q = Block.query.filter(Block.id == str(block_id), Block.branch_id == branch_id)
        if not include_deleted:
            q = q.filter(Block.is_deleted.is_(False))
        block = q.order_by(Block.created_at.desc()).first()
        if not block:
            from app.core.errors import NotFoundError
            raise NotFoundError(f"Block not found")
        return block

    def list_current(self, entity_id, branch_id="main"):
        latest = (
            db.session.query(
                Block.id,
                func.max(Block.created_at).label("max_created_at"),
            )
            .filter(
                Block.entity_id == entity_id,
                Block.branch_id == branch_id,
            )
            .group_by(Block.id)
            .subquery()
        )
        return (
            db.session.query(Block)
            .join(
                latest,
                db.and_(
                    Block.id == latest.c.id,
                    Block.created_at == latest.c.max_created_at,
                ),
            )
            .filter(Block.is_deleted.is_(False))
            .order_by(Block.position)
            .all()
        )

    def create(self, data):
        data.setdefault("branch_id", "main")
        return super().create(data)

    def update(self, item, data):
        old = item
        data.setdefault("branch_id", old.branch_id)
        data.setdefault("id", old.id)
        data.setdefault("entity_id", old.entity_id)
        data.setdefault("position", old.position)
        if "content" not in data:
            data["content"] = old.content
        if "block_type" not in data:
            data["block_type"] = old.block_type
        if "parent_block_id" not in data:
            data["parent_block_id"] = old.parent_block_id
        data.pop("created_at", None)
        data.pop("is_deleted", None)
        if "content_hash" not in data:
            import hashlib, json
            data["content_hash"] = hashlib.sha256(
                json.dumps(data.get("content", old.content), sort_keys=True, default=str).encode()
            ).hexdigest()
        new_block = self.model(**data)
        db.session.add(new_block)
        return new_block

    def soft_delete(self, item, deleted_by=None):
        now = datetime.utcnow()
        data = {
            "id": item.id,
            "branch_id": item.branch_id,
            "entity_id": item.entity_id,
            "parent_block_id": item.parent_block_id,
            "block_type": item.block_type,
            "content": item.content,
            "position": item.position,
            "indent": item.indent,
            "content_hash": item.content_hash,
            "is_deleted": True,
            "deleted_at": now,
            "deleted_by": str(deleted_by) if deleted_by else None,
        }
        new_block = self.model(**data)
        db.session.add(new_block)
        return new_block


class SearchRepository(BaseRepository):
    model = SearchDocument

    def rebuild_entity_index(self, entity_id):
        from app.models import Entity
        entity = Entity.query.get(str(entity_id))
        if not entity:
            return

        blocks = (
            Block.query
            .filter(
                Block.entity_id == str(entity_id),
                Block.is_deleted.is_(False),
            )
            .order_by(Block.position)
            .all()
        )

        content_parts = []
        content_hash_input = ""
        for b in blocks:
            import json
            text = json.dumps(b.content, sort_keys=True, default=str) if b.content else ""
            content_parts.append(text)
            content_hash_input += text

        import hashlib
        full_content = " ".join(content_parts)
        new_hash = hashlib.sha256(content_hash_input.encode()).hexdigest()

        existing = SearchDocument.query.filter(
            SearchDocument.workspace_id == entity.workspace_id,
            SearchDocument.entity_id == str(entity_id),
        ).first()

        if existing:
            existing.content = full_content
            existing.content_hash = new_hash
            existing.title = entity.title
            existing.is_deleted = False
        else:
            doc = SearchDocument(
                workspace_id=entity.workspace_id,
                entity_id=str(entity_id),
                title=entity.title,
                content=full_content,
                content_hash=new_hash,
            )
            db.session.add(doc)

        db.session.commit()

    def delete_entity_index(self, entity_id):
        existing = SearchDocument.query.filter(
            SearchDocument.entity_id == str(entity_id),
        ).first()
        if existing:
            existing.is_deleted = True
            db.session.commit()

    def keyword(self, workspace_id, query, limit=20):
        return SearchDocument.query.filter(
            SearchDocument.workspace_id == workspace_id,
            SearchDocument.is_deleted.is_(False),
            or_(
                SearchDocument.title.ilike(f"%{query}%"),
                SearchDocument.content.ilike(f"%{query}%"),
            ),
        ).limit(limit).all()

    def hybrid_search(self, workspace_id, query, limit=20):
        results = []

        # 1. Real-time block-level search via FTS5
        try:
            block_sql = text(
                """
                SELECT b.id, b.entity_id, b.block_type, b.content, e.title AS entity_title,
                       rank, 'block' AS match_type
                FROM blocks_fts
                JOIN blocks b ON b.rowid = blocks_fts.rowid
                JOIN entities e ON e.id = b.entity_id
                WHERE blocks_fts MATCH :query
                  AND b.is_deleted = 0 AND e.is_deleted = 0
                  AND e.workspace_id = :workspace_id
                ORDER BY rank
                LIMIT :limit
                """
            )
            block_rows = db.session.execute(
                block_sql,
                {"workspace_id": workspace_id, "query": query, "limit": limit},
            ).mappings().all()
            for row in block_rows:
                import json
                results.append({
                    "id": row["id"],
                    "entity_id": row["entity_id"],
                    "block_id": row["id"],
                    "title": row["entity_title"],
                    "content": json.dumps(row["content"], default=str) if row["content"] else "",
                    "match_type": "block",
                    "score": max(0, 1.0 - float(row["rank"]) * 0.01),
                })
        except Exception:
            pass

        # 2. Page-level search via materialized search_documents FTS5
        try:
            page_sql = text(
                """
                SELECT sd.*, rank, 'page' AS match_type
                FROM search_documents_fts
                JOIN search_documents sd ON sd.rowid = search_documents_fts.rowid
                WHERE search_documents_fts MATCH :query
                  AND sd.workspace_id = :workspace_id
                  AND sd.is_deleted = 0
                ORDER BY rank
                LIMIT :limit
                """
            )
            page_rows = db.session.execute(
                page_sql,
                {"workspace_id": workspace_id, "query": query, "limit": limit},
            ).mappings().all()
            for row in page_rows:
                results.append({
                    "id": row["id"],
                    "entity_id": row["entity_id"],
                    "block_id": None,
                    "title": row["title"],
                    "content": row["content"],
                    "match_type": "page",
                    "score": max(0, 1.0 - float(row["rank"]) * 0.01),
                })
        except Exception:
            pass

        # 3. Fallback: LIKE-based keyword search on search_documents
        if not results:
            for doc in self.keyword(workspace_id, query, limit):
                results.append({
                    "id": str(doc.id),
                    "entity_id": str(doc.entity_id),
                    "block_id": None,
                    "title": doc.title,
                    "content": doc.content,
                    "match_type": "page",
                    "score": 0.5,
                })

        return results[:limit]

    def fts5_search(self, workspace_id, query, limit=20):
        sql = text(
            """
            SELECT sd.*, rank
            FROM search_documents_fts
            JOIN search_documents sd ON sd.rowid = search_documents_fts.rowid
            WHERE search_documents_fts MATCH :query
              AND sd.workspace_id = :workspace_id
              AND sd.is_deleted = 0
            ORDER BY rank
            LIMIT :limit
            """
        )
        return db.session.execute(
            sql,
            {"workspace_id": workspace_id, "query": query, "limit": limit},
        ).mappings().all()

    def blocks_fts_search(self, query, entity_id=None, limit=20):
        if entity_id:
            sql = text(
                """
                SELECT b.*, rank
                FROM blocks b
                JOIN blocks_fts ON blocks_fts.rowid = b.rowid
                WHERE blocks_fts MATCH :query
                  AND b.entity_id = :entity_id
                  AND b.is_deleted = 0
                ORDER BY rank
                LIMIT :limit
                """
            )
            return db.session.execute(
                sql,
                {"query": query, "entity_id": entity_id, "limit": limit},
            ).mappings().all()
        sql = text(
            """
            SELECT b.*, rank
            FROM blocks b
            JOIN blocks_fts ON blocks_fts.rowid = b.rowid
            WHERE blocks_fts MATCH :query
              AND b.is_deleted = 0
            ORDER BY rank
            LIMIT :limit
            """
        )
        return db.session.execute(
            sql,
            {"query": query, "limit": limit},
        ).mappings().all()


class FileRepository(BaseRepository):
    model = __import__("app.models", fromlist=["File"]).File

    def find_by_hash(self, content_hash, workspace_id):
        return self.model.query.filter(
            self.model.content_hash == content_hash,
            self.model.workspace_id == workspace_id,
            self.model.is_deleted.is_(False),
        ).first()

    def hard_delete(self, item):
        if item.storage_provider == "local" and item.object_key:
            from flask import current_app
            local_path = os.path.join(
                current_app.instance_path, "uploads",
                item.object_key.replace("/", "_")
            )
            if os.path.exists(local_path):
                os.remove(local_path)
        db.session.delete(item)

    @staticmethod
    def cleanup_orphans(workspace_id=None):
        from app.models import EntityFile
        query = db.session.query(FileRepository.model).filter(
            FileRepository.model.is_deleted.is_(False),
        )
        if workspace_id:
            query = query.filter(FileRepository.model.workspace_id == workspace_id)

        count = 0
        for file_record in query.all():
            link = EntityFile.query.filter(
                EntityFile.file_id == file_record.id,
                EntityFile.is_deleted.is_(False),
            ).first()
            if not link:
                file_record.is_deleted = True
                file_record.deleted_at = datetime.utcnow()
                FileRepository._remove_from_disk(file_record)
                count += 1
        db.session.commit()
        return count

    @staticmethod
    def _remove_from_disk(file_record):
        if file_record.storage_provider != "local" or not file_record.object_key:
            return
        from flask import current_app
        local_path = os.path.join(
            current_app.instance_path, "uploads",
            file_record.object_key.replace("/", "_")
        )
        if os.path.exists(local_path):
            os.remove(local_path)


class ActivityLogRepository(BaseRepository):
    def __init__(self, model=None):
        from app.models import ActivityLog
        super().__init__(model or ActivityLog)

    def list_for_workspace(self, workspace_id, page=1, per_page=50):
        return (
            self.query(include_deleted=True)
            .filter(self.model.workspace_id == workspace_id)
            .order_by(self.model.created_at.desc())
            .paginate(page=page, per_page=per_page, error_out=False)
        )
