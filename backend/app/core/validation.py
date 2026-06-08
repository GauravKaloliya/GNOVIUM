from marshmallow import ValidationError

from app.core.errors import ApiError


def load_schema(schema, payload, *, partial=False):
    try:
        return schema.load(payload or {}, partial=partial)
    except ValidationError as exc:
        raise ApiError("Validation failed", 422, "validation_error", exc.messages) from exc
