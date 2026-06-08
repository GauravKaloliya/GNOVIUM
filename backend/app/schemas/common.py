from marshmallow import Schema, EXCLUDE, fields, validate


class PaginationSchema(Schema):
    class Meta:
        unknown = EXCLUDE  # silently ignore extra query params like workspace_id, entity_id, etc.

    page = fields.Int(load_default=1, validate=validate.Range(min=1))
    per_page = fields.Int(load_default=25, validate=validate.Range(min=1, max=100))


class IdSchema(Schema):
    id = fields.UUID(required=True)
