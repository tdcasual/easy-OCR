import asyncio

from app.services.model_client import (
    MockModelClient,
    ModelRoleConfig,
    NoopModelClient,
)


def test_noop_model_client_exposes_roles_without_provider_lock_in():
    client = NoopModelClient(
        roles={
            "vision_ocr": ModelRoleConfig(model="", api_base=""),
            "structure": ModelRoleConfig(model="", api_base=""),
        }
    )

    assert client.role("vision_ocr").model == ""
    assert client.role("structure").api_base == ""


def test_mock_model_client_returns_mock_results():
    client = MockModelClient(
        roles={
            "vision_ocr": ModelRoleConfig(model="mock-vision", api_base=""),
            "structure": ModelRoleConfig(model="mock-structure", api_base=""),
        }
    )

    ocr_result = asyncio.run(
        client.ocr_image(type("request", (), {"asset_id": "src_1"})())
    )
    assert "Mock OCR text" in ocr_result.text

    doc = asyncio.run(
        client.structure_problem_document(
            type("request", (), {"ocr_text": "test", "asset_id": "src_1"})()
        )
    )
    assert doc.problems[0].blocks[0].text == "test"
