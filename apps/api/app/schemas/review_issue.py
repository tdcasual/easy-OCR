from datetime import datetime, timezone
from enum import StrEnum
from uuid import uuid4

from pydantic import BaseModel, Field

from app.schemas.common import Severity


class ReviewIssueType(StrEnum):
    OCR_ERROR = "ocr_error"
    FORMULA_ERROR = "formula_error"
    FIGURE_CROP_ERROR = "figure_crop_error"
    FIGURE_ENHANCE_ERROR = "figure_enhance_error"
    LAYOUT_ERROR = "layout_error"
    EXPORT_ERROR = "export_error"
    SCHEMA_ERROR = "schema_error"
    PROMPT_IMPROVEMENT = "prompt_improvement"


class ReviewIssueStatus(StrEnum):
    OPEN = "open"
    TRIAGED = "triaged"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"


def _new_issue_id() -> str:
    return f"issue_{uuid4().hex[:12]}"


def _now() -> datetime:
    return datetime.now(timezone.utc)


class ReviewIssueCreate(BaseModel):
    title: str
    description: str
    expected_result: str | None = None
    issue_type: ReviewIssueType
    severity: Severity = Severity.WARNING
    affects_auto_export: bool = False
    job_id: str | None = None
    problem_id: str | None = None
    block_id: str | None = None
    block_path: str | None = None
    figure_id: str | None = None
    model_call_id: str | None = None
    export_id: str | None = None
    document_version: int | None = None
    labels: list[str] = Field(default_factory=list)


class ReviewIssueRead(BaseModel):
    issue_id: str = Field(default_factory=_new_issue_id)
    status: ReviewIssueStatus = ReviewIssueStatus.OPEN
    created_at: datetime = Field(default_factory=_now)
    updated_at: datetime = Field(default_factory=_now)
    title: str
    description: str
    expected_result: str | None = None
    issue_type: ReviewIssueType
    severity: Severity = Severity.WARNING
    affects_auto_export: bool = False
    job_id: str | None = None
    problem_id: str | None = None
    block_id: str | None = None
    block_path: str | None = None
    figure_id: str | None = None
    model_call_id: str | None = None
    export_id: str | None = None
    document_version: int | None = None
    labels: list[str] = Field(default_factory=list)


class ReviewIssueStatusUpdate(BaseModel):
    status: ReviewIssueStatus
