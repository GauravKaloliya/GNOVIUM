from redis import Redis
from importlib import import_module

from app.core.config import get_config
from app.core.errors import ApiError
from app.core.logging import configure_logging
from app.core.response import error, ok
from app.extensions import cache, cors, db, jwt, limiter, migrate
import app.extensions as extensions
from app.middleware.request_context import install_request_context
from app.middleware.security import install_security_middleware


def create_app(config_object=None):
    from flask import Flask

    if config_object is None:
        config_object = get_config()

    app = Flask(__name__)
    app.config.from_object(config_object)

    configure_logging()
    import_module("app.models")

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    cors.init_app(app, origins=app.config["CORS_ORIGINS"], supports_credentials=True)
    install_request_context(app)
    install_security_middleware(app)
    limiter.init_app(app)

    try:
        if app.config["REDIS_URL"].startswith("redis"):
            extensions.redis_client = Redis.from_url(app.config["REDIS_URL"], decode_responses=True)
            extensions.redis_client.ping()
        else:
            extensions.redis_client = None
    except Exception:
        if app.config.get("REQUIRE_REDIS"):
            raise
        extensions.redis_client = None

    cache_config = {
        "CACHE_TYPE": app.config.get("CACHE_TYPE", "SimpleCache"),
        "CACHE_DEFAULT_TIMEOUT": app.config.get("CACHE_DEFAULT_TIMEOUT", 300),
    }
    if app.config.get("CACHE_REDIS_URL"):
        cache_config["CACHE_REDIS_URL"] = app.config["CACHE_REDIS_URL"]
    if app.config.get("CACHE_KEY_PREFIX"):
        cache_config["CACHE_KEY_PREFIX"] = app.config["CACHE_KEY_PREFIX"]
    app.config.update(cache_config)
    cache.init_app(app)

    with app.app_context():
        if app.config.get("AUTO_CREATE_TABLES", False) or app.config.get("TESTING"):
            import sqlalchemy
            try:
                db.create_all()
            except Exception as e:
                app.logger.warning(f"Table creation skipped: {e}")

    register_error_handlers(app)
    register_routes(app)
    return app


def register_routes(app):
    from app.api.v1 import api_v1

    @app.get("/health")
    def health():
        return ok({"status": "healthy", "service": "gnovium-api"})

    app.register_blueprint(api_v1, url_prefix="/api/v1")


def register_error_handlers(app):
    @app.errorhandler(ApiError)
    def handle_api_error(exc):
        return error(exc.message, exc.code, exc.status_code, exc.details)

    @app.errorhandler(404)
    def handle_not_found(_):
        return error("Route not found", "not_found", 404)

    @app.errorhandler(422)
    def handle_validation(exc):
        return error("Validation failed", "validation_error", 422, getattr(exc, "data", None))

    @app.errorhandler(Exception)
    def handle_unexpected(exc):
        app.logger.exception("Unhandled exception", exc_info=exc)
        return error("Internal server error", "internal_error", 500)
