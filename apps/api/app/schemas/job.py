from enum import StrEnum

from pydantic import BaseModel, Field

from app.schemas.common import Severity


class JobMode(StrEnum):
    AUTO = "auto"
    REVIEW = "review"
    DEBUG = "debug"


class QualityPolicy(StrEnum):
    REPORT_ONLY = "report_only"
    STRICT = "strict"


class JobStatus(StrEnum):
    QUEUED = "queued"
    PREPROCESSING = "preprocessing"
    DETECTING_LAYOUT = "detecting_layout"
    CROPPING_FIGURES = "cropping_figures"
    OCR_RUNNING = "ocr_running"
    STRUCTURING = "structuring"
    JUDGING_FIGURES = "judging_figures"
    ENHANCING_FIGURES = "enhancing_figures"
    RENDERING_PREVIEW = "rendering_preview"
    COMPLETED = "completed"
    FAILED = "failed"
    NEEDS_REVIEW = "needs_review"


class QualityItem(BaseModel):
    severity: Severity
    category: str
    message: str
    target: dict = Field(default_factory=dict)


class QualityReport(BaseModel):
    items: list[QualityItem] = Field(default_factory=list)


class JobRead(BaseModel):
    job_id: str
    mode: JobMode
    quality_policy: QualityPolicy
    status: JobStatus
    progress: float = Field(ge=0, le=1)
    source_image_id: str | None = None
    latest_document_version: int | None = None
    quality_summary: dict = Field(default_factory=dict)
    error: str | None = None


class ModelCallStatus(StrEnum):
    SUCCESS = "success"
    WARNING = "warning"
    RATE_LIMITED = "rate_limited"
    TIMEOUT = "timeout"
    PARSE_ERROR = "parse_error"
    PROVIDER_ERROR = "provider_error"
    FALLBACK_USED = "fallback_used"


class ModelCallRead(BaseModel):
    model_call_id: str
    role: str
    model: str
    prompt_version: str
    input_assets: list[str] = Field(default_factory=list)
    status: ModelCallStatus | str
    latency_seconds: float | None = None
    token_count: int | None = None
    warning: str | None = None


class TimelineStep(BaseModel):
    key: str
    label: str
    status: str
    warning: str | None = None
