# Gnovium API Reference

> Welcome to Gnovium's API — the backend engine for the knowledge operating system. Every route is designed around a single principle: **knowledge should be connected, versioned, and evolvable**.

## Table of Contents

- [Overview](#overview)
- [Base URL & Environments](#base-url--environments)
- [Authentication](#authentication)
- [Standard Response Envelope](#standard-response-envelope)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [API Modules](#api-modules)
  - [Auth](#-auth)
  - [Workspaces](#-workspaces)
  - [Entities](#-entities)
  - [Blocks](#-blocks)
  - [Relations](#-relations)
  - [Tags](#-tags)
  - [Comments](#-comments)
  - [Branches](#-branches)
  - [Versions](#-versions)
  - [Diffs](#-diffs)
  - [Files](#-files)
  - [Search](#-search)
  - [AI Assistant](#-ai-assistant)
  - [Graph](#-graph)
  - [Governance](#-governance)
  - [Dashboard](#-dashboard)
  - [Notifications](#-notifications)
  - [Jobs](#-jobs)
  - [Sync](#-sync)
  - [Activity](#-activity)
  - [Backups](#-backups)
- [Quick Reference](#quick-reference)
- [Best Practices](#best-practices)

---

## Overview

Gnovium is a block-based knowledge platform with relational graphs, Git-inspired versioning, AI-powered search, and workspace governance. This API powers both **Local Mode** (SQLite, offline-first) and **Cloud Mode** (PostgreSQL/NeonDB, S3, Redis) using identical endpoints and contracts.

### Design Philosophy

| Principle | Why |
|-----------|-----|
| **Same API, any mode** | One codebase. Local SQLite or cloud NeonDB — your app code never changes. |
| **Soft deletes everywhere** | No data is ever truly lost. Every delete is reversible via restore endpoints. |
| **Partial updates** | All `PATCH` endpoints accept partial bodies — only send what changed. |
| **Pagination built-in** | Every list endpoint returns `page`, `per_page`, `total`, `pages` in metadata. |
| **Context-rich errors** | Every error has a machine-readable `code`, human-readable `message`, and optional `details`. |

---

## Base URL & Environments

| Environment | Base URL | Mode | Database |
|-------------|----------|------|----------|
| **Local Development** | `http://localhost:5000` | `GNOVIUM_MODE=local` | SQLite |
| **Cloud Production** | `https://api.gnovium.com` | `GNOVIUM_MODE=cloud` | NeonDB (PostgreSQL) |

All API paths are prefixed with `/api/v1/`.

```
GET /api/v1/workspaces/
POST /api/v1/ai/query
```

Two endpoints live outside the versioned prefix:

| Endpoint | Purpose |
|----------|---------|
| `GET /health` | Liveness check — returns `{"status": "healthy"}` |

---

## Authentication

Gnovium uses **JWT access + refresh token** authentication.

### Getting Tokens

```
POST /api/v1/auth/register   →  { access_token, refresh_token, user }
POST /api/v1/auth/login      →  { access_token, refresh_token, user }
```

### Using Tokens

**Access token** goes in the `Authorization` header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Refresh token** is sent via the `X-Refresh-Token` header when calling `/auth/refresh`:

```
X-Refresh-Token: eyJhbGciOiJIUzI1NiIs...
```

### Token Lifecycle

| Token | Lifespan | Usage |
|-------|----------|-------|
| Access Token | 30 minutes | All authenticated requests |
| Refresh Token | 14 days | Obtain new access tokens |

### Security Notes

- Tokens expire silently — if you get a 401, call `/auth/refresh`
- Logout revokes the refresh token server-side
- In cloud mode, cookies are `Secure` + `HttpOnly` + `SameSite=Lax`

---

## Standard Response Envelope

Every response follows this structure:

### Success

```json
{
  "data": { ... },
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 42,
    "pages": 3
  }
}
```

| Field | Present | Description |
|-------|---------|-------------|
| `data` | Always | The response payload — object, array, or scalar |
| `meta` | Paginated only | Pagination metadata |

### Error

```json
{
  "error": {
    "code": "not_found",
    "message": "Entity not found",
    "details": { "entity_id": "abc-123" }
  }
}
```

| Field | Present | Description |
|-------|---------|-------------|
| `code` | Always | Machine-readable error code |
| `message` | Always | Human-readable description |
| `details` | Sometimes | Additional context (validation errors, etc.) |

---

## Error Handling

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| `200` | Success |
| `201` | Created |
| `400` | Bad Request — malformed input or missing required fields |
| `401` | Unauthorized — missing or expired token |
| `403` | Forbidden — you don't own this resource |
| `404` | Not Found — resource doesn't exist |
| `409` | Conflict — duplicate or state conflict |
| `422` | Validation Error — schema validation failed |
| `429` | Too Many Requests — rate limit exceeded |
| `500` | Internal Server Error — something went wrong |

### Error Codes

| Code | Meaning |
|------|---------|
| `not_found` | Resource doesn't exist |
| `validation_error` | Input failed schema validation |
| `unauthorized` | Invalid or missing credentials |
| `forbidden` | Not authorized for this resource |
| `bad_request` | General request error |
| `rate_limit_exceeded` | Slow down |

---

## Rate Limiting

| Mode | Default Limit | Storage |
|------|---------------|---------|
| **Local** | 1,000 requests/min | In-memory |
| **Cloud** | 200 requests/min | Redis / Upstash |

Rate-limited requests return `429 Too Many Requests` with a `Retry-After` header.

---

## 📖 API Modules

---

### 🔐 Auth

Identity and session management.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | — | Create a new account |
| POST | `/auth/login` | — | Sign in with email + password |
| POST | `/auth/refresh` | Refresh | Get a new access token |
| POST | `/auth/logout` | Refresh | Revoke the current session |
| GET | `/auth/me` | Access | Get the authenticated user |
| PATCH | `/auth/me` | Access | Update your profile |

#### `POST /auth/register`

Create a new Gnovium account.

**Request:**
```json
{
  "email": "alice@example.com",
  "password": "SecurePass123!",
  "name": "Alice"
}
```

**Response `201`:**
```json
{
  "data": {
    "access_token": "eyJ...",
    "refresh_token": "eyJ...",
    "user": {
      "id": "uuid-here",
      "email": "alice@example.com",
      "name": "Alice"
    }
  }
}
```

| Field | Required | Notes |
|-------|----------|-------|
| `email` | ✅ | Must be a valid email, unique per instance |
| `password` | ✅ | Minimum 8 characters |
| `name` | — | Display name, defaults to part of email |

#### `POST /auth/login`

Authenticate and receive tokens.

**Request:**
```json
{
  "email": "alice@example.com",
  "password": "SecurePass123!"
}
```

**Response `200`:** Same token envelope as register.

#### `POST /auth/refresh`

Exchange a refresh token for a new access token.

**Headers:**
```
X-Refresh-Token: eyJ...
```

**Response `200`:**
```json
{
  "data": {
    "access_token": "eyJ...",
    "refresh_token": "eyJ..."
  }
}
```

#### `POST /auth/logout`

Invalidate the current session.

**Headers:**
```
X-Refresh-Token: eyJ...
```

**Response `200`:**
```json
{ "data": { "message": "logged_out" } }
```

#### `GET /auth/me`

Retrieve the authenticated user's profile.

**Response `200`:**
```json
{
  "data": {
    "id": "uuid",
    "email": "alice@example.com",
    "name": "Alice",
    "avatar_url": null,
    "created_at": "2025-06-01T12:00:00Z",
    "updated_at": "2025-06-15T08:30:00Z"
  }
}
```

#### `PATCH /auth/me`

Update your profile. Partial update — only send what changes.

**Request:**
```json
{
  "name": "Alice Smith",
  "avatar_url": "https://example.com/avatar.png"
}
```

**Response `200`:** Updated user object.

---

### 📂 Workspaces

Top-level containers that group knowledge, entities, and collaborators.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/workspaces/` | Access | List your workspaces |
| POST | `/workspaces/` | Access | Create a workspace |
| GET | `/workspaces/<id>` | Access | Get workspace details |
| PATCH | `/workspaces/<id>` | Access | Update workspace |
| DELETE | `/workspaces/<id>` | Access | Soft-delete workspace |
| GET | `/workspaces/<id>/stats` | Access | Workspace overview statistics |

#### `GET /workspaces/`

List all workspaces the authenticated user has access to.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | int | 1 | Page number |
| `per_page` | int | 20 | Items per page |

**Response `200`:** Paginated list of workspace objects.

#### `POST /workspaces/`

Create a new workspace.

**Request:**
```json
{
  "name": "My Knowledge Base",
  "description": "A workspace for my research notes",
  "settings": { "theme": "dark" }
}
```

| Field | Required | Notes |
|-------|----------|-------|
| `name` | ✅ | Workspace display name |
| `description` | — | Brief description |
| `settings` | — | Arbitrary key-value config dict |

**Response `201`:** Created workspace object with `id`.

#### `GET /workspaces/<id>`

**Response `200`:**
```json
{
  "data": {
    "id": "uuid",
    "name": "My Knowledge Base",
    "description": "A workspace for my research notes",
    "settings": { "theme": "dark" },
    "created_at": "2025-06-01T12:00:00Z",
    "updated_at": "2025-06-15T08:30:00Z"
  }
}
```

#### `PATCH /workspaces/<id>`

Partial update — only send changed fields.

**Request:**
```json
{
  "name": "Updated Name",
  "description": null
}
```

Setting `description` to `null` clears it.

#### `DELETE /workspaces/<id>`

Soft-delete the workspace and all its contents.

#### `GET /workspaces/<id>/stats`

A curated snapshot of workspace health and activity.

**Response `200:**
```json
{
  "data": {
    "workspace_id": "uuid",
    "entity_count": 42,
    "block_count": 215,
    "relation_count": 18,
    "comment_count": 7,
    "member_count": 3,
    "archived_count": 5,
    "recent_entities": [
      { "id": "uuid", "title": "Research Notes", "updated_at": "2025-06-15T08:30:00Z" }
    ]
  }
}
```

---

### 📄 Entities

The fundamental unit of knowledge — pages, documents, databases, or any typed object.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/entities/` | Access | List entities |
| POST | `/entities/` | Access | Create an entity |
| GET | `/entities/<id>` | Access | Get entity details |
| PATCH | `/entities/<id>` | Access | Update entity |
| DELETE | `/entities/<id>` | Access | Soft-delete entity |
| POST | `/entities/<id>/restore` | Access | Restore a soft-deleted entity |
| POST | `/entities/<id>/archive` | Access | Archive (hide without deleting) |
| POST | `/entities/<id>/duplicate` | Access | Duplicate entity + contents |
| GET | `/entities/<id>/children` | Access | List child entities |
| POST | `/entities/<id>/children` | Access | Create a child entity |
| GET | `/entities/<id>/versions` | Access | List version history |
| POST | `/entities/types` | Access | Create an entity type |
| GET | `/entities/types` | Access | List entity types |
| POST | `/entities/properties` | Access | Create a custom property |
| GET | `/entities/properties` | Access | List custom properties |

#### Core CRUD

**`POST /entities/`**
```json
{
  "workspace_id": "uuid",
  "entity_type_id": "uuid",
  "title": "My Document",
  "icon": "📄",
  "cover_image": null,
  "properties": { "Status": "Active", "Priority": "High" }
}
```
**Response `201`** — returns the created entity with its `id`.

**`PATCH /entities/<id>`**
```json
{
  "title": "Updated Title",
  "properties": { "Status": "Review" }
}
```

**`DELETE /entities/<id>`** — soft delete. The entity is hidden but recoverable.

**`POST /entities/<id>/restore`** — restore a soft-deleted entity.

**`POST /entities/<id>/archive`** — mark as archived (doesn't delete, just hides).

**`POST /entities/<id>/duplicate`** — deep copy of the entity and its blocks.

#### Entity Types

Gnovium entities are typed. Built-in types include "Page", "Database", "Document". Create custom types:

**`POST /entities/types`**
```json
{
  "workspace_id": "uuid",
  "name": "Meeting Notes",
  "icon": "📝",
  "config": { "allow_children": true }
}
```

#### Custom Properties

Define schemas for your entity types:

**`POST /entities/properties`**
```json
{
  "workspace_id": "uuid",
  "entity_type_id": "uuid",
  "name": "Status",
  "property_type": "select",
  "config": { "options": ["Active", "Review", "Done"] }
}
```

| `property_type` | Description |
|----------------|-------------|
| `text` | Free-form text |
| `number` | Numeric value |
| `select` | Single-select from options |
| `multi_select` | Multiple selections |
| `date` | Date value |
| `boolean` | True/false |
| `url` | URL link |

---

### 🧱 Blocks

The building blocks of entity content — text, headings, lists, code, and more.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/blocks/` | Access | List blocks for an entity |
| POST | `/blocks/` | Access | Create a block |
| GET | `/blocks/<id>` | Access | Get block details |
| PATCH | `/blocks/<id>` | Access | Update block content |
| POST | `/blocks/<id>/move` | Access | Move block to new parent/position |
| DELETE | `/blocks/<id>` | Access | Soft-delete block |
| POST | `/blocks/reorder` | Access | Batch reorder blocks |
| GET | `/blocks/entity/<entity_id>` | Access | List blocks for an entity (shorthand) |

#### `POST /blocks/`

**Request:**
```json
{
  "entity_id": "uuid",
  "parent_block_id": null,
  "block_type": "text",
  "position": 1000,
  "content": { "text": "Hello, world!" }
}
```

| Field | Required | Notes |
|-------|----------|-------|
| `entity_id` | ✅ | Parent entity |
| `parent_block_id` | — | For nested blocks |
| `block_type` | ✅ | `text`, `heading_1`, `heading_2`, `heading_3`, `bulleted_list`, `numbered_list`, `to_do`, `code`, `quote`, `callout`, `image`, `divider`, `table` |
| `position` | — | Sort order (float, defaults to next available) |
| `content` | — | JSON object with block-type-specific data |

**`content` structure by block type:**

| Block Type | Content Shape |
|-----------|--------------|
| `text` | `{"text": "..."}` |
| `heading_1` | `{"text": "..."}` |
| `heading_2` | `{"text": "..."}` |
| `heading_3` | `{"text": "..."}` |
| `bulleted_list` | `{"text": "..."}` |
| `numbered_list` | `{"text": "..."}` |
| `to_do` | `{"text": "...", "checked": false}` |
| `code` | `{"text": "...", "language": "python"}` |
| `quote` | `{"text": "..."}` |
| `callout` | `{"text": "...", "icon": "💡"}` |
| `image` | `{"url": "...", "alt": "..."}` |
| `divider` | `{}` |

#### `PATCH /blocks/<id>`

**Request:**
```json
{
  "content": { "text": "Updated content" }
}
```

#### `POST /blocks/reorder`

Batch update block positions in a single call.

**Request:**
```json
{
  "entity_id": "uuid",
  "blocks": [
    { "id": "block-uuid-1", "position": 100 },
    { "id": "block-uuid-2", "position": 200 },
    { "id": "block-uuid-3", "position": 300 }
  ]
}
```

#### `POST /blocks/<id>/move`

Move a block to a different parent or position.

**Request:**
```json
{
  "parent_block_id": "uuid-or-null",
  "position": 500
}
```

---

### 🔗 Relations

Connect entities to form a knowledge graph.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/relations/` | Access | List relations |
| POST | `/relations/` | Access | Create a relation |
| GET | `/relations/<id>` | Access | Get relation details |
| DELETE | `/relations/<id>` | Access | Soft-delete relation |
| GET | `/relations/entity/<entity_id>` | Access | Get outgoing relations |
| GET | `/relations/backlinks/<entity_id>` | Access | Get incoming relations |
| GET | `/relations/neighbors/<entity_id>` | Access | Get graph neighbors |
| GET | `/relations/path` | Access | Find shortest path between entities |

#### `POST /relations/`

**Request:**
```json
{
  "workspace_id": "uuid",
  "source_entity_id": "uuid",
  "target_entity_id": "uuid",
  "relation_type": "refers_to",
  "metadata": { "reason": "mentioned in notes" }
}
```

**Relation types:** `refers_to`, `depends_on`, `part_of`, `related_to`, `implements`, `extends`, `custom_type`.

#### `GET /relations/entity/<entity_id>`

Returns all relations where this entity is the source.

#### `GET /relations/backlinks/<entity_id>`

Returns all relations where this entity is the target — the "who links to me" view.

#### `GET /relations/neighbors/<entity_id>`

Returns all connected entities with their relation types — used by the graph renderer.

#### `GET /relations/path`

**Query Parameters:**
| Param | Required | Description |
|-------|----------|-------------|
| `source_entity_id` | ✅ | Start entity |
| `target_entity_id` | ✅ | End entity |

Finds the shortest path between two entities in the relation graph.

---

### 🏷️ Tags

Lightweight labels for entities — simpler than relations but equally powerful.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/tags/` | Access | List tags |
| POST | `/tags/` | Access | Create a tag |
| GET | `/tags/<id>` | Access | Get tag details |
| PATCH | `/tags/<id>` | Access | Update tag |
| DELETE | `/tags/<id>` | Access | Delete tag |
| POST | `/tags/<tag_id>/entities/<entity_id>` | Access | Tag an entity |
| DELETE | `/tags/<tag_id>/entities/<entity_id>` | Access | Untag an entity |

#### `POST /tags/`

**Request:**
```json
{
  "workspace_id": "uuid",
  "name": "important",
  "color": "#ff4444"
}
```

#### `POST /tags/<tag_id>/entities/<entity_id>`

Apply a tag to an entity. No request body needed.

**Response `201`:**
```json
{ "data": { "tag_id": "uuid", "entity_id": "uuid", "created_at": "..." } }
```

---

### 💬 Comments

Threaded discussions on entities and blocks.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/comments/` | Access | List comments |
| POST | `/comments/` | Access | Create a comment |
| GET | `/comments/<id>` | Access | Get comment |
| PATCH | `/comments/<id>` | Access | Update comment |
| DELETE | `/comments/<id>` | Access | Soft-delete comment |

#### `POST /comments/`

**Request:**
```json
{
  "workspace_id": "uuid",
  "entity_id": "uuid",
  "block_id": null,
  "parent_comment_id": null,
  "content": "Have you considered adding a diagram here?"
}
```

| Field | Required | Notes |
|-------|----------|-------|
| `workspace_id` | ✅ | Must match the entity's workspace |
| `entity_id` | — | Attach to an entity |
| `block_id` | — | Attach to a specific block |
| `parent_comment_id` | — | Reply to an existing comment |
| `content` | ✅ | Minimum 1 character |

At least one of `entity_id` or `block_id` must be provided.

---

### 🌿 Branches

Git-inspired branching for fearless experimentation.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/branches/` | Access | List branches |
| POST | `/branches/` | Access | Create a branch |
| GET | `/branches/<id>` | Access | Get branch details |
| DELETE | `/branches/<id>` | Access | Delete branch |
| POST | `/branches/<id>/merge` | Access | Merge into another branch |
| POST | `/branches/merge` | Access | Merge two branches by ID |

#### `POST /branches/`

**Request:**
```json
{
  "workspace_id": "uuid",
  "name": "feature/new-editor",
  "parent_branch_id": "uuid",
  "description": "Experimenting with a new block editor",
  "is_default": false
}
```

#### `POST /branches/<id>/merge`

Merge a branch into another.

**Request:**
```json
{
  "target_branch_id": "uuid"
}
```

#### `POST /branches/merge`

Merge two branches by specifying both explicitly.

**Request:**
```json
{
  "source_branch_id": "uuid",
  "target_branch_id": "uuid"
}
```

---

### 📝 Versions

Workspace versioning — snapshots, changesets, and entity history.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/versions/changesets` | Access | List changesets |
| POST | `/versions/changesets` | Access | Create a changeset |
| GET | `/versions/snapshots` | Access | List snapshots |
| POST | `/versions/snapshots` | Access | Create a snapshot |
| POST | `/versions/entities/<entity_id>/snapshot` | Access | Snapshot a single entity |
| GET | `/versions/entities/<entity_id>` | Access | List entity versions |
| GET | `/versions/blocks/<block_id>` | Access | List block versions |
| GET | `/versions/compare` | Access | Compare two versions |
| POST | `/versions/restore/<version_id>` | Access | Restore an entity to a version |

#### `POST /versions/changesets`

**Request:**
```json
{
  "branch_id": "uuid",
  "snapshot_id": null,
  "message": "Added new sections to the research doc"
}
```

#### `POST /versions/snapshots`

**Request:**
```json
{
  "branch_id": "uuid",
  "name": "Pre-migration backup",
  "description": "Snapshot before restructuring"
}
```

#### `POST /versions/entities/<entity_id>/snapshot`

Take a point-in-time snapshot of a single entity.

**Request:**
```json
{
  "changeset_id": null
}
```

#### `GET /versions/compare`

**Query Parameters:**
| Param | Required | Description |
|-------|----------|-------------|
| `left_version_id` | ✅ | Earlier version |
| `right_version_id` | ✅ | Later version |

**Response:** Structured diff showing added, removed, and changed blocks.

#### `POST /versions/restore/<version_id>`

Restore an entity to a previous version.

---

### 🔍 Diffs

Visual comparison between versions, snapshots, and branches.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/diffs/compare` | Access | Compare two snapshots or branches |

**Request:**
```json
{
  "left_snapshot_id": "uuid",
  "right_snapshot_id": "uuid"
}
```

Or compare branches:
```json
{
  "left_branch_id": "uuid",
  "right_branch_id": "uuid"
}
```

**Response:** Array of changes with `type` (`added`, `removed`, `modified`), `entity_id`, `block_id`, and the content diffs.

---

### 📎 Files

Upload, manage, and link files to entities.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/files/` | Access | List files |
| POST | `/files/upload` | Access | Upload a file (multipart) |
| POST | `/files/` | Access | Register file metadata |
| GET | `/files/<id>` | Access | Get file details |
| DELETE | `/files/<id>` | Access | Soft-delete file |
| POST | `/files/presign` | Access | Get a presigned S3 upload URL |
| POST | `/files/<file_id>/entities/<entity_id>` | Access | Link file to entity |

#### `POST /files/upload`

Upload a file using multipart form data.

**Form fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | binary | ✅ | The file to upload |
| `workspace_id` | string | ✅ | Target workspace |

**Storage modes:**
- **Local mode:** Saved to `{instance_path}/uploads/`
- **Cloud mode:** Uploaded to S3 bucket

**Response `201`:**
```json
{
  "data": {
    "id": "uuid",
    "file_name": "diagram.png",
    "mime_type": "image/png",
    "file_size": 204800,
    "public_url": "/uploads/diagram.png",
    "storage_provider": "local"
  }
}
```

#### `POST /files/presign`

Get a presigned URL for direct browser-to-S3 upload.

**Request:**
```json
{
  "object_key": "uploads/my-file.pdf",
  "content_type": "application/pdf"
}
```

Only available in cloud mode (S3 configured). Returns `{"enabled": false}` in local mode.

#### `POST /files/<file_id>/entities/<entity_id>`

Attach an existing file to an entity.

**Request:**
```json
{
  "block_id": null
}
```

Optionally link to a specific block within the entity.

---

### 🔎 Search

Full-text, semantic, and hybrid search across workspace content.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/search/` | Access | Search workspace content |

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `workspace_id` | UUID | — | ✅ **Required.** Scope search to a workspace |
| `q` | string | — | ✅ **Required.** Search query (minimum 1 char) |
| `mode` | enum | `hybrid` | `keyword` · `full_text` · `hybrid` · `semantic` |
| `limit` | int | `20` | Results per page (1–50) |

**Search modes:**

| Mode | Description |
|------|-------------|
| `keyword` | Simple text match on title and content |
| `full_text` | PostgreSQL full-text search (tsvector) — cloud only |
| `hybrid` | Combines keyword and semantic search (default) |
| `semantic` | Embedding-based vector similarity — requires Ollama |

**Response `200`:**
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Authentication Flow",
      "content": "...",
      "entity_type": "Page",
      "score": 0.95,
      "updated_at": "2025-06-15T08:30:00Z"
    }
  ],
  "meta": {
    "total": 3,
    "mode": "hybrid"
  }
}
```

---

### 🤖 AI Assistant

Ask questions about your workspace and get answers grounded in your knowledge.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/ai/query` | Access | Ask a question about workspace content |

**Request:**
```json
{
  "workspace_id": "uuid",
  "question": "What are the key architectural decisions in Project Alpha?",
  "limit": 8
}
```

| Field | Required | Default | Description |
|-------|----------|---------|-------------|
| `workspace_id` | ✅ | — | Scope to this workspace |
| `question` | ✅ | — | Natural language question (min 1 char) |
| `limit` | — | 8 | Number of context documents to retrieve (1–20) |

**How it works:**

1. The question is used to semantically search the workspace (hybrid mode)
2. Relevant documents are assembled as context
3. Ollama (local) or a cloud LLM generates an answer grounded in that context
4. Sources are returned alongside the answer for verification

**Response `200`:**
```json
{
  "data": {
    "answer": "Project Alpha uses a microservices architecture with…",
    "sources": [
      { "title": "Architecture Overview", "content": "..." },
      { "title": "Project Alpha README", "content": "..." }
    ]
  }
}
```

> **Note:** In local mode, Ollama must be running. In cloud mode, a cloud LLM provider is used.

---

### 🕸️ Graph

The visual knowledge graph — materialized, queryable, traversable.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/graph/` | Access | Get the latest materialized graph |
| POST | `/graph/materialize` | Access | Materialize the graph snapshot |
| POST | `/graph/query` | Access | Query graph nodes and edges |
| POST | `/graph/traverse` | Access | BFS traversal from a center node |
| POST | `/graph/paths` | Access | Find shortest path between two nodes |

#### `GET /graph/`

**Query Parameters:**
| Param | Required | Description |
|-------|----------|-------------|
| `workspace_id` | ✅ | Scope to workspace |

Returns the latest materialized graph snapshot with nodes and edges.

#### `POST /graph/materialize`

Trigger a fresh materialization of the graph from current entities and relations.

#### `POST /graph/query`

Filtered graph query.

**Request:**
```json
{
  "workspace_id": "uuid",
  "relation_types": ["refers_to", "depends_on"],
  "entity_type_ids": ["uuid", "uuid"],
  "limit": 200
}
```

All filter fields are optional — omit to get the full graph.

#### `POST /graph/traverse`

Breadth-first traversal from a center node.

**Request:**
```json
{
  "workspace_id": "uuid",
  "center_node": "uuid",
  "depth": 2,
  "relation_types": ["refers_to"]
}
```

| Field | Default | Max |
|-------|---------|-----|
| `depth` | 2 | 5 |

#### `POST /graph/paths`

Find the shortest path between two entities.

**Request:**
```json
{
  "workspace_id": "uuid",
  "source_entity_id": "uuid",
  "target_entity_id": "uuid"
}
```

---

### 🩺 Governance

Workspace health — detect duplicates, orphans, stale content, and calculate a health score.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/governance/health` | Access | Get workspace health score |
| GET | `/governance/duplicates` | Access | Find duplicate entities |
| GET | `/governance/orphans` | Access | Find orphaned entities |
| GET | `/governance/stale` | Access | Find stale entities |
| POST | `/governance/health-score` | Access | Recalculate health score |

#### `GET /governance/health`

**Query Parameters:**
| Param | Required | Description |
|-------|----------|-------------|
| `workspace_id` | ✅ | Scope to workspace |

**Response:** Returns the latest governance report with health score, counts, and detailed findings.

```json
{
  "data": {
    "id": "uuid",
    "workspace_id": "uuid",
    "health_score": 82,
    "duplicate_count": 2,
    "orphan_count": 5,
    "stale_count": 3,
    "report": {
      "duplicates": [
        { "title": "Untitled", "count": 3 },
        { "title": "Meeting Notes", "count": 2 }
      ],
      "orphans": [ ... ],
      "stale": [ ... ],
      "entity_count": 42
    },
    "created_at": "2025-06-15T08:30:00Z"
  }
}
```

**Health score formula:**

```
score = max(0, 100 - penalty)

penalty = min(70, duplicates × 5 + orphans × 2 + stale)
```

- **90–100:** Excellent 🟢
- **70–89:** Needs attention 🟡
- **Below 70:** Requires cleanup 🔴

#### `GET /governance/duplicates`

Returns entities with identical (case-insensitive) titles.

#### `GET /governance/orphans`

Returns entities with zero relations — no incoming or outgoing connections.

#### `GET /governance/stale`

Returns entities not updated in 90+ days.

#### `POST /governance/health-score`

Force a recalculation and store a new report.

---

### 📊 Dashboard

At-a-glance workspace overview.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/dashboard/overview` | Access | Workspace overview dashboard |

**Query Parameters:**
| Param | Required | Description |
|-------|----------|-------------|
| `workspace_id` | ✅ | Scope to workspace |

**Response `200`:**
```json
{
  "data": {
    "workspace_id": "uuid",
    "entity_count": 42,
    "block_count": 215,
    "relation_count": 18,
    "comment_count": 7,
    "member_count": 3,
    "archived_count": 5,
    "recent_entities": [
      { "id": "uuid", "title": "Research Notes", "updated_at": "2025-06-15T08:30:00Z" }
    ]
  }
}
```

---

### 🔔 Notifications

User notifications for workspace events.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/notifications/` | Access | List notifications |
| POST | `/notifications/` | Access | Create a notification |
| POST | `/notifications/<id>/read` | Access | Mark notification as read |

#### `POST /notifications/`

**Request:**
```json
{
  "workspace_id": "uuid",
  "user_id": "uuid",
  "entity_id": null,
  "type": "mention",
  "title": "Alice mentioned you in Research Notes",
  "message": "She asked for your feedback on the architecture section."
}
```

**Notification types:** `mention`, `comment`, `update`, `invite`, `system`.

#### `POST /notifications/<id>/read`

Mark a single notification as read. No request body needed.

---

### ⚡ Jobs

Asynchronous job tracking for long-running operations.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/jobs/` | Access | List jobs |
| POST | `/jobs/` | Access | Create a job |
| POST | `/jobs/<id>/running` | Access | Mark job as running |
| POST | `/jobs/<id>/completed` | Access | Mark job as completed |

#### `POST /jobs/`

**Request:**
```json
{
  "workspace_id": null,
  "job_type": "graph_materialization",
  "payload": { "workspace_id": "uuid" }
}
```

#### `POST /jobs/<id>/completed`

**Request:**
```json
{
  "result": { "nodes_count": 42, "edges_count": 18 }
}
```

---

### 🔄 Sync

Offline sync operations — queue, ingest, and acknowledge changes.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/sync/` | Access | List sync operations |
| POST | `/sync/` | Access | Ingest a sync operation |
| GET | `/sync/<id>` | Access | Get sync operation details |
| POST | `/sync/<op_id>/ack` | Access | Acknowledge sync complete |

#### `POST /sync/`

**Request:**
```json
{
  "workspace_id": "uuid",
  "operation_type": "entity_update",
  "entity_type": "entity",
  "entity_id": null,
  "payload": { "title": "Updated Offline" },
  "device_id": "laptop-alice",
  "client_clock": 42
}
```

**Operation types:** `entity_create`, `entity_update`, `entity_delete`, `block_create`, `block_update`, `block_delete`, `relation_create`, `relation_delete`.

#### `POST /sync/<op_id>/ack`

Mark a sync operation as processed. Conflicts are resolved server-side.

---

### 📜 Activity

Audit trail of workspace events.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/activity/` | Access | List activity log |

**Query Parameters:**
| Param | Required | Description |
|-------|----------|-------------|
| `workspace_id` | ✅ | Scope to workspace |
| `page` | — | Page number |
| `per_page` | — | Items per page (default 20) |

**Response `200`:** Paginated list of activity events with actor, action, target, and timestamp.

---

### 💾 Backups

Export and import workspace data for migration and safekeeping.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/backups/export` | Access | Export workspace as JSON |
| POST | `/backups/import` | Access | Import workspace from JSON |

#### `POST /backups/export`

**Request:**
```json
{
  "workspace_id": "uuid"
}
```

**Response `200`:** Full workspace dump including entities, blocks, relations, tags, branches, versions, and files metadata.

#### `POST /backups/import`

**Request:**
```json
{
  "workspace_id": "uuid",
  "entities": [ ... ],
  "blocks": [ ... ],
  "relations": [ ... ],
  "tags": [ ... ]
}
```

**Response `201`:** Confirmation with counts of imported items.

> **Tip:** Use export to create portable workspace archives. Works across local and cloud modes.

---

## Quick Reference

### Essential Endpoints

| What | Method | Endpoint |
|------|--------|----------|
| Health check | `GET` | `/health` |
| Register | `POST` | `/auth/register` |
| Login | `POST` | `/auth/login` |
| My profile | `GET` | `/auth/me` |
| List workspaces | `GET` | `/workspaces/` |
| Create workspace | `POST` | `/workspaces/` |
| Create entity | `POST` | `/entities/` |
| Create block | `POST` | `/blocks/` |
| Create relation | `POST` | `/relations/` |
| Create tag | `POST` | `/tags/` |
| Search | `GET` | `/search/` |
| AI query | `POST` | `/ai/query` |
| Dashboard | `GET` | `/dashboard/overview` |
| Graph query | `POST` | `/graph/query` |
| Health score | `GET` | `/governance/health` |

### Common Patterns

**Pagination:**
```
GET /endpoint?page=2&per_page=50
```

**Soft delete → restore:**
```
DELETE /entities/<id>       # marks as deleted
POST   /entities/<id>/restore  # brings it back
```

**Auth flow:**
```
POST /auth/register  →  access_token + refresh_token
     ↳ Use access_token for Authorization header
     ↳ When it expires: POST /auth/refresh
```

**Get graph neighbors:**
```
GET /relations/neighbors/<entity_id>
```

**Compare two versions:**
```
POST /diffs/compare
  { "left_snapshot_id": "...", "right_snapshot_id": "..." }
```

---

## Best Practices

### 1. Use pagination for list endpoints
Always pass `page` and `per_page` to list endpoints. The default `per_page` is 20 — increase to 50 for batch operations.

### 2. Exploit partial updates
`PATCH` endpoints accept any subset of fields. Don't send the full object — only include what changed.

### 3. Chain relations for rich knowledge
A typical workflow: create entities → link with relations → view graph → query with AI.

```
POST /entities/         → entity A
POST /entities/         → entity B
POST /relations/        → A → B
GET  /graph/query       → see the connection
POST /ai/query          → ask about the relationship
```

### 4. Use branches for experiments
Before making significant changes, create a branch:
```
POST /branches/       → new branch
... make changes ...
POST /branches/<id>/merge → merge back
```

### 5. Monitor workspace health
Regularly check `/governance/health` to identify duplicates, orphans, and stale content. A score above 90 is healthy.

### 6. Backup before migrations
```
POST /backups/export → save the JSON
... make changes ...
POST /backups/import → restore if needed
```

### 7. Leverage soft deletes
Never truly delete — use `DELETE` (soft) and `POST /restore` if you need the data back.

### 8. Use hybrid search
For the best results, use `mode=hybrid` in search queries — it combines keyword matching with semantic understanding.

---

*Gnovium API — v1 — Built for connected, versioned, evolvable knowledge.*
