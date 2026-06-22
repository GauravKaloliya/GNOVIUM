from flask import Blueprint, request

from app.api.v1.helpers import raw_response
from app.core.validation import load_schema
from app.schemas.domain import SearchQuerySchema
from app.services.search_service import SearchService
from app.services.security import secured

bp = Blueprint("search", __name__)


@bp.get("/")
@secured
def search():
    data = load_schema(SearchQuerySchema(), request.args)
    return raw_response(SearchService().search(data["workspace_id"], data["q"], data["mode"], data["limit"]))
