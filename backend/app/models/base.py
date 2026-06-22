import uuid
from datetime import datetime

from app.extensions import db


class UUIDPrimaryKeyMixin:
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))


class TimestampMixin:
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime(timezone=True), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)


class SoftDeleteMixin:
    is_deleted = db.Column(db.Boolean, nullable=False, default=False)


class CreatedOnlyMixin:
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=datetime.utcnow)
