import os

from flask import Blueprint

from app.api.v1.activity import bp as activity_bp
from app.api.v1.ai.routes import bp as ai_bp
from app.api.v1.backups import bp as backups_bp
from app.api.v1.blocks.routes import bp as blocks_bp
from app.api.v1.branches.routes import bp as branches_bp
from app.api.v1.comments import bp as comments_bp
from app.api.v1.dashboard import bp as dashboard_bp
from app.api.v1.entities.routes import bp as entities_bp
from app.api.v1.files.routes import bp as files_bp
from app.api.v1.governance.routes import bp as governance_bp
from app.api.v1.graph import bp as graph_bp
from app.api.v1.notifications.routes import bp as notifications_bp
from app.api.v1.relations.routes import bp as relations_bp
from app.api.v1.search.routes import bp as search_bp
from app.api.v1.tags import bp as tags_bp
from app.api.v1.workspaces.routes import bp as workspaces_bp

_mode = os.environ.get("GNOVIUM_MODE", "local").strip().lower()

api_v1 = Blueprint("api_v1", __name__)

# Core
api_v1.register_blueprint(workspaces_bp, url_prefix="/workspaces")

# Entities & Content
api_v1.register_blueprint(entities_bp, url_prefix="/entities")
api_v1.register_blueprint(blocks_bp, url_prefix="/blocks")
api_v1.register_blueprint(relations_bp, url_prefix="/relations")
api_v1.register_blueprint(comments_bp, url_prefix="/comments")
api_v1.register_blueprint(tags_bp, url_prefix="/tags")

# Versioning & Branching
api_v1.register_blueprint(branches_bp, url_prefix="/branches")

# Search & AI
api_v1.register_blueprint(search_bp, url_prefix="/search")
api_v1.register_blueprint(ai_bp, url_prefix="/ai")

# Files
api_v1.register_blueprint(files_bp, url_prefix="/files")

# Graph
api_v1.register_blueprint(graph_bp, url_prefix="/graph")

# Observability & Governance
api_v1.register_blueprint(activity_bp, url_prefix="/activity")
api_v1.register_blueprint(governance_bp, url_prefix="/governance")
api_v1.register_blueprint(notifications_bp, url_prefix="/notifications")

# Dashboard & Backups
api_v1.register_blueprint(dashboard_bp, url_prefix="/dashboard")
api_v1.register_blueprint(backups_bp, url_prefix="/backups")

# Cloud-only blueprints
if _mode == "cloud":
    from app.api.v1.auth.routes import bp as auth_bp
    from app.api.v1.diffs import bp as diffs_bp
    from app.api.v1.jobs.routes import bp as jobs_bp
    from app.api.v1.sync import bp as sync_bp
    from app.api.v1.versions.routes import bp as versions_bp

    api_v1.register_blueprint(auth_bp, url_prefix="/auth")
    api_v1.register_blueprint(diffs_bp, url_prefix="/diffs")
    api_v1.register_blueprint(jobs_bp, url_prefix="/jobs")
    api_v1.register_blueprint(sync_bp, url_prefix="/sync")
    api_v1.register_blueprint(versions_bp, url_prefix="/versions")
