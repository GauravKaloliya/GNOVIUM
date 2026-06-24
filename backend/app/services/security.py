from functools import wraps

from flask import current_app
from flask_jwt_extended import get_jwt_identity, jwt_required


def current_user_id():
    identity = get_jwt_identity()
    return str(identity) if identity else None


def secured(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        return jwt_required()(fn)(*args, **kwargs)
    return wrapper
