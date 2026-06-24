import os
from datetime import timedelta
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parents[2]
load_dotenv(BASE_DIR / ".env")

GNOVIUM_MODE = os.getenv("GNOVIUM_MODE", "local").strip().lower()

if GNOVIUM_MODE == "cloud":
    load_dotenv(BASE_DIR / ".env.cloud", override=True)
else:
    load_dotenv(BASE_DIR / ".env.local", override=True)


def is_production():
    return GNOVIUM_MODE == "cloud"


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
    if not value:
        return []
    value = value.strip().strip('"').strip("'")
    return [item.strip().strip('"').strip("'") for item in value.split(",") if item.strip()]


def database_url():
    url = os.environ.get("DATABASE_URL", "")
    if not url:
        if GNOVIUM_MODE == "cloud":
            raise RuntimeError("DATABASE_URL is required in cloud mode")
        db_dir = BASE_DIR / "data"
        db_dir.mkdir(parents=True, exist_ok=True)
        sqlite_path = db_dir / "local.db"
        return f"sqlite:///{sqlite_path}"
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+psycopg://", 1)
    return url


def is_sqlite():
    url = os.environ.get("DATABASE_URL", "")
    return not url or url.startswith("sqlite")


def redis_url():
    url = os.getenv("REDIS_URL", "")
    if not url:
        return ""
    if "upstash.io" in url and url.startswith("redis://"):
        return url.replace("redis://", "rediss://", 1)
    return url


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-in-production")
    REDIS_URL = os.getenv("REDIS_URL", "")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-jwt-secret-change-in-production")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=int(os.getenv("JWT_ACCESS_MINUTES", "30")))
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=int(os.getenv("JWT_REFRESH_DAYS", "14")))
    SQLALCHEMY_DATABASE_URI = database_url()
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    CORS_ORIGINS = env_list("CORS_ORIGINS", "http://localhost:3000")
    TRUSTED_ORIGINS = CORS_ORIGINS
    ALLOWED_HOSTS = env_list("ALLOWED_HOSTS", "127.0.0.1,localhost")
    MAX_CONTENT_LENGTH = int(os.getenv("MAX_CONTENT_LENGTH", str(10 * 1024 * 1024)))
    OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "")
    OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.1")
    EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "nomic-embed-text")
    GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
    AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
    AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID", "")
    AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY", "")
    S3_BUCKET = os.getenv("S3_BUCKET", "")
    S3_PUBLIC_BASE_URL = os.getenv("S3_PUBLIC_BASE_URL", "")

    # Caching defaults (overridden by subclasses)
    CACHE_TYPE = "SimpleCache"
    CACHE_DEFAULT_TIMEOUT = 300
    CACHE_REDIS_URL = ""
    CACHE_KEY_PREFIX = "gnovium:"


class LocalConfig(Config):
    GNOVIUM_MODE = "local"
    SQLALCHEMY_ENGINE_OPTIONS = {
        "connect_args": {"check_same_thread": False},
        "pool_pre_ping": True,
    }
    CORS_ORIGINS = env_list("CORS_ORIGINS", "http://localhost:3000")
    ALLOWED_HOSTS = env_list("ALLOWED_HOSTS", "localhost,127.0.0.1")
    RATELIMIT_DEFAULT = os.getenv("RATELIMIT_DEFAULT", "1000 per minute")
    RATELIMIT_STORAGE_URI = os.getenv("REDIS_URL") or "memory://"
    AUTO_CREATE_TABLES = env_bool("AUTO_CREATE_TABLES", True)
    REQUIRE_REDIS = env_bool("REQUIRE_REDIS", False)
    PREFERRED_URL_SCHEME = "http"
    SESSION_COOKIE_SECURE = False
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Lax"
    CACHE_TYPE = os.getenv("CACHE_TYPE", "SimpleCache")
    CACHE_DEFAULT_TIMEOUT = 300
    LOCAL_STORAGE_QUOTA = int(os.getenv("LOCAL_STORAGE_QUOTA", str(500 * 1024 * 1024)))


class CloudConfig(Config):
    GNOVIUM_MODE = "cloud"
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
        "pool_size": int(os.getenv("DB_POOL_SIZE", "1")),
        "max_overflow": int(os.getenv("DB_MAX_OVERFLOW", "4")),
        "pool_recycle": int(os.getenv("DB_POOL_RECYCLE", "280")),
    }
    CORS_ORIGINS = env_list("CORS_ORIGINS", "https://gnovium.com,https://www.gnovium.com")
    ALLOWED_HOSTS = env_list("ALLOWED_HOSTS", "gnovium.com,www.gnovium.com,api.gnovium.com")
    RATELIMIT_DEFAULT = os.getenv("RATELIMIT_DEFAULT", "200 per minute")
    RATELIMIT_STORAGE_URI = redis_url()
    AUTO_CREATE_TABLES = env_bool("AUTO_CREATE_TABLES", False)
    REQUIRE_REDIS = env_bool("REQUIRE_REDIS", False)
    PREFERRED_URL_SCHEME = "https"
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Lax"
    CACHE_TYPE = os.getenv("CACHE_TYPE", "RedisCache")
    CACHE_REDIS_URL = redis_url()
    CACHE_DEFAULT_TIMEOUT = 300
    CACHE_KEY_PREFIX = "gnovium:"


class TestingConfig(LocalConfig):
    TESTING = True
    JWT_SECRET_KEY = "test-jwt-secret-thats-at-least-32-bytes!!"
    AUTO_CREATE_TABLES = False
    REQUIRE_REDIS = False
    CACHE_TYPE = "NullCache"
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL", "sqlite://")
    RATELIMIT_STORAGE_URI = "memory://"


def get_config():
    mode = os.getenv("GNOVIUM_MODE", "").strip().lower()
    if mode == "cloud" or os.getenv("VERCEL") == "1":
        return CloudConfig
    return LocalConfig
