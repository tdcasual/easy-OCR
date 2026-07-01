from dataclasses import dataclass, field
from typing import Protocol

from app.schemas.document import ProblemDocument


@dataclass(frozen=True)
class ModelRoleConfig:
    model: str
    api_base: str = ""
    temperature: float = 0.0
    max_tokens: int | None = None
    timeout_seconds: float = 60.0
    fallback_models: list[str] = field(default_factory=list)


class OcrImageRequest:
    def __init__(self, asset_id: str):
        self.asset_id = asset_id


class OcrImageResult:
    def __init__(self, text: str):
        self.text = text


class StructureRequest:
    def __init__(self, ocr_text: str, asset_id: str):
        self.ocr_text = ocr_text
        self.asset_id = asset_id


class FigureQualityRequest:
    def __init__(self, figure_id: str, version_id: str):
        self.figure_id = figure_id
        self.version_id = version_id


class FigureQualityResult:
    def __init__(self, score: float, risk_level: str, needs_review: bool):
        self.score = score
        self.risk_level = risk_level
        self.needs_review = needs_review


class FigureEnhanceRequest:
    def __init__(self, figure_id: str, version_id: str):
        self.figure_id = figure_id
        self.version_id = version_id


class FigureEnhanceResult:
    def __init__(self, version_id: str, path: str):
        self.version_id = version_id
        self.path = path


class ModelClient(Protocol):
    async def ocr_image(self, request: OcrImageRequest) -> OcrImageResult:
        ...

    async def structure_problem_document(
        self,
        request: StructureRequest,
    ) -> ProblemDocument:
        ...

    async def judge_figure_quality(
        self,
        request: FigureQualityRequest,
    ) -> FigureQualityResult:
        ...

    async def enhance_figure(
        self,
        request: FigureEnhanceRequest,
    ) -> FigureEnhanceResult:
        ...


class NoopModelClient:
    """Client that exposes role configuration without invoking any provider."""

    def __init__(self, roles: dict[str, ModelRoleConfig]):
        self._roles = roles

    def role(self, name: str) -> ModelRoleConfig:
        return self._roles[name]


class MockModelClient(ModelClient):
    """Client that returns deterministic mock results for all model roles."""

    def __init__(self, roles: dict[str, ModelRoleConfig]):
        self._roles = roles

    def role(self, name: str) -> ModelRoleConfig:
        return self._roles[name]

    async def ocr_image(self, request: OcrImageRequest) -> OcrImageResult:
        return OcrImageResult(text="Mock OCR text from asset " + request.asset_id)

    async def structure_problem_document(
        self,
        request: StructureRequest,
    ) -> ProblemDocument:
        from app.schemas.document import BlockType, Problem, SourceImage, TextBlock

        return ProblemDocument(
            id="doc_mock",
            document_version=1,
            source_image=SourceImage(
                image_id=request.asset_id,
                filename="mock.png",
                path="uploads/mock.png",
            ),
            problems=[
                Problem(
                    problem_id="problem_mock_1",
                    blocks=[TextBlock(type=BlockType.PARAGRAPH, text=request.ocr_text)],
                )
            ],
        )

    async def judge_figure_quality(
        self,
        request: FigureQualityRequest,
    ) -> FigureQualityResult:
        return FigureQualityResult(score=0.7, risk_level="medium", needs_review=True)

    async def enhance_figure(
        self,
        request: FigureEnhanceRequest,
    ) -> FigureEnhanceResult:
        return FigureEnhanceResult(
            version_id=f"{request.figure_id}_enhanced",
            path=f"assets/{request.figure_id}_enhanced.png",
        )
