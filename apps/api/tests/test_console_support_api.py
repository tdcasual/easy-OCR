from fastapi.testclient import TestClient

from app.main import app


def _create_job(client: TestClient) -> str:
    response = client.post(
        "/api/jobs",
        data={"mode": "debug", "quality_policy": "report_only"},
        files={"file": ("question_001.png", b"fake-image", "image/png")},
    )
    assert response.status_code == 201
    return response.json()["job_id"]


def test_job_console_support_endpoints_return_mock_diagnostics():
    client = TestClient(app)
    job_id = _create_job(client)

    assets = client.get(f"/api/jobs/{job_id}/assets")
    assert assets.status_code == 200
    assert assets.json()[0]["figure_id"].startswith("fig_")

    quality = client.get(f"/api/jobs/{job_id}/quality-report")
    assert quality.status_code == 200
    assert quality.json()["items"][0]["category"] == "mock_pipeline"

    model_calls = client.get(f"/api/jobs/{job_id}/model-calls")
    assert model_calls.status_code == 200
    assert model_calls.json()[0]["role"] == "vision_ocr"
    assert model_calls.json()[0]["status"] == "success"


def test_job_timeline_exposes_pipeline_steps_for_stepper():
    client = TestClient(app)
    job_id = _create_job(client)

    response = client.get(f"/api/jobs/{job_id}/timeline")

    assert response.status_code == 200
    steps = response.json()
    assert [step["key"] for step in steps] == [
        "upload",
        "preprocess",
        "layout",
        "crop_figures",
        "ocr",
        "structure",
        "validate",
        "quality",
        "export",
    ]
    assert steps[-1]["status"] == "completed"
