from flask import Blueprint, request

from app.api.v1.helpers import item_response, list_response, pagination_args, request_json
from app.core.validation import load_schema
from app.repositories.domain import JobRepository
from app.schemas.domain import JobCreateSchema
from app.services.job_service import JobService
from app.services.security import current_user_id, secured

bp = Blueprint("jobs", __name__)


@bp.get("/")
@secured
def list_jobs():
    args = pagination_args()
    return list_response(JobRepository().list({"workspace_id": request.args.get("workspace_id")}, args["page"], args["per_page"]))


@bp.post("/")
@secured
def create_job():
    return item_response(JobService().create(load_schema(JobCreateSchema(), request_json()), current_user_id()), 201)


@bp.post("/<uuid:job_id>/running")
@secured
def mark_running(job_id):
    return item_response(JobService().mark_running(job_id))


@bp.post("/<uuid:job_id>/completed")
@secured
def mark_completed(job_id):
    return item_response(JobService().mark_completed(job_id, request_json().get("result", {})))
