from pathlib import Path

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


def test_create_job_rejects_oversized_upload():
    client = TestClient(app)
    oversized = b"x" * (512 * 1024 + 1)

    response = client.post(
        "/api/jobs",
        data={"mode": "auto", "quality_policy": "report_only"},
        files={"file": ("exercise.png", oversized, "image/png")},
    )

    assert response.status_code == 413
    assert "too large" in response.text.lower()


def test_create_job_rejects_unsupported_content_type():
    client = TestClient(app)

    response = client.post(
        "/api/jobs",
        data={"mode": "auto", "quality_policy": "report_only"},
        files={"file": ("exercise.txt", b"not an image", "text/plain")},
    )

    assert response.status_code == 415
    assert "unsupported" in response.text.lower()


def test_create_job_rejects_missing_content_type():
    client = TestClient(app)

    response = client.post(
        "/api/jobs",
        data={"mode": "auto", "quality_policy": "report_only"},
        files={"file": ("exercise.png", b"fake-image", "")},
    )

    assert response.status_code == 415


def test_get_asset_returns_selected_version_file():
    storage_root = Path("../../storage").resolve()
    asset_path = storage_root / "assets" / "mock-figure.png"
    asset_path.parent.mkdir(parents=True, exist_ok=True)
    asset_path.write_bytes(b"png-bytes")

    try:
        client = TestClient(app)
        response = client.post(
            "/api/jobs",
            data={"mode": "auto", "quality_policy": "report_only"},
            files={"file": ("exercise.png", b"fake-image", "image/png")},
        )
        job_id = response.json()["job_id"]
        document = client.get(f"/api/jobs/{job_id}/document").json()
        figure_id = document["assets"][0]["figure_id"]

        asset_response = client.get(f"/api/jobs/{job_id}/assets/{figure_id}")

        assert asset_response.status_code == 200
        assert asset_response.content == b"png-bytes"
    finally:
        asset_path.unlink(missing_ok=True)


def test_get_asset_returns_404_for_unknown_figure():
    client = TestClient(app)
    response = client.post(
        "/api/jobs",
        data={"mode": "auto", "quality_policy": "report_only"},
        files={"file": ("exercise.png", b"fake-image", "image/png")},
    )
    job_id = response.json()["job_id"]

    asset_response = client.get(f"/api/jobs/{job_id}/assets/nonexistent")

    assert asset_response.status_code == 404


def test_get_source_image_returns_uploaded_file():
    client = TestClient(app)
    image = b"fake-image"
    response = client.post(
        "/api/jobs",
        data={"mode": "auto", "quality_policy": "report_only"},
        files={"file": ("exercise.png", image, "image/png")},
    )
    job_id = response.json()["job_id"]

    source_response = client.get(f"/api/jobs/{job_id}/source-image")

    assert source_response.status_code == 200
    assert source_response.content == image


def test_patch_document_creates_new_version():
    client = TestClient(app)
    response = client.post(
        "/api/jobs",
        data={"mode": "auto", "quality_policy": "report_only"},
        files={"file": ("exercise.png", b"fake-image", "image/png")},
    )
    job_id = response.json()["job_id"]
    document = client.get(f"/api/jobs/{job_id}/document").json()
    document["problems"][0]["blocks"][0]["text"] = "updated text"

    patch_response = client.patch(
        f"/api/jobs/{job_id}/document",
        json={"document": document},
    )

    assert patch_response.status_code == 200
    patched = patch_response.json()
    assert patched["document_version"] == 2
    assert patched["problems"][0]["blocks"][0]["text"] == "updated text"

    job_response = client.get(f"/api/jobs/{job_id}")
    assert job_response.json()["latest_document_version"] == 2
