from app.extensions import db
from app.repositories import EntityTagRepository, TagRepository


class TagService:
    def create(self, data):
        tag = TagRepository().create(data)
        db.session.commit()
        return tag

    def update(self, tag_id, data):
        repo = TagRepository()
        tag = repo.get(tag_id)
        repo.update(tag, data)
        db.session.commit()
        return tag

    def delete(self, tag_id, user_id=None):
        tag = TagRepository().get(tag_id)
        TagRepository().soft_delete(tag, deleted_by=user_id)
        db.session.commit()
        return tag

    def restore(self, tag_id):
        tag = TagRepository().get(tag_id, include_deleted=True)
        tag.is_deleted = False
        tag.deleted_at = None
        tag.deleted_by = None
        db.session.commit()
        return tag

    def tag_entity(self, entity_id, tag_id):
        link = EntityTagRepository().create({"entity_id": entity_id, "tag_id": tag_id})
        db.session.commit()
        return link

    def untag_entity(self, entity_id, tag_id):
        repo = EntityTagRepository()
        link = repo.query().filter_by(entity_id=entity_id, tag_id=tag_id).first()
        if link:
            repo.soft_delete(link)
            db.session.commit()
        return {"removed": True}
