import time
import uuid

import structlog
from flask import g, request


def install_request_context(app):
    @app.before_request
    def bind_request_context():
        g.request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        g.started_at = time.perf_counter()
        structlog.contextvars.bind_contextvars(
            request_id=g.request_id,
            method=request.method,
            path=request.path,
        )

    @app.after_request
    def add_request_headers(response):
        response.headers["X-Request-ID"] = g.get("request_id", "")
        if g.get("started_at") is not None:
            response.headers["X-Response-Time-Ms"] = f"{(time.perf_counter() - g.started_at) * 1000:.2f}"
        structlog.contextvars.clear_contextvars()
        return response
