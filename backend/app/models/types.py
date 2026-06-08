"""
PostgreSQL-specific custom column types.
These use native PG extensions: pgvector for vector similarity search,
TSVECTOR for full-text search. No SQLite fallbacks needed.
"""
from sqlalchemy.dialects.postgresql import TSVECTOR
from sqlalchemy.types import UserDefinedType


class Vector(UserDefinedType):
    """pgvector VECTOR(n) column type for embedding similarity search."""
    cache_ok = True

    def __init__(self, dim=1536):
        self.dim = dim

    def get_col_spec(self, **kw):
        return f"VECTOR({self.dim})"

    def bind_processor(self, dialect):
        def process(value):
            if value is None:
                return None
            if isinstance(value, (list, tuple)):
                return f"[{','.join(str(v) for v in value)}]"
            return value
        return process

    def result_processor(self, dialect, coltype):
        def process(value):
            if value is None:
                return None
            if isinstance(value, str):
                return [float(x) for x in value.strip("[]").split(",")]
            return value
        return process
