import hashlib
import os
import uuid
from datetime import datetime

from flask import current_app

from app.extensions import db
from app.repositories import EntityFileRepository, FileRepository


class FileService:
    ALLOWED_EXTENSIONS = {
        "jpg", "jpeg", "png", "gif", "webp", "svg", "bmp",
        "pdf", "doc", "docx", "xls", "xlsx", "csv",
        "txt", "md", "json", "xml", "yaml", "yml",
        "mp4", "mov", "avi", "webm",
        "mp3", "wav", "ogg", "flac",
        "zip", "tar", "gz", "7z", "rar",
    }
    ALLOWED_MIMETYPES = {
        "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml",
        "application/pdf", "text/plain", "text/markdown",
        "application/json", "application/zip", "application/gzip",
        "video/mp4", "audio/mpeg",
    }

    def create_metadata(self, data, user_id):
        provider = "aws_s3" if current_app.config.get("GNOVIUM_MODE") == "cloud" else "local"
        file = FileRepository().create({**data, "storage_provider": provider, "uploaded_by": user_id})
        db.session.commit()
        return file

    def _validate_file(self, file_obj):
        ext = file_obj.filename.rsplit(".", 1)[-1].lower() if "." in file_obj.filename else ""
        if ext and ext not in self.ALLOWED_EXTENSIONS:
            raise ValueError(f"File extension '.{ext}' is not allowed")
        if file_obj.content_type and file_obj.content_type not in self.ALLOWED_MIMETYPES:
            raise ValueError(f"MIME type '{file_obj.content_type}' is not allowed")
        return ext

    def _compute_hash(self, data):
        return hashlib.sha256(data).hexdigest()

    def _check_quota(self, workspace_id, additional_bytes):
        max_bytes = current_app.config.get("LOCAL_STORAGE_QUOTA", 500 * 1024 * 1024)  # 500MB default
        from app.models import File
        used = db.session.query(db.func.coalesce(db.func.sum(File.file_size), 0)).filter(
            File.workspace_id == workspace_id,
            File.is_deleted.is_(False),
        ).scalar()
        if used + additional_bytes > max_bytes:
            raise ValueError(f"Storage quota exceeded ({used + additional_bytes} > {max_bytes})")

    def upload(self, file_obj, workspace_id, user_id):
        ext = self._validate_file(file_obj)

        file_obj.seek(0)
        file_bytes = file_obj.read()
        content_hash = self._compute_hash(file_bytes)
        file_size = len(file_bytes)

        self._check_quota(workspace_id, file_size)

        existing = FileRepository().find_by_hash(content_hash, workspace_id)
        if existing:
            return {
                "id": str(existing.id),
                "file_name": existing.file_name,
                "mime_type": existing.mime_type,
                "file_size": existing.file_size,
                "public_url": existing.public_url,
                "object_key": existing.object_key,
                "deduplicated": True,
            }

        object_key = f"workspaces/{workspace_id}/{uuid.uuid4()}.{ext}" if ext else f"workspaces/{workspace_id}/{uuid.uuid4()}"
        bucket = current_app.config.get("S3_BUCKET")
        public_url = None

        if bucket:
            import boto3
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
            with open(local_path, "wb") as f:
                f.write(file_bytes)
            public_url = f"/uploads/{object_key.replace('/', '_')}"
            provider = "local"

        file_record = FileRepository().create({
            "workspace_id": workspace_id,
            "file_name": file_obj.filename,
            "mime_type": file_obj.content_type or "application/octet-stream",
            "file_size": file_size,
            "content_hash": content_hash,
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
            "deduplicated": False,
        }

    def link_entity(self, entity_id, file_id, block_id=None):
        link = EntityFileRepository().create({"entity_id": entity_id, "file_id": file_id, "block_id": block_id})
        db.session.commit()
        return link

    def presign_upload(self, object_key, content_type=None, expires_in=900):
        bucket = current_app.config["S3_BUCKET"]
        if not bucket:
            return {"enabled": False, "message": "S3_BUCKET is not configured"}
        import boto3
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
