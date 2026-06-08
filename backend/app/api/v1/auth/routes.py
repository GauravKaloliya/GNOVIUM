from flask import Blueprint
from flask_jwt_extended import jwt_required

from app.api.v1.helpers import item_response, raw_response, request_json
from app.core.serialization import model_to_dict
from app.core.validation import load_schema
from app.schemas.domain import LoginSchema, RegisterSchema
from app.services.auth_service import AuthService

bp = Blueprint("auth", __name__)


@bp.post("/register")
def register():
    user = AuthService().register(load_schema(RegisterSchema(), request_json()))
    return raw_response(model_to_dict(user, exclude={"password_hash"}), 201)


@bp.post("/login")
def login():
    return raw_response(AuthService().login(load_schema(LoginSchema(), request_json())))


@bp.post("/refresh")
@jwt_required(refresh=True)
def refresh():
    return raw_response(AuthService().refresh())


@bp.post("/logout")
@jwt_required(refresh=True)
def logout():
    return raw_response(AuthService().logout())
