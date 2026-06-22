"""Full integration test using Flask test client - tests all API routes end to end."""
import uuid

from app import create_app
from app.core.config import TestingConfig


def _auth_headers(client):
    """Register + login and return auth headers + refresh token."""
    email = f"test_{uuid.uuid4().hex[:8]}@test.dev"
    resp = client.post("/api/v1/auth/register", json={"email": email, "password": "TestPass123!", "name": "Tester"})
    assert resp.status_code == 201
    resp = client.post("/api/v1/auth/login", json={"email": email, "password": "TestPass123!"})
    assert resp.status_code == 200
    data = resp.get_json()["data"]
    return {
        "Authorization": f"Bearer {data['access_token']}",
        "X-Refresh-Token": data["refresh_token"],
    }


def test_full_api_flow():
    app = create_app(TestingConfig)
    with app.app_context():
        from app.extensions import db
        db.create_all()

    client = app.test_client()

    # Health
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.get_json()["data"]["status"] == "healthy"

    headers = _auth_headers(client)

    # Create workspace
    resp = client.post("/api/v1/workspaces/", headers=headers, json={"name": "Test WS", "description": "desc"})
    assert resp.status_code == 201
    ws = resp.get_json()["data"]
    workspace_id = ws["id"]

    resp = client.get("/api/v1/workspaces/", headers=headers)
    assert resp.status_code == 200

    resp = client.get(f"/api/v1/workspaces/{workspace_id}", headers=headers)
    assert resp.status_code == 200

    resp = client.patch(f"/api/v1/workspaces/{workspace_id}", headers=headers, json={"name": "Updated WS"})
    assert resp.status_code == 200

    resp = client.get(f"/api/v1/workspaces/{workspace_id}/stats", headers=headers)
    assert resp.status_code == 200

    # Entity types
    resp = client.post("/api/v1/entities/types", headers=headers, json={"workspace_id": workspace_id, "name": "Doc", "icon": "📄"})
    assert resp.status_code == 201
    entity_type_id = resp.get_json()["data"]["id"]

    resp = client.get(f"/api/v1/entities/types?workspace_id={workspace_id}", headers=headers)
    assert resp.status_code == 200

    # Properties
    resp = client.post("/api/v1/entities/properties", headers=headers, json={
        "workspace_id": workspace_id, "entity_type_id": entity_type_id, "name": "Status", "property_type": "select",
    })
    assert resp.status_code == 201

    resp = client.get(f"/api/v1/entities/properties?workspace_id={workspace_id}", headers=headers)
    assert resp.status_code == 200

    # Entities
    resp = client.post("/api/v1/entities/", headers=headers, json={
        "workspace_id": workspace_id, "entity_type_id": entity_type_id, "title": "My Page", "icon": "🚀",
    })
    assert resp.status_code == 201
    entity_id = resp.get_json()["data"]["id"]

    resp = client.get(f"/api/v1/entities/", headers=headers)
    assert resp.status_code == 200

    resp = client.get(f"/api/v1/entities/{entity_id}", headers=headers)
    assert resp.status_code == 200

    resp = client.patch(f"/api/v1/entities/{entity_id}", headers=headers, json={"title": "Updated Page"})
    assert resp.status_code == 200

    resp = client.post(f"/api/v1/entities/{entity_id}/archive", headers=headers)
    assert resp.status_code == 200

    resp = client.post(f"/api/v1/entities/{entity_id}/restore", headers=headers)
    assert resp.status_code == 200

    resp = client.post(f"/api/v1/entities/{entity_id}/duplicate", headers=headers)
    assert resp.status_code == 201
    entity2_id = resp.get_json()["data"]["id"]

    # Children
    resp = client.get(f"/api/v1/entities/{entity_id}/children", headers=headers)
    assert resp.status_code == 200

    # Versions history
    resp = client.get(f"/api/v1/entities/{entity_id}/versions", headers=headers)
    assert resp.status_code == 200

    # Blocks
    resp = client.post("/api/v1/blocks/", headers=headers, json={
        "entity_id": entity_id, "block_type": "text", "content": {"text": "Hello"},
    })
    assert resp.status_code == 201
    block_id = resp.get_json()["data"]["id"]

    resp = client.get(f"/api/v1/blocks/{block_id}", headers=headers)
    assert resp.status_code == 200

    resp = client.patch(f"/api/v1/blocks/{block_id}", headers=headers, json={"content": {"text": "Updated"}})
    assert resp.status_code == 200

    resp = client.get(f"/api/v1/blocks/entity/{entity_id}", headers=headers)
    assert resp.status_code == 200

    resp = client.post("/api/v1/blocks/reorder", headers=headers, json={
        "entity_id": entity_id, "blocks": [{"id": block_id, "position": 500}],
    })
    assert resp.status_code == 200

    resp = client.delete(f"/api/v1/blocks/{block_id}", headers=headers)
    assert resp.status_code == 200

    # Relations
    resp = client.post("/api/v1/relations/", headers=headers, json={
        "workspace_id": workspace_id, "source_entity_id": entity_id, "target_entity_id": entity2_id, "relation_type": "ref",
    })
    assert resp.status_code == 201
    relation_id = resp.get_json()["data"]["id"]

    resp = client.get("/api/v1/relations/", headers=headers)
    assert resp.status_code == 200

    resp = client.get(f"/api/v1/relations/{relation_id}", headers=headers)
    assert resp.status_code == 200

    resp = client.get(f"/api/v1/relations/entity/{entity_id}", headers=headers)
    assert resp.status_code == 200

    resp = client.get(f"/api/v1/relations/backlinks/{entity2_id}", headers=headers)
    assert resp.status_code == 200

    resp = client.delete(f"/api/v1/relations/{relation_id}", headers=headers)
    assert resp.status_code == 200

    # Tags
    resp = client.post("/api/v1/tags/", headers=headers, json={"workspace_id": workspace_id, "name": "important", "color": "red"})
    assert resp.status_code == 201
    tag_id = resp.get_json()["data"]["id"]

    resp = client.get(f"/api/v1/tags/", headers=headers)
    assert resp.status_code == 200

    resp = client.get(f"/api/v1/tags/{tag_id}", headers=headers)
    assert resp.status_code == 200

    resp = client.patch(f"/api/v1/tags/{tag_id}", headers=headers, json={"color": "blue"})
    assert resp.status_code == 200

    resp = client.post(f"/api/v1/tags/{tag_id}/entities/{entity_id}", headers=headers)
    assert resp.status_code == 201

    resp = client.delete(f"/api/v1/tags/{tag_id}/entities/{entity_id}", headers=headers)
    assert resp.status_code == 200

    resp = client.delete(f"/api/v1/tags/{tag_id}", headers=headers)
    assert resp.status_code == 200

    # Branches
    resp = client.post("/api/v1/branches/", headers=headers, json={
        "workspace_id": workspace_id, "name": "main", "is_default": True,
    })
    assert resp.status_code == 201
    branch_id = resp.get_json()["data"]["id"]

    resp = client.post("/api/v1/branches/", headers=headers, json={
        "workspace_id": workspace_id, "name": "feature", "is_default": False,
    })
    assert resp.status_code == 201
    branch2_id = resp.get_json()["data"]["id"]

    resp = client.get(f"/api/v1/branches/", headers=headers)
    assert resp.status_code == 200

    resp = client.get(f"/api/v1/branches/{branch_id}", headers=headers)
    assert resp.status_code == 200

    resp = client.post(f"/api/v1/branches/{branch_id}/merge", headers=headers, json={"target_branch_id": branch2_id})
    assert resp.status_code == 201

    resp = client.delete(f"/api/v1/branches/{branch_id}", headers=headers)
    assert resp.status_code == 200

    # Diffs (before deleting branches)
    resp = client.post("/api/v1/diffs/compare", headers=headers, json={
        "left_branch_id": branch_id, "right_branch_id": branch2_id,
    })
    assert resp.status_code == 200

    # Governance
    resp = client.get(f"/api/v1/governance/health?workspace_id={workspace_id}", headers=headers)
    assert resp.status_code == 200

    resp = client.get(f"/api/v1/governance/duplicates?workspace_id={workspace_id}", headers=headers)
    assert resp.status_code == 200

    resp = client.get(f"/api/v1/governance/orphans?workspace_id={workspace_id}", headers=headers)
    assert resp.status_code == 200

    resp = client.get(f"/api/v1/governance/stale?workspace_id={workspace_id}", headers=headers)
    assert resp.status_code == 200

    # Dashboard
    resp = client.get(f"/api/v1/dashboard/overview?workspace_id={workspace_id}", headers=headers)
    assert resp.status_code == 200

    # Backups
    resp = client.post("/api/v1/backups/export", headers=headers, json={"workspace_id": workspace_id})
    assert resp.status_code == 200

    resp = client.post("/api/v1/backups/import", headers=headers, json={"workspace_id": workspace_id})
    assert resp.status_code == 201

    # Soft delete entity
    resp = client.delete(f"/api/v1/entities/{entity_id}", headers=headers)
    assert resp.status_code == 200

    resp = client.post(f"/api/v1/entities/{entity_id}/restore", headers=headers)
    assert resp.status_code == 200

    # Delete workspace
    resp = client.delete(f"/api/v1/workspaces/{workspace_id}", headers=headers)
    assert resp.status_code == 200

    # Auth me
    resp = client.get("/api/v1/auth/me", headers=headers)
    assert resp.status_code == 200

    resp = client.patch("/api/v1/auth/me", headers=headers, json={"name": "Updated Name"})
    assert resp.status_code == 200

    # Logout
    resp = client.post("/api/v1/auth/refresh", headers={"Authorization": f"Bearer {headers['X-Refresh-Token']}"})
    assert resp.status_code == 200
