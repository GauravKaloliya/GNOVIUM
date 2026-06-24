from app.extensions import db
from app.repositories import CommentRepository


class CommentService:
    def create(self, data, user_id):
        comment = CommentRepository().create({**data, "author_id": user_id})
        db.session.commit()
        return comment

    def update(self, comment_id, data, user_id):
        repo = CommentRepository()
        comment = repo.get(comment_id)
        repo.update(comment, {"content": data["content"]})
        db.session.commit()
        return comment

    def delete(self, comment_id, user_id):
        repo = CommentRepository()
        comment = repo.get(comment_id)
        repo.soft_delete(comment, deleted_by=user_id)
        db.session.commit()
        return comment

    def restore(self, comment_id):
        repo = CommentRepository()
        comment = repo.get(comment_id, include_deleted=True)
        comment.is_deleted = False
        comment.deleted_at = None
        comment.deleted_by = None
        db.session.commit()
        return comment
