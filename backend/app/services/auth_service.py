from datetime import datetime, timezone

import bcrypt as bcrypt_lib
from flask import current_app, request
from flask_jwt_extended import create_access_token, create_refresh_token, decode_token, get_jwt

from app.core.errors import ApiError, ConflictError, ForbiddenError
from app.extensions import db
from app.repositories.domain import SessionRepository, UserRepository


from app.core.serialization import model_to_dict

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
        
        email_clean = data["email"].lower().strip()
        name_seed = (data.get("name") or email_clean).strip()
        avatar_url = f"https://api.dicebear.com/7.x/identicon/svg?seed={name_seed}"
        
        user = repo.create(
            {
                "email": email_clean,
                "name": data.get("name"),
                "password_hash": hash_password(data["password"]),
                "avatar_url": avatar_url,
            }
        )
        db.session.commit()

        # Log user in immediately on register
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

        return {
            "tokens": {"access_token": access_token, "refresh_token": refresh_token},
            "user": model_to_dict(user, exclude={"password_hash"}),
        }

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
        return {
            "tokens": {"access_token": access_token, "refresh_token": refresh_token},
            "user": model_to_dict(user, exclude={"password_hash"}),
        }

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

    def google_login(self, credential):
        from google.auth.transport import requests as google_requests
        from google.oauth2 import id_token

        client_id = current_app.config["GOOGLE_CLIENT_ID"]
        if not client_id:
            raise ApiError("Google sign-in is not configured.")

        try:
            id_info = id_token.verify_oauth2_token(credential, google_requests.Request(), client_id)
        except ValueError as e:
            raise ApiError(f"Invalid Google token: {e}")

        if id_info.get("iss") not in ["accounts.google.com", "https://accounts.google.com"]:
            raise ApiError("Invalid Google token issuer.")

        email = id_info.get("email")
        if not email:
            raise ApiError("Google account has no email address.")

        repo = UserRepository()
        user = repo.find_by_email(email)
        if not user:
            raise ApiError(
                "No account found with this email. Please sign up first.",
                status_code=404,
                code="not_found",
            )

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

        return {
            "tokens": {"access_token": access_token, "refresh_token": refresh_token},
            "user": model_to_dict(user, exclude={"password_hash"}),
        }
