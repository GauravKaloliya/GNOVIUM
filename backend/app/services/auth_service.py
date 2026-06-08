from datetime import datetime, timezone

import bcrypt as bcrypt_lib
from flask import request
from flask_jwt_extended import create_access_token, create_refresh_token, decode_token, get_jwt

from app.core.errors import ConflictError, ForbiddenError
from app.extensions import db
from app.repositories.domain import SessionRepository, UserRepository


def hash_password(password: str) -> str:
    return bcrypt_lib.hashpw(password.encode("utf-8"), bcrypt_lib.gensalt()).decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    try:
        return bcrypt_lib.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


class AuthService:
    def register(self, data):
        repo = UserRepository()
        if repo.find_by_email(data["email"]):
            raise ConflictError("Email is already registered")
        user = repo.create(
            {
                "email": data["email"].lower(),
                "name": data.get("name"),
                "password_hash": hash_password(data["password"]),
            }
        )
        db.session.commit()
        return user

    def login(self, data):
        user = UserRepository().find_by_email(data["email"])
        if not user or not user.password_hash or not verify_password(data["password"], user.password_hash):
            raise ForbiddenError("Invalid email or password")
        access_token = create_access_token(identity=str(user.id))
        refresh_token = create_refresh_token(identity=str(user.id))
        decoded = decode_token(refresh_token)
        SessionRepository().create(
            {
                "user_id": user.id,
                "refresh_jti": decoded["jti"],
                "user_agent": request.headers.get("User-Agent"),
                "ip_address": request.headers.get("X-Forwarded-For", request.remote_addr),
                "expires_at": datetime.fromtimestamp(decoded["exp"], tz=timezone.utc),
            }
        )
        db.session.commit()
        return {"access_token": access_token, "refresh_token": refresh_token}

    def refresh(self):
        claims = get_jwt()
        session = SessionRepository().find_active_refresh(claims["jti"])
        if not session:
            raise ForbiddenError("Refresh token is revoked or expired")
        return {"access_token": create_access_token(identity=str(session.user_id))}

    def logout(self):
        claims = get_jwt()
        session = SessionRepository().find_active_refresh(claims["jti"])
        if session:
            session.revoked_at = datetime.now(timezone.utc)
            db.session.commit()
        return {"revoked": True}
