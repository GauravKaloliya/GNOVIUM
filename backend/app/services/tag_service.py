from app.extensions import db
from app.repositories.domain import EntityTagRepository, TagRepository


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

    def delete(self, tag_id):
        tag = TagRepository().get(tag_id)
        TagRepository().soft_delete(tag)
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
