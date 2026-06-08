from flask import jsonify


def ok(data=None, meta=None, status=200):
    payload = {"data": data if data is not None else {}}
    if meta:
        payload["meta"] = meta
    return jsonify(payload), status


def created(data=None, meta=None):
    return ok(data=data, meta=meta, status=201)


def error(message, code="bad_request", status=400, details=None):
    payload = {"error": {"code": code, "message": message}}
    if details:
        payload["error"]["details"] = details
    return jsonify(payload), status
