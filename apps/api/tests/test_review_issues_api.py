from fastapi.testclient import TestClient

from app.main import app


def test_create_and_list_review_issue():
    client = TestClient(app)

    create_response = client.post(
        "/api/review-issues",
        json={
            "title": "Formula OCR mistake",
            "description": "x^2 was recognized as x2",
            "expected_result": "x^2",
            "issue_type": "formula_error",
            "severity": "error",
            "job_id": "job_1",
            "problem_id": "problem_1",
            "block_id": "blk_abc123",
            "block_path": "problems[0].blocks[1]",
            "document_version": 1,
            "labels": ["formula", "regression-candidate"],
        },
    )

    assert create_response.status_code == 201
    issue = create_response.json()
    assert issue["status"] == "open"
    assert issue["issue_type"] == "formula_error"
    assert issue["block_id"] == "blk_abc123"
    assert issue["document_version"] == 1

    list_response = client.get("/api/review-issues")
    assert list_response.status_code == 200
    assert any(item["issue_id"] == issue["issue_id"] for item in list_response.json())
