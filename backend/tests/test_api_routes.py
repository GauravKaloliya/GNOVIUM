#!/usr/bin/env python3
"""
Gnovium API Integration Test Suite
Tests all non-AI routes with real HTTP requests against the running server.
Run with: python3 tests/test_api_routes.py
All responses are wrapped: {"data": {...}} or {"data": [...]}
"""

import sys
import uuid
import requests

BASE = "http://localhost:5000/api/v1"
PASS = "\033[92m✓\033[0m"
FAIL = "\033[91m✗\033[0m"

results = {"pass": 0, "fail": 0}
state = {}  # shared state between tests


def jdata(resp):
    """Extract the 'data' key from the response body."""
    try:
        body = resp.json()
        return body.get("data", body)
    except Exception:
        return {}


def assert_status(label, resp, expected):
    if resp.status_code == expected:
        print(f"  {PASS} [{resp.status_code}] {label}")
        results["pass"] += 1
        return True
    else:
        body = resp.text[:500]
        print(f"  {FAIL} [{resp.status_code}] {label}")
        print(f"       Expected {expected} | Body: {body}")
        results["fail"] += 1
        return False


def section(name):
    print(f"\n{'='*60}")
    print(f"  {name}")
    print(f"{'='*60}")


def auth_headers():
    return {"Authorization": f"Bearer {state.get('access_token', '')}"}


# ─── HEALTH ──────────────────────────────────────────────────────────────────
section("HEALTH")
r = requests.get("http://localhost:5000/health")
assert_status("GET /health", r, 200)

# ─── AUTH ────────────────────────────────────────────────────────────────────
section("AUTH")

EMAIL = f"test_{uuid.uuid4().hex[:8]}@gnovium.dev"
PASSWORD = "SecurePass123!"

r = requests.post(f"{BASE}/auth/register", json={"email": EMAIL, "password": PASSWORD, "name": "Test User"})
if assert_status("POST /auth/register", r, 201):
    state["user_id"] = jdata(r).get("id")

r = requests.post(f"{BASE}/auth/login", json={"email": EMAIL, "password": PASSWORD})
if assert_status("POST /auth/login", r, 200):
    d = jdata(r)
    state["access_token"] = d.get("access_token")
    state["refresh_token"] = d.get("refresh_token")

# duplicate register → 409
r = requests.post(f"{BASE}/auth/register", json={"email": EMAIL, "password": PASSWORD})
assert_status("POST /auth/register (duplicate → 409)", r, 409)

# login wrong password → 403
r = requests.post(f"{BASE}/auth/login", json={"email": EMAIL, "password": "WrongPass!"})
assert_status("POST /auth/login (wrong password → 403)", r, 403)

# refresh token
if state.get("refresh_token"):
    r = requests.post(
        f"{BASE}/auth/refresh",
        headers={"Authorization": f"Bearer {state['refresh_token']}"},
    )
    if assert_status("POST /auth/refresh", r, 200):
        new_token = jdata(r).get("access_token")
        if new_token:
            state["access_token"] = new_token

print(f"  [info] access_token obtained: {'yes' if state.get('access_token') else 'NO'}")

# ─── WORKSPACES ──────────────────────────────────────────────────────────────
section("WORKSPACES")

r = requests.get(f"{BASE}/workspaces/", headers=auth_headers())
assert_status("GET /workspaces/", r, 200)

r = requests.post(
    f"{BASE}/workspaces/",
    headers=auth_headers(),
    json={"name": "My Test Workspace", "description": "Created by integration test"},
)
if assert_status("POST /workspaces/", r, 201):
    state["workspace_id"] = jdata(r).get("id")

if state.get("workspace_id"):
    wid = state["workspace_id"]

    r = requests.get(f"{BASE}/workspaces/{wid}", headers=auth_headers())
    assert_status("GET /workspaces/<id>", r, 200)

    r = requests.patch(
        f"{BASE}/workspaces/{wid}",
        headers=auth_headers(),
        json={"name": "Updated Workspace Name"},
    )
    assert_status("PATCH /workspaces/<id>", r, 200)

# ─── ENTITY TYPES ────────────────────────────────────────────────────────────
section("ENTITY TYPES")

if state.get("workspace_id"):
    r = requests.post(
        f"{BASE}/entities/types",
        headers=auth_headers(),
        json={"workspace_id": state["workspace_id"], "name": "Document", "icon": "📄", "config": {}},
    )
    if assert_status("POST /entities/types", r, 201):
        state["entity_type_id"] = jdata(r).get("id")

    r = requests.get(
        f"{BASE}/entities/types",
        headers=auth_headers(),
        params={"workspace_id": state["workspace_id"]},
    )
    assert_status("GET /entities/types", r, 200)

# ─── PROPERTIES ──────────────────────────────────────────────────────────────
section("PROPERTIES")

if state.get("workspace_id") and state.get("entity_type_id"):
    r = requests.post(
        f"{BASE}/entities/properties",
        headers=auth_headers(),
        json={
            "workspace_id": state["workspace_id"],
            "entity_type_id": state["entity_type_id"],
            "name": "Status",
            "property_type": "select",
            "config": {"options": ["draft", "published"]},
        },
    )
    if assert_status("POST /entities/properties", r, 201):
        state["property_id"] = jdata(r).get("id")

    r = requests.get(
        f"{BASE}/entities/properties",
        headers=auth_headers(),
        params={"workspace_id": state["workspace_id"]},
    )
    assert_status("GET /entities/properties", r, 200)

# ─── ENTITIES ────────────────────────────────────────────────────────────────
section("ENTITIES")

if state.get("workspace_id") and state.get("entity_type_id"):
    r = requests.post(
        f"{BASE}/entities/",
        headers=auth_headers(),
        json={
            "workspace_id": state["workspace_id"],
            "entity_type_id": state["entity_type_id"],
            "title": "Getting Started Guide",
            "icon": "🚀",
        },
    )
    if assert_status("POST /entities/", r, 201):
        state["entity_id"] = jdata(r).get("id")

    r = requests.get(
        f"{BASE}/entities/",
        headers=auth_headers(),
        params={"workspace_id": state["workspace_id"]},
    )
    assert_status("GET /entities/", r, 200)

if state.get("entity_id"):
    eid = state["entity_id"]

    r = requests.get(f"{BASE}/entities/{eid}", headers=auth_headers())
    assert_status("GET /entities/<id>", r, 200)

    r = requests.patch(
        f"{BASE}/entities/{eid}",
        headers=auth_headers(),
        json={"title": "Updated Guide Title"},
    )
    assert_status("PATCH /entities/<id>", r, 200)

    r = requests.post(f"{BASE}/entities/{eid}/archive", headers=auth_headers())
    assert_status("POST /entities/<id>/archive", r, 200)

    r = requests.post(f"{BASE}/entities/{eid}/restore", headers=auth_headers())
    assert_status("POST /entities/<id>/restore", r, 200)

    r = requests.post(f"{BASE}/entities/{eid}/duplicate", headers=auth_headers())
    if assert_status("POST /entities/<id>/duplicate", r, 201):
        state["entity2_id"] = jdata(r).get("id")

# ─── BLOCKS ──────────────────────────────────────────────────────────────────
section("BLOCKS")

if state.get("entity_id"):
    r = requests.post(
        f"{BASE}/blocks/",
        headers=auth_headers(),
        json={
            "entity_id": state["entity_id"],
            "block_type": "paragraph",
            "content": {"text": "Hello, Gnovium!"},
        },
    )
    if assert_status("POST /blocks/", r, 201):
        state["block_id"] = jdata(r).get("id")

    r = requests.get(
        f"{BASE}/blocks/",
        headers=auth_headers(),
        params={"entity_id": state["entity_id"]},
    )
    assert_status("GET /blocks/", r, 200)

if state.get("block_id"):
    bid = state["block_id"]

    r = requests.patch(
        f"{BASE}/blocks/{bid}",
        headers=auth_headers(),
        json={"content": {"text": "Updated block content"}},
    )
    assert_status("PATCH /blocks/<id>", r, 200)

    r = requests.post(
        f"{BASE}/blocks/{bid}/move",
        headers=auth_headers(),
        json={"position": "2000.0"},
    )
    assert_status("POST /blocks/<id>/move", r, 200)

    r = requests.delete(f"{BASE}/blocks/{bid}", headers=auth_headers())
    assert_status("DELETE /blocks/<id>", r, 200)

# ─── RELATIONS ───────────────────────────────────────────────────────────────
section("RELATIONS")

if state.get("workspace_id") and state.get("entity_id") and state.get("entity2_id"):
    r = requests.post(
        f"{BASE}/relations/",
        headers=auth_headers(),
        json={
            "workspace_id": state["workspace_id"],
            "source_entity_id": state["entity_id"],
            "target_entity_id": state["entity2_id"],
            "relation_type": "references",
        },
    )
    if assert_status("POST /relations/", r, 201):
        state["relation_id"] = jdata(r).get("id")

    r = requests.get(f"{BASE}/relations/", headers=auth_headers())
    assert_status("GET /relations/", r, 200)

if state.get("relation_id"):
    rid = state["relation_id"]
    r = requests.get(f"{BASE}/relations/{rid}", headers=auth_headers())
    assert_status("GET /relations/<id>", r, 200)

    # backlinks & neighbors
    if state.get("entity_id"):
        r = requests.get(f"{BASE}/relations/backlinks/{state['entity2_id']}", headers=auth_headers())
        assert_status("GET /relations/backlinks/<entity_id>", r, 200)

        r = requests.get(f"{BASE}/relations/neighbors/{state['entity_id']}", headers=auth_headers())
        assert_status("GET /relations/neighbors/<entity_id>", r, 200)

    r = requests.delete(f"{BASE}/relations/{rid}", headers=auth_headers())
    assert_status("DELETE /relations/<id>", r, 200)

# ─── BRANCHES ────────────────────────────────────────────────────────────────
section("BRANCHES")

if state.get("workspace_id"):
    r = requests.post(
        f"{BASE}/branches/",
        headers=auth_headers(),
        json={
            "workspace_id": state["workspace_id"],
            "name": "feature/new-docs",
            "description": "Test branch",
            "is_default": False,
        },
    )
    if assert_status("POST /branches/", r, 201):
        state["branch_id"] = jdata(r).get("id")

    r = requests.post(
        f"{BASE}/branches/",
        headers=auth_headers(),
        json={
            "workspace_id": state["workspace_id"],
            "name": "main",
            "description": "Default branch",
            "is_default": True,
        },
    )
    if r.status_code == 201:
        state["branch2_id"] = jdata(r).get("id")

    r = requests.get(f"{BASE}/branches/", headers=auth_headers())
    assert_status("GET /branches/", r, 200)

if state.get("branch_id"):
    bid = state["branch_id"]
    r = requests.get(f"{BASE}/branches/{bid}", headers=auth_headers())
    assert_status("GET /branches/<id>", r, 200)

    # merge two branches
    if state.get("branch2_id"):
        r = requests.post(
            f"{BASE}/branches/merge",
            headers=auth_headers(),
            json={
                "source_branch_id": state["branch_id"],
                "target_branch_id": state["branch2_id"],
            },
        )
        assert_status("POST /branches/merge", r, 201)

# ─── VERSIONS / SNAPSHOTS / CHANGESETS ──────────────────────────────────────
section("VERSIONS (snapshots / changesets)")

if state.get("branch_id"):
    r = requests.post(
        f"{BASE}/versions/snapshots",
        headers=auth_headers(),
        json={
            "branch_id": state["branch_id"],
            "name": "v1.0 snapshot",
            "description": "First snapshot",
        },
    )
    if assert_status("POST /versions/snapshots", r, 201):
        state["snapshot_id"] = jdata(r).get("id")

    r = requests.post(
        f"{BASE}/versions/changesets",
        headers=auth_headers(),
        json={
            "branch_id": state["branch_id"],
            "message": "Initial commit",
        },
    )
    if assert_status("POST /versions/changesets", r, 201):
        state["changeset_id"] = jdata(r).get("id")

    r = requests.get(f"{BASE}/versions/snapshots", headers=auth_headers())
    assert_status("GET /versions/snapshots", r, 200)

    r = requests.get(f"{BASE}/versions/changesets", headers=auth_headers())
    assert_status("GET /versions/changesets", r, 200)

    # Snapshot entity version
    if state.get("entity_id"):
        r = requests.post(
            f"{BASE}/versions/entities/{state['entity_id']}/snapshot",
            headers=auth_headers(),
            json={"changeset_id": state.get("changeset_id")},
        )
        if assert_status("POST /versions/entities/<id>/snapshot", r, 201):
            state["entity_version_id"] = jdata(r).get("id")

# ─── SEARCH ──────────────────────────────────────────────────────────────────
section("SEARCH")

if state.get("workspace_id"):
    r = requests.get(
        f"{BASE}/search/",
        headers=auth_headers(),
        params={"workspace_id": state["workspace_id"], "q": "guide", "mode": "keyword"},
    )
    assert_status("GET /search/ (keyword)", r, 200)

    r = requests.get(
        f"{BASE}/search/",
        headers=auth_headers(),
        params={"workspace_id": state["workspace_id"], "q": "guide", "mode": "hybrid"},
    )
    assert_status("GET /search/ (hybrid)", r, 200)

# ─── FILES ───────────────────────────────────────────────────────────────────
section("FILES")

if state.get("workspace_id"):
    r = requests.post(
        f"{BASE}/files/",
        headers=auth_headers(),
        json={
            "workspace_id": state["workspace_id"],
            "file_name": "test-document.pdf",
            "mime_type": "application/pdf",
            "file_size": 204800,
            "object_key": f"uploads/{uuid.uuid4().hex}/test-document.pdf",
            "storage_provider": "aws_s3",
        },
    )
    if assert_status("POST /files/", r, 201):
        state["file_id"] = jdata(r).get("id")

    r = requests.get(f"{BASE}/files/", headers=auth_headers())
    assert_status("GET /files/", r, 200)

if state.get("file_id"):
    fid = state["file_id"]
    r = requests.get(f"{BASE}/files/{fid}", headers=auth_headers())
    assert_status("GET /files/<id>", r, 200)

    # presign (cloud-only — returns 404 in local mode)
    r = requests.post(
        f"{BASE}/files/presign",
        headers=auth_headers(),
        json={"object_key": "uploads/test/file.pdf", "content_type": "application/pdf"},
    )
    assert_status("POST /files/presign", r, 404)

    # link file to entity
    if state.get("entity_id"):
        r = requests.post(
            f"{BASE}/files/{fid}/entities/{state['entity_id']}",
            headers=auth_headers(),
            json={},
        )
        assert_status("POST /files/<id>/entities/<entity_id>", r, 201)

    r = requests.delete(f"{BASE}/files/{fid}", headers=auth_headers())
    assert_status("DELETE /files/<id>", r, 200)

# ─── NOTIFICATIONS ───────────────────────────────────────────────────────────
section("NOTIFICATIONS")

if state.get("workspace_id") and state.get("user_id"):
    r = requests.post(
        f"{BASE}/notifications/",
        headers=auth_headers(),
        json={
            "workspace_id": state["workspace_id"],
            "user_id": state["user_id"],
            "type": "mention",
            "title": "You were mentioned",
            "message": "Check this out",
        },
    )
    if assert_status("POST /notifications/", r, 201):
        state["notification_id"] = jdata(r).get("id")

    r = requests.get(f"{BASE}/notifications/", headers=auth_headers())
    assert_status("GET /notifications/", r, 200)

if state.get("notification_id"):
    nid = state["notification_id"]
    r = requests.post(f"{BASE}/notifications/{nid}/read", headers=auth_headers())
    assert_status("POST /notifications/<id>/read", r, 200)

# ─── JOBS ────────────────────────────────────────────────────────────────────
section("JOBS")

r = requests.post(
    f"{BASE}/jobs/",
    headers=auth_headers(),
    json={
        "job_type": "export",
        "payload": {"format": "json", "include_archived": False},
    },
)
if assert_status("POST /jobs/", r, 201):
    state["job_id"] = jdata(r).get("id")

r = requests.get(f"{BASE}/jobs/", headers=auth_headers())
assert_status("GET /jobs/", r, 200)

if state.get("job_id"):
    jid = state["job_id"]

    r = requests.post(f"{BASE}/jobs/{jid}/running", headers=auth_headers())
    assert_status("POST /jobs/<id>/running", r, 200)

    r = requests.post(
        f"{BASE}/jobs/{jid}/completed",
        headers=auth_headers(),
        json={"result": {"exported_count": 42}},
    )
    assert_status("POST /jobs/<id>/completed", r, 200)

# ─── GOVERNANCE ──────────────────────────────────────────────────────────────
section("GOVERNANCE")

if state.get("workspace_id"):
    wid = state["workspace_id"]

    r = requests.get(f"{BASE}/governance/duplicates", headers=auth_headers(), params={"workspace_id": wid})
    assert_status("GET /governance/duplicates", r, 200)

    r = requests.get(f"{BASE}/governance/orphans", headers=auth_headers(), params={"workspace_id": wid})
    assert_status("GET /governance/orphans", r, 200)

    r = requests.get(f"{BASE}/governance/stale", headers=auth_headers(), params={"workspace_id": wid})
    assert_status("GET /governance/stale", r, 200)

    r = requests.post(
        f"{BASE}/governance/health-score",
        headers=auth_headers(),
        params={"workspace_id": wid},
    )
    assert_status("POST /governance/health-score", r, 201)

# ─── DELETE WORKSPACE ────────────────────────────────────────────────────────
section("CLEANUP: DELETE WORKSPACE")

if state.get("workspace_id"):
    r = requests.delete(f"{BASE}/workspaces/{state['workspace_id']}", headers=auth_headers())
    assert_status("DELETE /workspaces/<id>", r, 200)

# ─── LOGOUT ──────────────────────────────────────────────────────────────────
section("LOGOUT")

if state.get("refresh_token"):
    r = requests.post(
        f"{BASE}/auth/logout",
        headers={"Authorization": f"Bearer {state['refresh_token']}"},
    )
    assert_status("POST /auth/logout", r, 200)

# ─── SUMMARY ─────────────────────────────────────────────────────────────────
total = results["pass"] + results["fail"]
print(f"\n{'='*60}")
print(f"  RESULTS: {results['pass']}/{total} passed  |  {results['fail']} failed")
print(f"{'='*60}\n")

if results["fail"] > 0:
    sys.exit(1)
