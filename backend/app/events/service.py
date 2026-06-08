from app.extensions import db
from app.repositories.domain import ActivityLogRepository, EntityEventRepository


class EventService:
    def entity_event(self, entity_id, event_type, payload, changeset_id=None):
        event = EntityEventRepository().create(
            {
                "entity_id": entity_id,
                "changeset_id": changeset_id,
                "event_type": event_type,
                "payload": payload,
            }
        )
        return event

    def activity(self, workspace_id, action, user_id=None, entity_id=None, block_id=None, details=None):
        return ActivityLogRepository().create(
            {
                "workspace_id": workspace_id,
                "user_id": user_id,
                "entity_id": entity_id,
                "block_id": block_id,
                "action": action,
                "details": details or {},
            }
        )

    def commit(self):
        db.session.commit()
