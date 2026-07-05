from enum import StrEnum
from typing import Annotated, Literal
from uuid import uuid4

from pydantic import BaseModel, Field


def _new_block_id() -> str:
    return f"blk_{uuid4().hex[:12]}"


class BlockType(StrEnum):
    PARAGRAPH = "paragraph"
    FORMULA = "formula"
    FIGURE_REF = "figure_ref"
    CHOICES = "choices"
    TABLE = "table"
    UNKNOWN = "unknown"


class AssetKind(StrEnum):
    ORIGINAL_CROP = "original_crop"
    NORMALIZED_CROP = "normalized_crop"
    TRADITIONAL_ENHANCED = "traditional_enhanced"
    AI_ENHANCED = "ai_enhanced"
    AI_REDRAWN = "ai_redrawn"
    MANUAL_UPLOAD = "manual_upload"


class SourceImage(BaseModel):
    image_id: str
    filename: str
    path: str
    width: int | None = None
    height: int | None = None


class BaseBlock(BaseModel):
    block_id: str = Field(default_factory=_new_block_id)


class TextBlock(BaseBlock):
    type: Literal[BlockType.PARAGRAPH] = BlockType.PARAGRAPH
    text: str


class FormulaBlock(BaseBlock):
    type: Literal[BlockType.FORMULA] = BlockType.FORMULA
    latex: str
    display: bool = False


class FigureRefBlock(BaseBlock):
    type: Literal[BlockType.FIGURE_REF] = BlockType.FIGURE_REF
    figure_id: str


class ChoiceItem(BaseModel):
    label: str
    blocks: list["ContentBlock"]


class ChoicesBlock(BaseBlock):
    type: Literal[BlockType.CHOICES] = BlockType.CHOICES
    items: list[ChoiceItem]


class TableBlock(BaseBlock):
    type: Literal[BlockType.TABLE] = BlockType.TABLE
    rows: list[list[str]]


class UnknownBlock(BaseBlock):
    type: Literal[BlockType.UNKNOWN] = BlockType.UNKNOWN
    raw_text: str
    reason: str | None = None


ContentBlock = Annotated[
    TextBlock | FormulaBlock | FigureRefBlock | ChoicesBlock | TableBlock | UnknownBlock,
    Field(discriminator="type"),
]


class FigureVersion(BaseModel):
    version_id: str
    kind: AssetKind
    path: str
    quality_score: float | None = Field(default=None, ge=0, le=1)
    metadata: dict = Field(default_factory=dict)


class FigureAsset(BaseModel):
    figure_id: str
    source_image_id: str
    bbox: list[int] = Field(min_length=4, max_length=4)
    versions: list[FigureVersion]
    selected_version: str
    quality_score: float | None = Field(default=None, ge=0, le=1)
    risk_level: str = "unknown"
    needs_review: bool = False
    metadata: dict = Field(default_factory=dict)
    provenance: dict = Field(default_factory=dict)


class Problem(BaseModel):
    problem_id: str
    blocks: list[ContentBlock]
    figures: list[str] = Field(default_factory=list)
    confidence: float | None = Field(default=None, ge=0, le=1)
    answer: list[ContentBlock] | None = None
    solution: list[ContentBlock] | None = None
    subject: str | None = None
    grade: str | None = None
    difficulty: str | None = None
    knowledge_points: list[str] = Field(default_factory=list)
    source: str | None = None
    tags: list[str] = Field(default_factory=list)
    question_type: str | None = None


class ProblemDocument(BaseModel):
    id: str
    schema_version: str = "1.0"
    document_version: int = Field(ge=1)
    source_image: SourceImage
    problems: list[Problem]
    assets: list[FigureAsset] = Field(default_factory=list)
    metadata: dict = Field(default_factory=dict)


ChoiceItem.model_rebuild()
ChoicesBlock.model_rebuild()
Problem.model_rebuild()
ProblemDocument.model_rebuild()


class DocumentUpdateRequest(BaseModel):
    document: dict
