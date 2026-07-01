from fastapi.testclient import TestClient

from app.main import app


def test_export_markdown_from_job_document():
    client = TestClient(app)
    job_response = client.post(
        "/api/jobs",
        files={"file": ("exercise.png", b"fake-image", "image/png")},
    )
    job_id = job_response.json()["job_id"]

    export_response = client.post(
        f"/api/jobs/{job_id}/exports",
        json={"format": "markdown", "options": {"figure_mode": "selected"}},
    )

    assert export_response.status_code == 201
    artifact = export_response.json()
    assert artifact["format"] == "markdown"
    assert artifact["file_extension"] == "md"
    assert artifact["renderer_version"] == "0.1.0"


def test_list_export_formats():
    client = TestClient(app)

    response = client.get("/api/export-formats")

    assert response.status_code == 200
    assert {"format": "markdown", "mime_type": "text/markdown", "file_extension": "md"} in response.json()
