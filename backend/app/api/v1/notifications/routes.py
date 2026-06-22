from flask import Blueprint, request

from app.api.v1.helpers import item_response, list_response, pagination_args, request_json
from app.core.validation import load_schema
from app.repositories.domain import NotificationRepository
from app.schemas.domain import NotificationCreateSchema
from app.services.notification_service import NotificationService
from app.services.security import secured

bp = Blueprint("notifications", __name__)


@bp.get("/")
@secured
def list_notifications():
    args = pagination_args()
    return list_response(
        NotificationRepository().list(
            {"workspace_id": request.args.get("workspace_id"), "user_id": request.args.get("user_id")},
            args["page"],
            args["per_page"],
        )
    )


@bp.post("/")
@secured
def create_notification():
    return item_response(NotificationService().create(load_schema(NotificationCreateSchema(), request_json())), 201)


@bp.post("/<string:notification_id>/read")
@secured
def mark_read(notification_id):
    return item_response(NotificationService().mark_read(notification_id))
