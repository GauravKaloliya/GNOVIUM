import boto3
from flask import current_app

from app.extensions import db
from app.repositories.domain import EntityFileRepository, FileRepository


class FileService:
    def create_metadata(self, data, user_id):
        file = FileRepository().create({**data, "uploaded_by": user_id})
        db.session.commit()
        return file

    def link_entity(self, entity_id, file_id, block_id=None):
        link = EntityFileRepository().create({"entity_id": entity_id, "file_id": file_id, "block_id": block_id})
        db.session.commit()
        return link

    def presign_upload(self, object_key, content_type=None, expires_in=900):
        bucket = current_app.config["S3_BUCKET"]
        if not bucket:
            return {"enabled": False, "message": "S3_BUCKET is not configured"}
        client = boto3.client(
            "s3",
            region_name=current_app.config["AWS_REGION"],
            aws_access_key_id=current_app.config["AWS_ACCESS_KEY_ID"] or None,
            aws_secret_access_key=current_app.config["AWS_SECRET_ACCESS_KEY"] or None,
        )
        return {
            "enabled": True,
            "upload_url": client.generate_presigned_url(
                "put_object",
                Params={"Bucket": bucket, "Key": object_key, "ContentType": content_type or "application/octet-stream"},
                ExpiresIn=expires_in,
            ),
            "object_key": object_key,
        }
