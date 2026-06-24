import uuid
from datetime import datetime

from app.extensions import db


class TextPKMixin:
    id = db.Column(
        db.String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        server_default=db.text("(lower(hex(randomblob(16))))"),
    )


class TimestampMixin:
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, server_default=db.text('CURRENT_TIMESTAMP'))
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow, server_default=db.text('CURRENT_TIMESTAMP'))


class SoftDeleteMixin:
    is_deleted = db.Column(db.Boolean, nullable=False, default=False, server_default=db.text('0'))
    deleted_at = db.Column(db.DateTime, nullable=True)
    deleted_by = db.Column(db.String(36), nullable=True)


class CreatedOnlyMixin:
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, server_default=db.text('CURRENT_TIMESTAMP'))
