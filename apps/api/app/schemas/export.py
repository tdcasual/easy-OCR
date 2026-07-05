from datetime import datetime, timezone
from enum import StrEnum

from pydantic import BaseModel, Field


def _now() -> datetime:
    return datetime.now(timezone.utc)


class FigureMode(StrEnum):
    SELECTED = "selected"
    ORIGINAL = "original"
    ENHANCED = "enhanced"
    ALL = "all"


class ExportOptions(BaseModel):
    include_answer: bool = True
    include_solution: bool = True
    figure_mode: FigureMode = FigureMode.SELECTED


class ExportRequest(BaseModel):
    format: str
    options: ExportOptions = Field(default_factory=ExportOptions)


class ExportArtifact(BaseModel):
    export_id: str
    job_id: str
    document_version: int
    format: str
    mime_type: str
    file_extension: str
    path: str
    renderer_version: str = "0.1.0"
    figure_mode: FigureMode = FigureMode.SELECTED
    warnings: list[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=_now)
