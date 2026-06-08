import os
from datetime import timedelta
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parents[2]
load_dotenv(BASE_DIR / ".env")
if os.getenv("FLASK_ENV") == "production":
    load_dotenv(BASE_DIR / ".env.production", override=True)


def is_production():
    return os.getenv("FLASK_ENV") == "production"


def required_env(name):
    value = os.getenv(name)
    if value is None or value == "":
        raise RuntimeError(f"{name} is required")
    return value


def env_bool(name, default=False):
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def env_list(name, default=""):
    value = os.getenv(name, default)
    return [item.strip() for item in value.split(",") if item.strip()]


def database_url():
    """Resolve and normalise the PostgreSQL connection URL.

    Supports:
      postgresql://...   → postgresql+psycopg://...  (psycopg v3)
      postgresql+psycopg2://...  (kept as-is for psycopg2 users)
    """
    url = os.environ["DATABASE_URL"]   # hard-fail if not set — no SQLite fallback
    if url.startswith("postgres://"):  # Heroku legacy shorthand
        url = url.replace("postgres://", "postgresql://", 1)
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+psycopg://", 1)
    return url


def redis_url():
    url = os.environ["REDIS_URL"]
    if "upstash.io" in url and url.startswith("redis://"):
        return url.replace("redis://", "rediss://", 1)
    return url


class Config:
    SECRET_KEY = required_env("SECRET_KEY") if is_production() else os.getenv("SECRET_KEY", "dev-secret-change-in-production")
    JWT_SECRET_KEY = required_env("JWT_SECRET_KEY") if is_production() else os.getenv("JWT_SECRET_KEY", "dev-jwt-secret-change-in-production")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=int(os.getenv("JWT_ACCESS_MINUTES", "30")))
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=int(os.getenv("JWT_REFRESH_DAYS", "14")))
    SQLALCHEMY_DATABASE_URI = database_url()
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
        "pool_size": int(os.getenv("DB_POOL_SIZE", "1")),
        "max_overflow": int(os.getenv("DB_MAX_OVERFLOW", "4")),
        "pool_recycle": int(os.getenv("DB_POOL_RECYCLE", "280")),
    }
    CORS_ORIGINS = env_list("CORS_ORIGINS", "http://localhost:3000")
    TRUSTED_ORIGINS = CORS_ORIGINS
    ALLOWED_HOSTS = env_list("ALLOWED_HOSTS", "127.0.0.1,localhost")
    MAX_CONTENT_LENGTH = int(os.getenv("MAX_CONTENT_LENGTH", str(10 * 1024 * 1024)))
    REDIS_URL = redis_url()
    RATELIMIT_DEFAULT = os.getenv("RATELIMIT_DEFAULT", "100 per minute")
    RATELIMIT_STORAGE_URI = REDIS_URL
    AUTO_CREATE_TABLES = False
    REQUIRE_REDIS = env_bool("REQUIRE_REDIS", is_production())
    PREFERRED_URL_SCHEME = "https" if is_production() else "http"
    SESSION_COOKIE_SECURE = is_production()
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Lax"
    OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "")
    OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.1")
    EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "nomic-embed-text")
    AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
    AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID", "")
    AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY", "")
    S3_BUCKET = os.getenv("S3_BUCKET", "")
    S3_PUBLIC_BASE_URL = os.getenv("S3_PUBLIC_BASE_URL", "")


class TestingConfig(Config):
    TESTING = True
    AUTO_CREATE_TABLES = False
    REQUIRE_REDIS = False
