from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from sqlalchemy import inspect as sa_inspect


def to_json(value):
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if isinstance(value, UUID):
        return str(value)
    if isinstance(value, Decimal):
        return float(value)
    if isinstance(value, list):
        return [to_json(item) for item in value]
    if isinstance(value, dict):
        return {key: to_json(item) for key, item in value.items()}
    return value


def model_to_dict(model, exclude=None):
    """Serialize a SQLAlchemy model instance (or plain dict) to a plain dict.

    Uses the ORM mapper's column_attrs so the Python attribute name is always
    used — avoiding the 'metadata' key collision where a DB column named
    'metadata' would clash with SQLAlchemy's own MetaData object.
    """
    exclude = set(exclude or [])
    if isinstance(model, dict):
        return {k: to_json(v) for k, v in model.items() if k not in exclude}
    result = {}
    mapper = sa_inspect(type(model))
    for attr in mapper.column_attrs:
        key = attr.key
        if key in exclude:
            continue
        col_name = attr.columns[0].name
        if col_name in exclude:
            continue
        try:
            value = getattr(model, key)
            result[key] = to_json(value)
        except Exception:
            result[key] = None
    return result
