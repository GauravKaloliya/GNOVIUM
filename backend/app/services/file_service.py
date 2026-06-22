import os
import uuid
from datetime import datetime

import boto3
from flask import current_app

from app.extensions import db
from app.repositories.domain import EntityFileRepository, FileRepository


class FileService:
    def create_metadata(self, data, user_id):
        file = FileRepository().create({**data, "uploaded_by": user_id})
        db.session.commit()
        return file

    def upload(self, file_obj, workspace_id, user_id):
        ext = file_obj.filename.rsplit(".", 1)[-1] if "." in file_obj.filename else ""
        object_key = f"workspaces/{workspace_id}/{uuid.uuid4()}.{ext}" if ext else f"workspaces/{workspace_id}/{uuid.uuid4()}"
        bucket = current_app.config.get("S3_BUCKET")
        public_url = None

        if bucket:
            client = boto3.client(
                "s3",
                region_name=current_app.config.get("AWS_REGION", "us-east-1"),
                aws_access_key_id=current_app.config.get("AWS_ACCESS_KEY_ID") or None,
                aws_secret_access_key=current_app.config.get("AWS_SECRET_ACCESS_KEY") or None,
            )
            client.upload_fileobj(file_obj, bucket, object_key)
            public_url = f"{current_app.config.get('S3_PUBLIC_BASE_URL', '')}/{object_key}"
            provider = "aws_s3"
        else:
            local_dir = os.path.join(current_app.instance_path, "uploads")
            os.makedirs(local_dir, exist_ok=True)
            local_path = os.path.join(local_dir, object_key.replace("/", "_"))
            file_obj.save(local_path)
            public_url = f"/uploads/{object_key.replace('/', '_')}"
            provider = "local"

        file_record = FileRepository().create({
            "workspace_id": workspace_id,
            "file_name": file_obj.filename,
            "mime_type": file_obj.content_type or "application/octet-stream",
            "file_size": file_obj.content_length or 0,
            "storage_provider": provider,
            "object_key": object_key,
            "public_url": public_url,
            "uploaded_by": user_id,
        })
        db.session.commit()
        return {
            "id": str(file_record.id),
            "file_name": file_record.file_name,
            "mime_type": file_record.mime_type,
            "file_size": file_record.file_size,
            "public_url": public_url,
            "object_key": object_key,
        }

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
