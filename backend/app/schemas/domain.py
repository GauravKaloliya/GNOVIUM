import uuid

from marshmallow import Schema, fields, validate


def UUIDStr(**kwargs):
    """UUID field that validates UUID format but stores as string."""
    return fields.Str(**kwargs, validate=validate.Regexp(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', error="Not a valid UUID"))


class RegisterSchema(Schema):
    email = fields.Email(required=True)
    password = fields.Str(required=True, validate=validate.Length(min=8))
    name = fields.Str(load_default=None)


class LoginSchema(Schema):
    email = fields.Email(required=True)
    password = fields.Str(required=True)


class WorkspaceCreateSchema(Schema):
    name = fields.Str(required=True, validate=validate.Length(min=1, max=160))
    description = fields.Str(load_default=None)
    settings = fields.Dict(load_default=dict)


class WorkspaceUpdateSchema(Schema):
    name = fields.Str(validate=validate.Length(min=1, max=160))
    description = fields.Str(allow_none=True)
    settings = fields.Dict()


class EntityTypeCreateSchema(Schema):
    workspace_id = UUIDStr(required=True)
    name = fields.Str(required=True)
    icon = fields.Str(load_default=None)
    config = fields.Dict(load_default=dict)


class PropertyCreateSchema(Schema):
    workspace_id = UUIDStr(required=True)
    entity_type_id = UUIDStr(load_default=None, allow_none=True)
    name = fields.Str(required=True)
    property_type = fields.Str(required=True)
    config = fields.Dict(load_default=dict)


class EntityCreateSchema(Schema):
    workspace_id = UUIDStr(required=True)
    entity_type_id = UUIDStr(required=True)
    title = fields.Str(load_default=None)
    icon = fields.Str(load_default=None)
    cover_image = fields.Str(load_default=None)
    properties = fields.Dict(load_default=dict)


class EntityUpdateSchema(Schema):
    title = fields.Str(allow_none=True)
    icon = fields.Str(allow_none=True)
    cover_image = fields.Str(allow_none=True)
    is_archived = fields.Bool()
    properties = fields.Dict()


class BlockCreateSchema(Schema):
    entity_id = UUIDStr(required=True)
    parent_block_id = UUIDStr(load_default=None, allow_none=True)
    block_type = fields.Str(required=True)
    position = fields.Decimal(as_string=True, load_default=None, allow_none=True)
    content = fields.Dict(load_default=dict)


class BlockUpdateSchema(Schema):
    parent_block_id = UUIDStr(allow_none=True)
    block_type = fields.Str()
    position = fields.Decimal(as_string=True)
    content = fields.Dict()


class MoveBlockSchema(Schema):
    parent_block_id = UUIDStr(load_default=None, allow_none=True)
    position = fields.Decimal(as_string=True, required=True)


class RelationCreateSchema(Schema):
    workspace_id = UUIDStr(required=True)
    source_entity_id = UUIDStr(required=True)
    target_entity_id = UUIDStr(required=True)
    relation_type = fields.Str(required=True)
    metadata = fields.Dict(load_default=dict)


class BranchCreateSchema(Schema):
    workspace_id = UUIDStr(required=True)
    parent_branch_id = UUIDStr(load_default=None, allow_none=True)
    name = fields.Str(required=True)
    description = fields.Str(load_default=None)
    is_default = fields.Bool(load_default=False)


class SnapshotCreateSchema(Schema):
    branch_id = UUIDStr(required=True)
    name = fields.Str(load_default=None)
    description = fields.Str(load_default=None)


class ChangesetCreateSchema(Schema):
    branch_id = UUIDStr(required=True)
    snapshot_id = UUIDStr(load_default=None, allow_none=True)
    message = fields.Str(load_default=None)


class MergeBranchSchema(Schema):
    source_branch_id = UUIDStr(required=True)
    target_branch_id = UUIDStr(required=True)


class SearchQuerySchema(Schema):
    workspace_id = UUIDStr(required=True)
    q = fields.Str(required=True, validate=validate.Length(min=1))
    mode = fields.Str(load_default="hybrid", validate=validate.OneOf(["keyword", "full_text", "hybrid", "semantic"]))
    limit = fields.Int(load_default=20, validate=validate.Range(min=1, max=50))


class AIQuerySchema(Schema):
    workspace_id = UUIDStr(required=True)
    question = fields.Str(required=True, validate=validate.Length(min=1))
    limit = fields.Int(load_default=8, validate=validate.Range(min=1, max=20))


class FileCreateSchema(Schema):
    workspace_id = UUIDStr(required=True)
    file_name = fields.Str(required=True)
    mime_type = fields.Str(load_default=None)
    file_size = fields.Int(load_default=None, allow_none=True)
    object_key = fields.Str(required=True)
    public_url = fields.Str(load_default=None)
    storage_provider = fields.Str(load_default="aws_s3")


class NotificationCreateSchema(Schema):
    workspace_id = UUIDStr(required=True)
    user_id = UUIDStr(required=True)
    entity_id = UUIDStr(load_default=None, allow_none=True)
    type = fields.Str(required=True)
    title = fields.Str(required=True)
    message = fields.Str(load_default=None)


class JobCreateSchema(Schema):
    workspace_id = UUIDStr(load_default=None, allow_none=True)
    job_type = fields.Str(required=True)
    payload = fields.Dict(required=True)


class CommentCreateSchema(Schema):
    workspace_id = UUIDStr(required=True)
    entity_id = UUIDStr(load_default=None, allow_none=True)
    block_id = UUIDStr(load_default=None, allow_none=True)
    parent_comment_id = UUIDStr(load_default=None, allow_none=True)
    content = fields.Str(required=True, validate=validate.Length(min=1))


class CommentUpdateSchema(Schema):
    content = fields.Str(required=True, validate=validate.Length(min=1))


class SyncOperationCreateSchema(Schema):
    workspace_id = UUIDStr(required=True)
    operation_type = fields.Str(required=True)
    entity_type = fields.Str(load_default=None, allow_none=True)
    entity_id = UUIDStr(load_default=None, allow_none=True)
    payload = fields.Dict(required=True)
    device_id = fields.Str(load_default=None, allow_none=True)
    client_clock = fields.Int(load_default=None, allow_none=True)


class TagCreateSchema(Schema):
    workspace_id = UUIDStr(required=True)
    name = fields.Str(required=True)
    color = fields.Str(load_default=None, allow_none=True)


class TagUpdateSchema(Schema):
    name = fields.Str()
    color = fields.Str(allow_none=True)


class GraphMaterializationCreateSchema(Schema):
    workspace_id = UUIDStr(required=True)

