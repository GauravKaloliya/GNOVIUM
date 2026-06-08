from app import create_app
from app.core.config import TestingConfig


def test_health_check():
    app = create_app(TestingConfig)
    client = app.test_client()
    response = client.get("/health")
    assert response.status_code == 200
    assert response.get_json()["data"]["status"] == "healthy"


def test_versioned_routes_registered():
    app = create_app(TestingConfig)
    routes = {rule.rule for rule in app.url_map.iter_rules()}
    assert "/api/v1/auth/login" in routes
    assert "/api/v1/entities/" in routes
    assert "/api/v1/ai/query" in routes
