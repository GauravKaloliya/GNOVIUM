from datetime import datetime

from app.extensions import db
from app.repositories.domain import SyncOperationRepository


class SyncService:
    def ingest(self, data, user_id):
        """Record an incoming sync operation from a client device."""
        op = SyncOperationRepository().create(data)
        db.session.commit()
        return op

    def mark_synced(self, operation_id):
        """Mark a sync operation as applied."""
        repo = SyncOperationRepository()
        op = repo.get(operation_id)
        op.synced = True
        op.synced_at = datetime.utcnow()
        db.session.commit()
        return op
