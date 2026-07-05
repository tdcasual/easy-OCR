from dataclasses import dataclass

from app.schemas.common import Severity
from app.schemas.document import (
    AssetKind,
    BlockType,
    FigureAsset,
    FigureRefBlock,
    FigureVersion,
    FormulaBlock,
    Problem,
    ProblemDocument,
    SourceImage,
    TextBlock,
)
from app.schemas.job import (
    JobMode,
    ModelCallRead,
    ModelCallStatus,
    QualityItem,
    QualityPolicy,
    QualityReport,
    TimelineStep,
    TimelineStepStatus,
)


@dataclass(frozen=True)
class PipelineResult:
    document: ProblemDocument
    quality_report: QualityReport
    model_calls: list[ModelCallRead]
    timeline: list[TimelineStep]


class MockOcrPipeline:
    def run(
        self,
        *,
        job_id: str,
        source_image_id: str,
        source_filename: str,
        source_path: str,
        mode: JobMode,
        quality_policy: QualityPolicy,
    ) -> PipelineResult:
        figure_id = f"fig_{job_id}_1"
        document = ProblemDocument(
            id=f"doc_{job_id}",
            schema_version="1.0",
            document_version=1,
            source_image=SourceImage(
                image_id=source_image_id,
                filename=source_filename,
                path=source_path,
            ),
            problems=[
                Problem(
                    problem_id=f"problem_{job_id}_1",
                    blocks=[
                        TextBlock(type=BlockType.PARAGRAPH, text="如图所示，求 x 的值。"),
                        FormulaBlock(type=BlockType.FORMULA, latex="x^2 + 2x + 1 = 0", display=True),
                        FigureRefBlock(type=BlockType.FIGURE_REF, figure_id=figure_id),
                    ],
                    figures=[figure_id],
                    confidence=0.8,
                    subject="math",
                    tags=["mock"],
                )
            ],
            assets=[
                FigureAsset(
                    figure_id=figure_id,
                    source_image_id=source_image_id,
                    bbox=[0, 0, 100, 100],
                    versions=[
                        FigureVersion(
                            version_id=f"{figure_id}_original",
                            kind=AssetKind.ORIGINAL_CROP,
                            path="assets/mock-figure.png",
                            quality_score=0.7,
                        )
                    ],
                    selected_version=f"{figure_id}_original",
                    quality_score=0.7,
                    risk_level="medium",
                    needs_review=mode != JobMode.AUTO,
                    provenance={"pipeline": "mock"},
                )
            ],
            metadata={"mode": mode.value, "quality_policy": quality_policy.value},
        )
        report = QualityReport(
            items=[
                QualityItem(
                    severity=Severity.INFO,
                    category="mock_pipeline",
                    message="Mock OCR pipeline generated a placeholder document.",
                    target={"job_id": job_id},
                )
            ]
        )
        model_calls = [
            ModelCallRead(
                model_call_id=f"call_{job_id}_vision",
                role="vision_ocr",
                model="mock-vision",
                prompt_version="v1.0.0",
                input_assets=[source_path],
                status=ModelCallStatus.SUCCESS,
                latency_seconds=0.2,
                token_count=1204,
            ),
            ModelCallRead(
                model_call_id=f"call_{job_id}_structure",
                role="structure",
                model="mock-structure",
                prompt_version="v1.0.0",
                input_assets=["ocr_result.json"],
                status=ModelCallStatus.SUCCESS,
                latency_seconds=0.1,
                token_count=842,
            ),
            ModelCallRead(
                model_call_id=f"call_{job_id}_quality",
                role="figure_quality",
                model="mock-quality",
                prompt_version="v1.0.0",
                input_assets=[f"{figure_id}_original"],
                status=ModelCallStatus.WARNING,
                latency_seconds=0.1,
                token_count=312,
                warning="Mock figure quality is medium; review recommended.",
            ),
        ]
        timeline = [
            TimelineStep(key="upload", label="Upload", status=TimelineStepStatus.COMPLETED),
            TimelineStep(key="preprocess", label="Preprocess", status=TimelineStepStatus.COMPLETED),
            TimelineStep(key="layout", label="Layout", status=TimelineStepStatus.COMPLETED),
            TimelineStep(key="crop_figures", label="Crop Figures", status=TimelineStepStatus.COMPLETED),
            TimelineStep(key="ocr", label="OCR", status=TimelineStepStatus.COMPLETED),
            TimelineStep(key="structure", label="Structure", status=TimelineStepStatus.COMPLETED),
            TimelineStep(key="validate", label="Validate", status=TimelineStepStatus.COMPLETED),
            TimelineStep(
                key="quality",
                label="Quality",
                status=TimelineStepStatus.WARNING,
                warning="Medium figure confidence",
            ),
            TimelineStep(key="export", label="Export", status=TimelineStepStatus.COMPLETED),
        ]
        return PipelineResult(
            document=document,
            quality_report=report,
            model_calls=model_calls,
            timeline=timeline,
        )
