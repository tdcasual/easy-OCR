from fastapi.testclient import TestClient

from app.main import app


def test_model_status_reflects_configuration():
    client = TestClient(app)

    response = client.get("/api/models/status")

    assert response.status_code == 200
    payload = response.json()
    assert "roles" in payload
    roles = {item["role"]: item for item in payload["roles"]}
    assert "vision_ocr" in roles
    assert "structure" in roles
    assert "figure_quality" in roles
    assert "figure_enhance" in roles
