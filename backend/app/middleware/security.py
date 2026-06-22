from urllib.parse import urlparse

from flask import request

from app.core.errors import ApiError, ForbiddenError


JSON_METHODS = {"POST", "PUT", "PATCH"}
PUBLIC_PREFIXES = ("/health",)


def install_security_middleware(app):
    @app.before_request
    def enforce_request_security():
        if not _host_allowed(app):
            raise ForbiddenError("Host is not allowed")
        if not _origin_allowed(app):
            raise ForbiddenError("Origin is not allowed")
        if request.method in JSON_METHODS:
            _enforce_content_type()
            _reject_null_bytes()

    @app.after_request
    def set_security_headers(response):
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("X-Frame-Options", "DENY")
        response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
        response.headers.setdefault("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
        response.headers.setdefault("Cross-Origin-Opener-Policy", "same-origin")
        response.headers.setdefault("Cross-Origin-Resource-Policy", "same-site")
        response.headers.setdefault("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'")
        if request.is_secure:
            response.headers.setdefault("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
        return response


def _host_allowed(app):
    allowed_hosts = app.config.get("ALLOWED_HOSTS") or []
    if "*" in allowed_hosts:
        return True
    host = request.host.split(":", 1)[0]
    return _matches_pattern(host, allowed_hosts)


def _origin_allowed(app):
    origin = request.headers.get("Origin")
    if not origin:
        return True
    allowed = app.config.get("TRUSTED_ORIGINS") or []
    if "*" in allowed:
        return True
    parsed_origin = urlparse(origin.rstrip("/"))
    if not parsed_origin.scheme or not parsed_origin.netloc:
        return False
    for item in allowed:
        parsed_allowed = urlparse(item.rstrip("/"))
        if parsed_allowed.scheme and parsed_allowed.scheme != parsed_origin.scheme:
            continue
        if _matches_pattern(parsed_origin.hostname or "", [parsed_allowed.hostname or item]):
            return True
    return False


def _matches_pattern(value, patterns):
    value = value.lower()
    for pattern in patterns:
        pattern = pattern.lower()
        if pattern == value:
            return True
        if pattern.startswith("*.") and value.endswith(pattern[1:]):
            return True
    return False


def _enforce_content_type():
    if request.path.startswith(PUBLIC_PREFIXES):
        return
    if request.content_length in (None, 0):
        return
    if request.mimetype in {"application/json", "multipart/form-data"}:
        return
    raise ApiError("Unsupported content type", 415, "unsupported_media_type")


def _reject_null_bytes():
    if not request.is_json:
        return
    raw = request.get_data(cache=True)
    if b"\x00" in raw:
        raise ApiError("Request body contains invalid characters", 400, "invalid_request_body")
