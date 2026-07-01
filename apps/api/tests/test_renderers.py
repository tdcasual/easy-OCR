from app.renderers.base import RenderContext
from app.renderers.registry import build_default_registry
from app.schemas.document import ProblemDocument
from app.schemas.export import ExportOptions
from app.schemas.job import JobMode, QualityPolicy
from app.services.mock_pipeline import MockOcrPipeline


def _document() -> ProblemDocument:
    return MockOcrPipeline().run(
        job_id="job_1",
        source_image_id="src_1",
        source_filename="exercise.png",
        source_path="uploads/exercise.png",
        mode=JobMode.AUTO,
        quality_policy=QualityPolicy.REPORT_ONLY,
    ).document


def _context() -> RenderContext:
    return RenderContext(
        options=ExportOptions(),
        asset_resolver=lambda figure_id: f"/api/assets/{figure_id}",
    )


def test_markdown_renderer_preserves_text_formula_and_figure_ref():
    registry = build_default_registry()

    artifact = registry.get("markdown").render(_document(), _context())
    output = registry.get("markdown").render_to_string(_document(), _context())

    assert artifact.format == "markdown"
    assert artifact.file_extension == "md"
    assert "如图所示" in output
    assert "$$x^2 + 2x + 1 = 0$$" in output
    assert "fig_job_1_1" in output


def test_html_renderer_outputs_semantic_html():
    registry = build_default_registry()

    artifact = registry.get("html").render(_document(), _context())
    output = registry.get("html").render_to_string(_document(), _context())

    assert artifact.format == "html"
    assert artifact.file_extension == "html"
    assert "<article" in output
    assert 'data-figure-id="fig_job_1_1"' in output
