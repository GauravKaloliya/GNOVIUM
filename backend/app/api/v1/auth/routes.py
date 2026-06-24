from flask import Blueprint, request
from flask_jwt_extended import jwt_required

from app.api.v1.helpers import item_response, raw_response, request_json
from app.core.serialization import model_to_dict
from app.core.errors import ApiError
from app.core.validation import load_schema
from app.repositories.domain import UserRepository
from app.schemas.domain import LoginSchema, RegisterSchema
from app.services.auth_service import AuthService
from app.services.security import current_user_id, secured

bp = Blueprint("auth", __name__)


@bp.post("/register")
def register():
    result = AuthService().register(load_schema(RegisterSchema(), request_json()))
    return raw_response(result, 201)


@bp.post("/login")
def login():
    return raw_response(AuthService().login(load_schema(LoginSchema(), request_json())))


@bp.get("/check-email")
def check_email():
    email = request.args.get("email", "").strip().lower()
    if not email:
        raise ApiError("Email is required.")
    exists = UserRepository().find_by_email(email) is not None
    return raw_response({"available": not exists})


@bp.post("/refresh")
@jwt_required(refresh=True)
def refresh():
    return raw_response(AuthService().refresh())


@bp.post("/google")
def google_login():
    data = request_json()
    credential = data.get("credential")
    if not credential:
        raise ApiError("Missing Google credential.")
    return raw_response(AuthService().google_login(credential))


@bp.post("/logout")
@jwt_required(refresh=True)
def logout():
    return raw_response(AuthService().logout())


@bp.get("/me")
@secured
def get_me():
    return item_response(UserRepository().get(current_user_id()))


@bp.patch("/me")
@secured
def update_me():
    data = request_json()
    allowed = {"name", "avatar_url"}
    updates = {k: v for k, v in data.items() if k in allowed}
    repo = UserRepository()
    user = repo.get(current_user_id())
    repo.update(user, updates)
    from app.extensions import db
    db.session.commit()
    return item_response(user)
