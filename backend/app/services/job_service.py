from datetime import datetime, timezone

from app.extensions import db
from app.repositories.domain import JobRepository


class JobService:
    def create(self, data, user_id):
        job = JobRepository().create({**data, "created_by": user_id})
        db.session.commit()
        return job

    def mark_running(self, job_id):
        job = JobRepository().get(job_id)
        job.status = "running"
        job.started_at = datetime.now(timezone.utc)
        db.session.commit()
        return job

    def mark_completed(self, job_id, result):
        job = JobRepository().get(job_id)
        job.status = "completed"
        job.result = result
        job.completed_at = datetime.now(timezone.utc)
        db.session.commit()
        return job
