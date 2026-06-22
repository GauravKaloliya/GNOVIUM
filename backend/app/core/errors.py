from dataclasses import dataclass
from typing import Optional


@dataclass
class ApiError(Exception):
    message: str
    status_code: int = 400
    code: str = "bad_request"
    details: Optional[dict] = None


class NotFoundError(ApiError):
    def __init__(self, message: str = "Resource not found", details: Optional[dict] = None):
        super().__init__(message, 404, "not_found", details)


class ForbiddenError(ApiError):
    def __init__(self, message: str = "Forbidden", details: Optional[dict] = None):
        super().__init__(message, 403, "forbidden", details)


class ConflictError(ApiError):
    def __init__(self, message: str = "Conflict", details: Optional[dict] = None):
        super().__init__(message, 409, "conflict", details)
