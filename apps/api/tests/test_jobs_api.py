from fastapi.testclient import TestClient

from app.main import app


def test_create_job_uploads_image_and_returns_completed_document():
    client = TestClient(app)

    response = client.post(
        "/api/jobs",
        data={"mode": "auto", "quality_policy": "report_only"},
        files={"file": ("exercise.png", b"fake-image", "image/png")},
    )

    assert response.status_code == 201
    job = response.json()
    assert job["status"] == "completed"
    assert job["latest_document_version"] == 1

    document_response = client.get(f"/api/jobs/{job['job_id']}/document")
    assert document_response.status_code == 200
    assert document_response.json()["schema_version"] == "1.0"
