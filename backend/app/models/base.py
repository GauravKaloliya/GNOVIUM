import uuid
from datetime import datetime

from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from app.extensions import db


class UUIDPrimaryKeyMixin:
    id = db.Column(
        PG_UUID(as_uuid=False),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )


class TimestampMixin:
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime(timezone=True), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)


class SoftDeleteMixin:
    is_deleted = db.Column(db.Boolean, nullable=False, default=False)
    deleted_at = db.Column(db.DateTime(timezone=True), nullable=True)
    deleted_by = db.Column(PG_UUID(as_uuid=False), nullable=True)


class CreatedOnlyMixin:
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=datetime.utcnow)
