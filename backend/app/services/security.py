from functools import wraps
from uuid import UUID

from flask_jwt_extended import get_jwt_identity, jwt_required

from app.core.errors import ForbiddenError
from app.repositories.domain import WorkspaceMemberRepository


def current_user_id():
    identity = get_jwt_identity()
    return str(identity) if identity else None


def require_workspace_role(workspace_id, roles=("owner", "admin", "editor", "viewer")):
    membership = WorkspaceMemberRepository().membership(workspace_id, current_user_id())
    if not membership or membership.role not in roles:
        raise ForbiddenError("You do not have access to this workspace")
    return membership


def secured(fn):
    @jwt_required()
    @wraps(fn)
    def wrapper(*args, **kwargs):
        return fn(*args, **kwargs)

    return wrapper
