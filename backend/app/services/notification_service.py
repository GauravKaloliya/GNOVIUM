from app.extensions import db
from app.repositories import NotificationRepository


class NotificationService:
    def create(self, data):
        notification = NotificationRepository().create(data)
        db.session.commit()
        return notification

    def mark_read(self, notification_id):
        notification = NotificationRepository().get(notification_id)
        notification.is_read = True
        db.session.commit()
        return notification
