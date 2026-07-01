from app.schemas.job import JobMode, QualityPolicy
from app.services.mock_pipeline import MockOcrPipeline


def test_mock_pipeline_returns_versioned_document_and_quality_report():
    pipeline = MockOcrPipeline()

    result = pipeline.run(
        job_id="job_1",
        source_image_id="src_1",
        source_filename="exercise.png",
        source_path="uploads/exercise.png",
        mode=JobMode.AUTO,
        quality_policy=QualityPolicy.REPORT_ONLY,
    )

    assert result.document.id == "doc_job_1"
    assert result.document.document_version == 1
    assert result.document.problems[0].blocks
    assert result.document.assets[0].figure_id == "fig_job_1_1"
    assert result.quality_report.items[0].category == "mock_pipeline"
    assert result.model_calls[0].role == "vision_ocr"
    assert result.timeline[-1].key == "export"
