from flask import Blueprint

from app.ai.service import AIService
from app.api.v1.helpers import raw_response, request_json
from app.core.validation import load_schema
from app.schemas.domain import AIQuerySchema
from app.services.security import secured

bp = Blueprint("ai", __name__)


@bp.post("/query")
@secured
def query():
    data = load_schema(AIQuerySchema(), request_json())
    return raw_response(AIService().answer(data["workspace_id"], data["question"], data["limit"]))
