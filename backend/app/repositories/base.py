from sqlalchemy import inspect

from app.core.errors import NotFoundError
from app.extensions import db


class BaseRepository:
    model = None

    def __init__(self, model=None):
        if model is not None:
            self.model = model
        if self.model is None:
            raise ValueError("Repository model is required")

    def query(self, include_deleted=False):
        query = self.model.query
        if hasattr(self.model, "is_deleted") and not include_deleted:
            query = query.filter(self.model.is_deleted.is_(False))
        return query

    def list(self, filters=None, page=1, per_page=25, include_deleted=False, order_by=None):
        query = self.query(include_deleted=include_deleted)
        for key, value in (filters or {}).items():
            if value is not None and hasattr(self.model, key):
                query = query.filter(getattr(self.model, key) == value)
        if order_by is not None:
            query = query.order_by(order_by)
        elif hasattr(self.model, "created_at"):
            query = query.order_by(self.model.created_at.desc())
        return query.paginate(page=page, per_page=per_page, error_out=False)

    def get(self, object_id, include_deleted=False):
        item = self.query(include_deleted=include_deleted).filter(self.model.id == object_id).first()
        if not item:
            raise NotFoundError(f"{self.model.__name__} not found")
        return item

    def create(self, data):
        allowed = self.columns()
        item = self.model(**{key: value for key, value in data.items() if key in allowed})
        db.session.add(item)
        return item

    def update(self, item, data):
        allowed = self.columns()
        for key, value in data.items():
            if key in allowed and key != "id":
                setattr(item, key, value)
        return item

    def soft_delete(self, item):
        if hasattr(item, "is_deleted"):
            item.is_deleted = True
        else:
            db.session.delete(item)
        return item

    def columns(self):
        return {column.key for column in inspect(self.model).mapper.column_attrs}
