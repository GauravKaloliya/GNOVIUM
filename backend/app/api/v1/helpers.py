from flask import request

from app.core.response import ok
from app.core.serialization import model_to_dict, to_json
from app.schemas.common import PaginationSchema


def request_json():
    return request.get_json(silent=True) or {}


def pagination_args():
    return PaginationSchema().load(request.args)


def list_response(page):
    return ok(
        [model_to_dict(item) for item in page.items],
        {
            "page": page.page,
            "per_page": page.per_page,
            "total": page.total,
            "pages": page.pages,
        },
    )


def item_response(item, status=200):
    return ok(model_to_dict(item), status=status)


def raw_response(data, status=200):
    return ok(to_json(data), status=status)
