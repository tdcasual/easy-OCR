# easy-OCR MVP Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the first API-first MVP for easy-OCR: a FastAPI backend with schema-valid mock OCR jobs, extensible exports, review issues, LiteLLM model-client boundaries, and a Next.js debugging console.

**Architecture:** The backend owns the canonical `ProblemDocument`, job lifecycle, storage, exports, model-call logs, and review issues. The frontend is a debugging and review console that calls the API, shows job state, previews documents/assets/exports, and creates issues. The first implementation uses a mock OCR pipeline and local storage so the whole product flow works before real OCR and figure detection are added.

**Tech Stack:** Python 3.11+, FastAPI, Pydantic v2, SQLModel, SQLite, pytest, httpx, LiteLLM, Node.js, Next.js, TypeScript, TanStack Query, Vitest or Playwright for frontend smoke tests.

---

## Ground Rules

- Follow TDD for backend behavior: write a failing test, run it, implement the smallest passing code, rerun it, commit.
- Keep the first pipeline mocked. Do not integrate real OCR providers until the API, schema, storage, renderer, and review loops work.
- Do not commit uploaded images, generated assets, exports, local databases, logs, `.env`, or provider secrets.
- Preserve the existing design document: `docs/plans/2026-05-20-ocr-exercise-api-design.md`.
- Use `schema_version` and `document_version` from the beginning.
- Prefer explicit warnings and quality reports over hidden failures.
- Every commit should leave tests passing for the area touched.

## Target Repository Shape

```text
apps/
  api/
    app/
      main.py
      api/
      core/
      db/
      models/
      schemas/
      services/
      renderers/
      storage/
    tests/
    pyproject.toml
    README.md
  web/
    app/
    components/
    lib/
    package.json
    README.md
docs/
  plans/
storage/
  uploads/
  assets/
  exports/
  tmp/
```

---

### Task 1: Backend Project Skeleton

**Files:**
- Create: `apps/api/pyproject.toml`
- Create: `apps/api/README.md`
- Create: `apps/api/app/__init__.py`
- Create: `apps/api/app/main.py`
- Create: `apps/api/app/core/config.py`
- Create: `apps/api/tests/test_health.py`

**Step 1: Write the failing health test**

Create `apps/api/tests/test_health.py`:

```python
from fastapi.testclient import TestClient

from app.main import app


def test_health_returns_ok():
    client = TestClient(app)

    response = client.get("/api/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "service": "easy-ocr-api",
    }
```

**Step 2: Add backend packaging**

Create `apps/api/pyproject.toml`:

```toml
[project]
name = "easy-ocr-api"
version = "0.1.0"
description = "API-first OCR service for structured exercise documents."
requires-python = ">=3.11"
dependencies = [
  "fastapi>=0.115.0",
  "uvicorn[standard]>=0.30.0",
  "pydantic>=2.8.0",
  "pydantic-settings>=2.4.0",
  "sqlmodel>=0.0.22",
  "python-multipart>=0.0.9",
  "litellm>=1.44.0",
]

[project.optional-dependencies]
dev = [
  "pytest>=8.3.0",
  "httpx>=0.27.0",
  "ruff>=0.6.0",
]

[tool.pytest.ini_options]
pythonpath = ["."]
testpaths = ["tests"]

[tool.ruff]
line-length = 100
target-version = "py311"
```

Create `apps/api/README.md`:

```markdown
# easy-OCR API

FastAPI backend for the easy-OCR MVP.

## Development

```bash
cd apps/api
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
pytest
uvicorn app.main:app --reload
```
```

**Step 3: Run test to verify it fails**

Run:

```bash
cd apps/api
python -m pytest tests/test_health.py -v
```

Expected: FAIL because `app.main` or `/api/health` does not exist yet.

**Step 4: Implement minimal FastAPI app**

Create `apps/api/app/__init__.py`:

```python
"""easy-OCR API package."""
```

Create `apps/api/app/core/config.py`:

```python
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    service_name: str = "easy-ocr-api"
    api_prefix: str = "/api"
    database_url: str = "sqlite:///./easy_ocr.sqlite3"
    storage_root: str = "../../storage"

    model_config = SettingsConfigDict(env_file=".env", env_prefix="EASY_OCR_")


@lru_cache
def get_settings() -> Settings:
    return Settings()
```

Create `apps/api/app/main.py`:

```python
from fastapi import FastAPI

from app.core.config import get_settings

settings = get_settings()

app = FastAPI(title="easy-OCR API")


@app.get(f"{settings.api_prefix}/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": settings.service_name}
```

**Step 5: Run test to verify it passes**

Run:

```bash
cd apps/api
python -m pytest tests/test_health.py -v
```

Expected: PASS.

**Step 6: Commit**

```bash
git add apps/api
git commit -m "feat(api): add FastAPI skeleton"
```

---

### Task 2: Canonical Pydantic Schemas

**Files:**
- Create: `apps/api/app/schemas/__init__.py`
- Create: `apps/api/app/schemas/document.py`
- Create: `apps/api/app/schemas/job.py`
- Create: `apps/api/app/schemas/export.py`
- Create: `apps/api/app/schemas/review_issue.py`
- Create: `apps/api/tests/test_document_schema.py`

**Step 1: Write failing schema tests**

Create `apps/api/tests/test_document_schema.py`:

```python
from app.schemas.document import (
    AssetKind,
    BlockType,
    FigureAsset,
    FigureVersion,
    Problem,
    ProblemDocument,
    SourceImage,
    TextBlock,
)


def test_problem_document_requires_versioned_semantic_structure():
    document = ProblemDocument(
        id="doc_1",
        schema_version="1.0",
        document_version=1,
        source_image=SourceImage(
            image_id="src_1",
            filename="exercise.png",
            path="storage/uploads/exercise.png",
            width=1200,
            height=1600,
        ),
        problems=[
            Problem(
                problem_id="problem_1",
                blocks=[TextBlock(type=BlockType.PARAGRAPH, text="如图所示，求 x。")],
                figures=["fig_1"],
                confidence=0.91,
            )
        ],
        assets=[
            FigureAsset(
                figure_id="fig_1",
                source_image_id="src_1",
                bbox=[10, 20, 300, 420],
                versions=[
                    FigureVersion(
                        version_id="fig_1_original",
                        kind=AssetKind.ORIGINAL_CROP,
                        path="storage/assets/fig_1_original.png",
                        quality_score=0.82,
                    )
                ],
                selected_version="fig_1_original",
                quality_score=0.82,
                risk_level="low",
                needs_review=False,
            )
        ],
        metadata={"mode": "auto"},
    )

    payload = document.model_dump()

    assert payload["schema_version"] == "1.0"
    assert payload["document_version"] == 1
    assert payload["problems"][0]["blocks"][0]["type"] == "paragraph"
    assert payload["assets"][0]["versions"][0]["kind"] == "original_crop"
```

**Step 2: Run test to verify it fails**

Run:

```bash
cd apps/api
python -m pytest tests/test_document_schema.py -v
```

Expected: FAIL because schema modules do not exist.

**Step 3: Implement document schemas**

Create `apps/api/app/schemas/__init__.py`:

```python
"""Pydantic schemas for easy-OCR."""
```

Create `apps/api/app/schemas/document.py`:

```python
from enum import StrEnum
from typing import Annotated, Literal

from pydantic import BaseModel, Field


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


class TextBlock(BaseModel):
    type: Literal[BlockType.PARAGRAPH] = BlockType.PARAGRAPH
    text: str


class FormulaBlock(BaseModel):
    type: Literal[BlockType.FORMULA] = BlockType.FORMULA
    latex: str
    display: bool = False


class FigureRefBlock(BaseModel):
    type: Literal[BlockType.FIGURE_REF] = BlockType.FIGURE_REF
    figure_id: str


class ChoiceItem(BaseModel):
    label: str
    blocks: list["ContentBlock"]


class ChoicesBlock(BaseModel):
    type: Literal[BlockType.CHOICES] = BlockType.CHOICES
    items: list[ChoiceItem]


class TableBlock(BaseModel):
    type: Literal[BlockType.TABLE] = BlockType.TABLE
    rows: list[list[str]]


class UnknownBlock(BaseModel):
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
```

Create `apps/api/app/schemas/job.py`:

```python
from enum import StrEnum

from pydantic import BaseModel, Field


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
    severity: str
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
```

Create `apps/api/app/schemas/export.py`:

```python
from pydantic import BaseModel, Field


class ExportOptions(BaseModel):
    include_answer: bool = True
    include_solution: bool = True
    figure_mode: str = "selected"


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
    warnings: list[str] = Field(default_factory=list)
```

Create `apps/api/app/schemas/review_issue.py`:

```python
from enum import StrEnum

from pydantic import BaseModel, Field


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


class ReviewIssueCreate(BaseModel):
    title: str
    description: str
    expected_result: str | None = None
    issue_type: ReviewIssueType
    severity: str = "warning"
    affects_auto_export: bool = False
    job_id: str | None = None
    problem_id: str | None = None
    block_path: str | None = None
    figure_id: str | None = None
    model_call_id: str | None = None
    export_id: str | None = None
    labels: list[str] = Field(default_factory=list)


class ReviewIssueRead(ReviewIssueCreate):
    issue_id: str
    status: ReviewIssueStatus = ReviewIssueStatus.OPEN
```

**Step 4: Run schema tests**

Run:

```bash
cd apps/api
python -m pytest tests/test_document_schema.py -v
```

Expected: PASS.

**Step 5: Commit**

```bash
git add apps/api/app/schemas apps/api/tests/test_document_schema.py
git commit -m "feat(api): define canonical document schemas"
```

---

### Task 3: Local Storage Service

**Files:**
- Create: `apps/api/app/services/storage.py`
- Create: `apps/api/tests/test_storage_service.py`

**Step 1: Write failing storage tests**

Create `apps/api/tests/test_storage_service.py`:

```python
from app.services.storage import LocalStorage


def test_storage_writes_bytes_under_kind_directory(tmp_path):
    storage = LocalStorage(root=tmp_path)

    stored = storage.write_bytes(kind="uploads", filename="sample.png", content=b"image-bytes")

    assert stored.relative_path == "uploads/sample.png"
    assert stored.absolute_path.read_bytes() == b"image-bytes"


def test_storage_rejects_path_traversal(tmp_path):
    storage = LocalStorage(root=tmp_path)

    try:
        storage.write_bytes(kind="uploads", filename="../secret.txt", content=b"bad")
    except ValueError as exc:
        assert "unsafe filename" in str(exc)
    else:
        raise AssertionError("Expected ValueError")
```

**Step 2: Run test to verify it fails**

Run:

```bash
cd apps/api
python -m pytest tests/test_storage_service.py -v
```

Expected: FAIL because `LocalStorage` does not exist.

**Step 3: Implement storage service**

Create `apps/api/app/services/storage.py`:

```python
from dataclasses import dataclass
from pathlib import Path
from uuid import uuid4


@dataclass(frozen=True)
class StoredFile:
    relative_path: str
    absolute_path: Path


class LocalStorage:
    def __init__(self, root: str | Path):
        self.root = Path(root).resolve()
        self.root.mkdir(parents=True, exist_ok=True)

    def write_bytes(self, kind: str, filename: str, content: bytes) -> StoredFile:
        safe_name = self._safe_filename(filename)
        directory = (self.root / kind).resolve()
        if not str(directory).startswith(str(self.root)):
            raise ValueError("unsafe storage kind")
        directory.mkdir(parents=True, exist_ok=True)
        path = directory / safe_name
        path.write_bytes(content)
        return StoredFile(relative_path=f"{kind}/{safe_name}", absolute_path=path)

    def unique_name(self, original_filename: str) -> str:
        safe_name = self._safe_filename(original_filename)
        suffix = Path(safe_name).suffix
        stem = Path(safe_name).stem or "file"
        return f"{stem}-{uuid4().hex}{suffix}"

    @staticmethod
    def _safe_filename(filename: str) -> str:
        name = Path(filename).name
        if name != filename or name in {"", ".", ".."}:
            raise ValueError("unsafe filename")
        return name
```

**Step 4: Run storage tests**

Run:

```bash
cd apps/api
python -m pytest tests/test_storage_service.py -v
```

Expected: PASS.

**Step 5: Commit**

```bash
git add apps/api/app/services/storage.py apps/api/tests/test_storage_service.py
git commit -m "feat(api): add local storage service"
```

---

### Task 4: Mock OCR Pipeline

**Files:**
- Create: `apps/api/app/services/mock_pipeline.py`
- Create: `apps/api/tests/test_mock_pipeline.py`

**Step 1: Write failing pipeline test**

Create `apps/api/tests/test_mock_pipeline.py`:

```python
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
```

**Step 2: Run test to verify it fails**

Run:

```bash
cd apps/api
python -m pytest tests/test_mock_pipeline.py -v
```

Expected: FAIL because `MockOcrPipeline` does not exist.

**Step 3: Implement mock pipeline**

Create `apps/api/app/services/mock_pipeline.py`:

```python
from dataclasses import dataclass

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
from app.schemas.job import JobMode, QualityItem, QualityPolicy, QualityReport


@dataclass(frozen=True)
class PipelineResult:
    document: ProblemDocument
    quality_report: QualityReport


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
                    severity="info",
                    category="mock_pipeline",
                    message="Mock OCR pipeline generated a placeholder document.",
                    target={"job_id": job_id},
                )
            ]
        )
        return PipelineResult(document=document, quality_report=report)
```

**Step 4: Run pipeline tests**

Run:

```bash
cd apps/api
python -m pytest tests/test_mock_pipeline.py -v
```

Expected: PASS.

**Step 5: Commit**

```bash
git add apps/api/app/services/mock_pipeline.py apps/api/tests/test_mock_pipeline.py
git commit -m "feat(api): add mock OCR pipeline"
```

---

### Task 5: In-Memory Repository for MVP Flow

**Files:**
- Create: `apps/api/app/services/repository.py`
- Create: `apps/api/tests/test_repository.py`

**Step 1: Write failing repository tests**

Create `apps/api/tests/test_repository.py`:

```python
from app.schemas.job import JobMode, JobRead, JobStatus, QualityPolicy
from app.services.repository import InMemoryRepository


def test_repository_stores_job_and_document_versions():
    repo = InMemoryRepository()
    job = JobRead(
        job_id="job_1",
        mode=JobMode.AUTO,
        quality_policy=QualityPolicy.REPORT_ONLY,
        status=JobStatus.QUEUED,
        progress=0,
    )

    repo.save_job(job)
    repo.set_document(job_id="job_1", document={"document_version": 1})

    assert repo.get_job("job_1").status == JobStatus.QUEUED
    assert repo.get_document("job_1") == {"document_version": 1}
```

**Step 2: Run test to verify it fails**

Run:

```bash
cd apps/api
python -m pytest tests/test_repository.py -v
```

Expected: FAIL because repository does not exist.

**Step 3: Implement in-memory repository**

Create `apps/api/app/services/repository.py`:

```python
from app.schemas.export import ExportArtifact
from app.schemas.job import JobRead, QualityReport
from app.schemas.review_issue import ReviewIssueRead


class InMemoryRepository:
    def __init__(self):
        self.jobs: dict[str, JobRead] = {}
        self.documents: dict[str, dict] = {}
        self.quality_reports: dict[str, QualityReport] = {}
        self.exports: dict[str, ExportArtifact] = {}
        self.review_issues: dict[str, ReviewIssueRead] = {}

    def save_job(self, job: JobRead) -> JobRead:
        self.jobs[job.job_id] = job
        return job

    def get_job(self, job_id: str) -> JobRead | None:
        return self.jobs.get(job_id)

    def set_document(self, job_id: str, document: dict) -> None:
        self.documents[job_id] = document

    def get_document(self, job_id: str) -> dict | None:
        return self.documents.get(job_id)

    def set_quality_report(self, job_id: str, report: QualityReport) -> None:
        self.quality_reports[job_id] = report

    def get_quality_report(self, job_id: str) -> QualityReport | None:
        return self.quality_reports.get(job_id)

    def save_export(self, artifact: ExportArtifact) -> ExportArtifact:
        self.exports[artifact.export_id] = artifact
        return artifact

    def get_export(self, export_id: str) -> ExportArtifact | None:
        return self.exports.get(export_id)

    def save_review_issue(self, issue: ReviewIssueRead) -> ReviewIssueRead:
        self.review_issues[issue.issue_id] = issue
        return issue

    def list_review_issues(self) -> list[ReviewIssueRead]:
        return list(self.review_issues.values())
```

**Step 4: Run repository tests**

Run:

```bash
cd apps/api
python -m pytest tests/test_repository.py -v
```

Expected: PASS.

**Step 5: Commit**

```bash
git add apps/api/app/services/repository.py apps/api/tests/test_repository.py
git commit -m "feat(api): add MVP repository"
```

---

### Task 6: Job API with Upload and Mock Completion

**Files:**
- Create: `apps/api/app/api/__init__.py`
- Create: `apps/api/app/api/jobs.py`
- Modify: `apps/api/app/main.py`
- Test: `apps/api/tests/test_jobs_api.py`

**Step 1: Write failing API test**

Create `apps/api/tests/test_jobs_api.py`:

```python
from fastapi.testclient import TestClient

from app.main import app


def test_create_job_uploads_image_and_returns_completed_document():
    client = TestClient(app)

    response = client.post(
        "/api/jobs",
        data={"mode": "auto", "quality_policy": "report_only"},
        files={"file": ("exercise.png", b"fake-image", "image/png")},
    )

    assert response.status_code == 201
    job = response.json()
    assert job["status"] == "completed"
    assert job["latest_document_version"] == 1

    document_response = client.get(f"/api/jobs/{job['job_id']}/document")
    assert document_response.status_code == 200
    assert document_response.json()["schema_version"] == "1.0"
```

**Step 2: Run test to verify it fails**

Run:

```bash
cd apps/api
python -m pytest tests/test_jobs_api.py -v
```

Expected: FAIL because `/api/jobs` does not exist.

**Step 3: Implement jobs router**

Create `apps/api/app/api/__init__.py`:

```python
"""API routers."""
```

Create `apps/api/app/api/jobs.py`:

```python
from uuid import uuid4

from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status

from app.core.config import get_settings
from app.schemas.job import JobMode, JobRead, JobStatus, QualityPolicy
from app.services.mock_pipeline import MockOcrPipeline
from app.services.repository import InMemoryRepository
from app.services.storage import LocalStorage

router = APIRouter(prefix="/jobs", tags=["jobs"])
repo = InMemoryRepository()


@router.post("", response_model=JobRead, status_code=status.HTTP_201_CREATED)
async def create_job(
    file: UploadFile = File(...),
    mode: JobMode = Form(JobMode.AUTO),
    quality_policy: QualityPolicy = Form(QualityPolicy.REPORT_ONLY),
) -> JobRead:
    settings = get_settings()
    storage = LocalStorage(settings.storage_root)
    content = await file.read()
    filename = storage.unique_name(file.filename or "upload.png")
    stored = storage.write_bytes("uploads", filename, content)

    job_id = f"job_{uuid4().hex}"
    source_image_id = f"src_{uuid4().hex}"
    job = JobRead(
        job_id=job_id,
        mode=mode,
        quality_policy=quality_policy,
        status=JobStatus.QUEUED,
        progress=0,
        source_image_id=source_image_id,
    )
    repo.save_job(job)

    result = MockOcrPipeline().run(
        job_id=job_id,
        source_image_id=source_image_id,
        source_filename=file.filename or filename,
        source_path=stored.relative_path,
        mode=mode,
        quality_policy=quality_policy,
    )
    repo.set_document(job_id, result.document.model_dump(mode="json"))
    repo.set_quality_report(job_id, result.quality_report)

    completed = job.model_copy(
        update={
            "status": JobStatus.COMPLETED,
            "progress": 1,
            "latest_document_version": result.document.document_version,
            "quality_summary": {"info": len(result.quality_report.items)},
        }
    )
    repo.save_job(completed)
    return completed


@router.get("/{job_id}", response_model=JobRead)
def get_job(job_id: str) -> JobRead:
    job = repo.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="job not found")
    return job


@router.get("/{job_id}/document")
def get_document(job_id: str) -> dict:
    document = repo.get_document(job_id)
    if not document:
        raise HTTPException(status_code=404, detail="document not found")
    return document
```

Modify `apps/api/app/main.py`:

```python
from fastapi import FastAPI

from app.api.jobs import router as jobs_router
from app.core.config import get_settings

settings = get_settings()

app = FastAPI(title="easy-OCR API")
app.include_router(jobs_router, prefix=settings.api_prefix)


@app.get(f"{settings.api_prefix}/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": settings.service_name}
```

**Step 4: Run API tests**

Run:

```bash
cd apps/api
python -m pytest tests/test_jobs_api.py tests/test_health.py -v
```

Expected: PASS.

**Step 5: Commit**

```bash
git add apps/api/app/api apps/api/app/main.py apps/api/tests/test_jobs_api.py
git commit -m "feat(api): add job upload flow"
```

---

### Task 7: Export Renderer Registry with Markdown and HTML

**Files:**
- Create: `apps/api/app/renderers/__init__.py`
- Create: `apps/api/app/renderers/base.py`
- Create: `apps/api/app/renderers/markdown.py`
- Create: `apps/api/app/renderers/html.py`
- Create: `apps/api/app/renderers/registry.py`
- Create: `apps/api/tests/test_renderers.py`

**Step 1: Write failing renderer tests**

Create `apps/api/tests/test_renderers.py`:

```python
from app.renderers.registry import build_default_registry
from app.schemas.document import ProblemDocument
from app.services.mock_pipeline import MockOcrPipeline
from app.schemas.job import JobMode, QualityPolicy


def _document() -> ProblemDocument:
    return MockOcrPipeline().run(
        job_id="job_1",
        source_image_id="src_1",
        source_filename="exercise.png",
        source_path="uploads/exercise.png",
        mode=JobMode.AUTO,
        quality_policy=QualityPolicy.REPORT_ONLY,
    ).document


def test_markdown_renderer_preserves_text_formula_and_figure_ref():
    registry = build_default_registry()

    output = registry.get("markdown").render_to_string(_document())

    assert "如图所示" in output
    assert "$$x^2 + 2x + 1 = 0$$" in output
    assert "fig_job_1_1" in output


def test_html_renderer_outputs_semantic_html():
    registry = build_default_registry()

    output = registry.get("html").render_to_string(_document())

    assert "<article" in output
    assert "data-figure-id=\"fig_job_1_1\"" in output
```

**Step 2: Run tests to verify they fail**

Run:

```bash
cd apps/api
python -m pytest tests/test_renderers.py -v
```

Expected: FAIL because renderer modules do not exist.

**Step 3: Implement renderers**

Create `apps/api/app/renderers/__init__.py`:

```python
"""Export renderers."""
```

Create `apps/api/app/renderers/base.py`:

```python
from typing import Protocol

from app.schemas.document import ProblemDocument


class Renderer(Protocol):
    format: str
    mime_type: str
    file_extension: str

    def render_to_string(self, document: ProblemDocument) -> str:
        ...
```

Create `apps/api/app/renderers/markdown.py`:

```python
from app.schemas.document import (
    BlockType,
    ChoicesBlock,
    FigureRefBlock,
    FormulaBlock,
    ProblemDocument,
    TextBlock,
    UnknownBlock,
)


class MarkdownRenderer:
    format = "markdown"
    mime_type = "text/markdown"
    file_extension = "md"

    def render_to_string(self, document: ProblemDocument) -> str:
        lines: list[str] = [f"<!-- document_version: {document.document_version} -->"]
        for problem in document.problems:
            lines.append(f"\n## {problem.problem_id}\n")
            for block in problem.blocks:
                lines.extend(self._render_block(block))
        return "\n".join(lines).strip() + "\n"

    def _render_block(self, block) -> list[str]:
        if isinstance(block, TextBlock):
            return [block.text, ""]
        if isinstance(block, FormulaBlock):
            return [f"$${block.latex}$$" if block.display else f"${block.latex}$", ""]
        if isinstance(block, FigureRefBlock):
            return [f"![{block.figure_id}]({block.figure_id})", ""]
        if isinstance(block, ChoicesBlock):
            return [f"- {item.label}. " + " ".join(self._inline(child) for child in item.blocks) for item in block.items]
        if isinstance(block, UnknownBlock):
            return [block.raw_text, ""]
        if getattr(block, "type", None) == BlockType.TABLE:
            return ["<!-- table block not yet rendered -->", ""]
        return ["<!-- unsupported block -->", ""]

    def _inline(self, block) -> str:
        if isinstance(block, TextBlock):
            return block.text
        if isinstance(block, FormulaBlock):
            return f"${block.latex}$"
        return ""
```

Create `apps/api/app/renderers/html.py`:

```python
from html import escape

from app.schemas.document import FigureRefBlock, FormulaBlock, ProblemDocument, TextBlock, UnknownBlock


class HtmlRenderer:
    format = "html"
    mime_type = "text/html"
    file_extension = "html"

    def render_to_string(self, document: ProblemDocument) -> str:
        body: list[str] = [
            "<!doctype html>",
            "<html>",
            "<body>",
            f"<main data-document-version=\"{document.document_version}\">",
        ]
        for problem in document.problems:
            body.append(f"<article data-problem-id=\"{escape(problem.problem_id)}\">")
            for block in problem.blocks:
                body.append(self._render_block(block))
            body.append("</article>")
        body.extend(["</main>", "</body>", "</html>"])
        return "\n".join(body)

    def _render_block(self, block) -> str:
        if isinstance(block, TextBlock):
            return f"<p>{escape(block.text)}</p>"
        if isinstance(block, FormulaBlock):
            tag = "div" if block.display else "span"
            return f"<{tag} class=\"formula\">{escape(block.latex)}</{tag}>"
        if isinstance(block, FigureRefBlock):
            figure_id = escape(block.figure_id)
            return f"<figure data-figure-id=\"{figure_id}\"></figure>"
        if isinstance(block, UnknownBlock):
            return f"<pre>{escape(block.raw_text)}</pre>"
        return "<!-- unsupported block -->"
```

Create `apps/api/app/renderers/registry.py`:

```python
from app.renderers.html import HtmlRenderer
from app.renderers.markdown import MarkdownRenderer


class RendererRegistry:
    def __init__(self):
        self._renderers = {}

    def register(self, renderer) -> None:
        self._renderers[renderer.format] = renderer

    def get(self, format_name: str):
        try:
            return self._renderers[format_name]
        except KeyError as exc:
            raise ValueError(f"unsupported export format: {format_name}") from exc

    def list_formats(self) -> list[dict[str, str]]:
        return [
            {
                "format": renderer.format,
                "mime_type": renderer.mime_type,
                "file_extension": renderer.file_extension,
            }
            for renderer in self._renderers.values()
        ]


def build_default_registry() -> RendererRegistry:
    registry = RendererRegistry()
    registry.register(MarkdownRenderer())
    registry.register(HtmlRenderer())
    return registry
```

**Step 4: Run renderer tests**

Run:

```bash
cd apps/api
python -m pytest tests/test_renderers.py -v
```

Expected: PASS.

**Step 5: Commit**

```bash
git add apps/api/app/renderers apps/api/tests/test_renderers.py
git commit -m "feat(api): add markdown and html renderers"
```

---

### Task 8: Export API

**Files:**
- Create: `apps/api/app/api/exports.py`
- Modify: `apps/api/app/main.py`
- Test: `apps/api/tests/test_exports_api.py`

**Step 1: Write failing export API test**

Create `apps/api/tests/test_exports_api.py`:

```python
from fastapi.testclient import TestClient

from app.main import app


def test_export_markdown_from_job_document():
    client = TestClient(app)
    job_response = client.post(
        "/api/jobs",
        files={"file": ("exercise.png", b"fake-image", "image/png")},
    )
    job_id = job_response.json()["job_id"]

    export_response = client.post(
        f"/api/jobs/{job_id}/exports",
        json={"format": "markdown", "options": {"figure_mode": "selected"}},
    )

    assert export_response.status_code == 201
    artifact = export_response.json()
    assert artifact["format"] == "markdown"
    assert artifact["file_extension"] == "md"


def test_list_export_formats():
    client = TestClient(app)

    response = client.get("/api/export-formats")

    assert response.status_code == 200
    assert {"format": "markdown", "mime_type": "text/markdown", "file_extension": "md"} in response.json()
```

**Step 2: Run test to verify it fails**

Run:

```bash
cd apps/api
python -m pytest tests/test_exports_api.py -v
```

Expected: FAIL because export endpoints do not exist.

**Step 3: Implement export router**

Create `apps/api/app/api/exports.py`:

```python
from uuid import uuid4

from fastapi import APIRouter, HTTPException, status

from app.api.jobs import repo
from app.core.config import get_settings
from app.renderers.registry import build_default_registry
from app.schemas.document import ProblemDocument
from app.schemas.export import ExportArtifact, ExportRequest
from app.services.storage import LocalStorage

router = APIRouter(tags=["exports"])


@router.get("/export-formats")
def list_export_formats() -> list[dict[str, str]]:
    return build_default_registry().list_formats()


@router.post("/jobs/{job_id}/exports", response_model=ExportArtifact, status_code=status.HTTP_201_CREATED)
def create_export(job_id: str, request: ExportRequest) -> ExportArtifact:
    document_payload = repo.get_document(job_id)
    if not document_payload:
        raise HTTPException(status_code=404, detail="document not found")

    document = ProblemDocument.model_validate(document_payload)
    registry = build_default_registry()
    try:
        renderer = registry.get(request.format)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    content = renderer.render_to_string(document)
    export_id = f"export_{uuid4().hex}"
    filename = f"{export_id}.{renderer.file_extension}"
    stored = LocalStorage(get_settings().storage_root).write_bytes(
        "exports",
        filename,
        content.encode("utf-8"),
    )
    artifact = ExportArtifact(
        export_id=export_id,
        job_id=job_id,
        document_version=document.document_version,
        format=renderer.format,
        mime_type=renderer.mime_type,
        file_extension=renderer.file_extension,
        path=stored.relative_path,
    )
    repo.save_export(artifact)
    return artifact
```

Modify `apps/api/app/main.py`:

```python
from fastapi import FastAPI

from app.api.exports import router as exports_router
from app.api.jobs import router as jobs_router
from app.core.config import get_settings

settings = get_settings()

app = FastAPI(title="easy-OCR API")
app.include_router(jobs_router, prefix=settings.api_prefix)
app.include_router(exports_router, prefix=settings.api_prefix)


@app.get(f"{settings.api_prefix}/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": settings.service_name}
```

**Step 4: Run export API tests**

Run:

```bash
cd apps/api
python -m pytest tests/test_exports_api.py tests/test_jobs_api.py -v
```

Expected: PASS.

**Step 5: Commit**

```bash
git add apps/api/app/api/exports.py apps/api/app/main.py apps/api/tests/test_exports_api.py
git commit -m "feat(api): add export endpoints"
```

---

### Task 9: Review Issue API

**Files:**
- Create: `apps/api/app/api/review_issues.py`
- Modify: `apps/api/app/main.py`
- Test: `apps/api/tests/test_review_issues_api.py`

**Step 1: Write failing issue API test**

Create `apps/api/tests/test_review_issues_api.py`:

```python
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
            "block_path": "problems[0].blocks[1]",
            "labels": ["formula", "regression-candidate"],
        },
    )

    assert create_response.status_code == 201
    issue = create_response.json()
    assert issue["status"] == "open"
    assert issue["issue_type"] == "formula_error"

    list_response = client.get("/api/review-issues")
    assert list_response.status_code == 200
    assert any(item["issue_id"] == issue["issue_id"] for item in list_response.json())
```

**Step 2: Run test to verify it fails**

Run:

```bash
cd apps/api
python -m pytest tests/test_review_issues_api.py -v
```

Expected: FAIL because issue endpoints do not exist.

**Step 3: Implement review issue router**

Create `apps/api/app/api/review_issues.py`:

```python
from uuid import uuid4

from fastapi import APIRouter, status

from app.api.jobs import repo
from app.schemas.review_issue import ReviewIssueCreate, ReviewIssueRead, ReviewIssueStatus

router = APIRouter(prefix="/review-issues", tags=["review-issues"])


@router.post("", response_model=ReviewIssueRead, status_code=status.HTTP_201_CREATED)
def create_review_issue(payload: ReviewIssueCreate) -> ReviewIssueRead:
    issue = ReviewIssueRead(
        **payload.model_dump(),
        issue_id=f"issue_{uuid4().hex}",
        status=ReviewIssueStatus.OPEN,
    )
    return repo.save_review_issue(issue)


@router.get("", response_model=list[ReviewIssueRead])
def list_review_issues() -> list[ReviewIssueRead]:
    return repo.list_review_issues()
```

Modify `apps/api/app/main.py`:

```python
from fastapi import FastAPI

from app.api.exports import router as exports_router
from app.api.jobs import router as jobs_router
from app.api.review_issues import router as review_issues_router
from app.core.config import get_settings

settings = get_settings()

app = FastAPI(title="easy-OCR API")
app.include_router(jobs_router, prefix=settings.api_prefix)
app.include_router(exports_router, prefix=settings.api_prefix)
app.include_router(review_issues_router, prefix=settings.api_prefix)


@app.get(f"{settings.api_prefix}/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": settings.service_name}
```

**Step 4: Run issue API tests**

Run:

```bash
cd apps/api
python -m pytest tests/test_review_issues_api.py -v
```

Expected: PASS.

**Step 5: Commit**

```bash
git add apps/api/app/api/review_issues.py apps/api/app/main.py apps/api/tests/test_review_issues_api.py
git commit -m "feat(api): add review issue endpoints"
```

---

### Task 10: LiteLLM Model Client Boundary

**Files:**
- Create: `apps/api/app/services/model_client.py`
- Create: `apps/api/tests/test_model_client.py`
- Modify: `apps/api/app/core/config.py`
- Create: `apps/api/.env.example`

**Step 1: Write failing model-client tests**

Create `apps/api/tests/test_model_client.py`:

```python
from app.services.model_client import ModelRoleConfig, NoopModelClient


def test_noop_model_client_exposes_roles_without_provider_lock_in():
    client = NoopModelClient(
        roles={
            "vision_ocr": ModelRoleConfig(model="", api_base=""),
            "structure": ModelRoleConfig(model="", api_base=""),
        }
    )

    assert client.role("vision_ocr").model == ""
    assert client.role("structure").api_base == ""
```

**Step 2: Run test to verify it fails**

Run:

```bash
cd apps/api
python -m pytest tests/test_model_client.py -v
```

Expected: FAIL because `model_client` does not exist.

**Step 3: Implement model-client boundary**

Create `apps/api/app/services/model_client.py`:

```python
from dataclasses import dataclass
from typing import Protocol


@dataclass(frozen=True)
class ModelRoleConfig:
    model: str
    api_base: str = ""


class ModelClient(Protocol):
    def role(self, name: str) -> ModelRoleConfig:
        ...


class NoopModelClient:
    def __init__(self, roles: dict[str, ModelRoleConfig]):
        self._roles = roles

    def role(self, name: str) -> ModelRoleConfig:
        return self._roles[name]
```

Modify `apps/api/app/core/config.py` to expose role env vars:

```python
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    service_name: str = "easy-ocr-api"
    api_prefix: str = "/api"
    database_url: str = "sqlite:///./easy_ocr.sqlite3"
    storage_root: str = "../../storage"
    vision_ocr_model: str = ""
    structure_model: str = ""
    figure_quality_model: str = ""
    figure_enhance_model: str = ""

    model_config = SettingsConfigDict(env_file=".env", env_prefix="EASY_OCR_")


@lru_cache
def get_settings() -> Settings:
    return Settings()
```

Create `apps/api/.env.example`:

```bash
EASY_OCR_STORAGE_ROOT=../../storage
EASY_OCR_DATABASE_URL=sqlite:///./easy_ocr.sqlite3
EASY_OCR_VISION_OCR_MODEL=
EASY_OCR_STRUCTURE_MODEL=
EASY_OCR_FIGURE_QUALITY_MODEL=
EASY_OCR_FIGURE_ENHANCE_MODEL=

# Provider-specific keys are read by LiteLLM. Keep real values in .env only.
# OPENAI_API_KEY=
# GEMINI_API_KEY=
# ANTHROPIC_API_KEY=
```

**Step 4: Run model-client tests**

Run:

```bash
cd apps/api
python -m pytest tests/test_model_client.py tests/test_health.py -v
```

Expected: PASS.

**Step 5: Commit**

```bash
git add apps/api/app/services/model_client.py apps/api/app/core/config.py apps/api/.env.example apps/api/tests/test_model_client.py
git commit -m "feat(api): add LiteLLM model client boundary"
```

---

### Task 11: Backend Full Test Pass and API Documentation Update

**Files:**
- Modify: `README.md`
- Modify: `apps/api/README.md`

**Step 1: Run all backend tests**

Run:

```bash
cd apps/api
python -m pytest -v
```

Expected: all tests PASS.

**Step 2: Add API usage docs**

Modify `README.md` to include:

```markdown
## MVP API Flow

```bash
cd apps/api
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
uvicorn app.main:app --reload
```

Open `http://127.0.0.1:8000/docs`.
```

Modify `apps/api/README.md` to include example curl commands:

```markdown
## Example

```bash
curl -X POST http://127.0.0.1:8000/api/jobs \
  -F mode=auto \
  -F quality_policy=report_only \
  -F file=@sample.png
```
```

**Step 3: Run docs-adjacent check**

Run:

```bash
git diff -- README.md apps/api/README.md
```

Expected: docs describe how to install, run, and try the API.

**Step 4: Commit**

```bash
git add README.md apps/api/README.md
git commit -m "docs: document MVP API flow"
```

---

### Task 12: Frontend Project Skeleton

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/next.config.ts`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/app/layout.tsx`
- Create: `apps/web/app/page.tsx`
- Create: `apps/web/lib/api.ts`
- Create: `apps/web/README.md`

**Step 1: Create package manifest**

Create `apps/web/package.json`:

```json
{
  "name": "easy-ocr-web",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "lint": "next lint"
  },
  "dependencies": {
    "@tanstack/react-query": "^5.59.0",
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "typescript": "^5.6.0"
  }
}
```

Create `apps/web/next.config.ts`:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {};

export default nextConfig;
```

Create `apps/web/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

**Step 2: Implement first page**

Create `apps/web/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "easy-OCR Debug Console",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

Create `apps/web/app/styles.css`:

```css
:root {
  color-scheme: light;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

body {
  margin: 0;
  background: #f7f8fb;
  color: #18202f;
}

main {
  min-height: 100vh;
  padding: 24px;
}

.workspace {
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr) 360px;
  gap: 16px;
}

.panel {
  background: #ffffff;
  border: 1px solid #dfe4ee;
  border-radius: 8px;
  padding: 16px;
}

pre {
  overflow: auto;
  white-space: pre-wrap;
}
```

Create `apps/web/lib/api.ts`:

```ts
export const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://127.0.0.1:8000/api";
```

Create `apps/web/app/page.tsx`:

```tsx
export default function HomePage() {
  return (
    <main>
      <h1>easy-OCR Debug Console</h1>
      <section className="workspace">
        <aside className="panel">
          <h2>Upload</h2>
          <input type="file" accept="image/*" />
        </aside>
        <section className="panel">
          <h2>Document Preview</h2>
          <p>No job loaded.</p>
        </section>
        <aside className="panel">
          <h2>JSON and Issues</h2>
          <pre>{JSON.stringify({ status: "idle" }, null, 2)}</pre>
        </aside>
      </section>
    </main>
  );
}
```

Create `apps/web/README.md`:

```markdown
# easy-OCR Web

Next.js debugging console for the easy-OCR API.

```bash
cd apps/web
npm install
npm run dev
```
```

**Step 3: Install and build**

Run:

```bash
cd apps/web
npm install
npm run build
```

Expected: build succeeds.

**Step 4: Commit**

```bash
git add apps/web package-lock.json
git commit -m "feat(web): add Next.js debug console skeleton"
```

If npm creates `apps/web/package-lock.json` instead of root `package-lock.json`, add that path.

---

### Task 13: Frontend Upload Flow

**Files:**
- Modify: `apps/web/app/page.tsx`
- Modify: `apps/web/lib/api.ts`

**Step 1: Add API client functions**

Modify `apps/web/lib/api.ts`:

```ts
export const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://127.0.0.1:8000/api";

export type Job = {
  job_id: string;
  mode: string;
  quality_policy: string;
  status: string;
  progress: number;
  latest_document_version?: number;
  quality_summary: Record<string, unknown>;
};

export async function createJob(file: File): Promise<Job> {
  const form = new FormData();
  form.append("mode", "debug");
  form.append("quality_policy", "report_only");
  form.append("file", file);

  const response = await fetch(`${API_BASE}/jobs`, {
    method: "POST",
    body: form,
  });
  if (!response.ok) {
    throw new Error(`Failed to create job: ${response.status}`);
  }
  return response.json();
}

export async function getDocument(jobId: string): Promise<unknown> {
  const response = await fetch(`${API_BASE}/jobs/${jobId}/document`);
  if (!response.ok) {
    throw new Error(`Failed to load document: ${response.status}`);
  }
  return response.json();
}
```

**Step 2: Wire upload in page**

Modify `apps/web/app/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { createJob, getDocument, type Job } from "@/lib/api";

export default function HomePage() {
  const [job, setJob] = useState<Job | null>(null);
  const [document, setDocument] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | null) {
    if (!file) return;
    setError(null);
    const created = await createJob(file);
    setJob(created);
    setDocument(await getDocument(created.job_id));
  }

  return (
    <main>
      <h1>easy-OCR Debug Console</h1>
      <section className="workspace">
        <aside className="panel">
          <h2>Upload</h2>
          <input
            type="file"
            accept="image/*"
            onChange={(event) => {
              handleFile(event.target.files?.[0] ?? null).catch((caught) => {
                setError(caught instanceof Error ? caught.message : "Unknown upload error");
              });
            }}
          />
          {job ? <p>Status: {job.status}</p> : null}
          {error ? <p role="alert">{error}</p> : null}
        </aside>
        <section className="panel">
          <h2>Document Preview</h2>
          {document ? <pre>{JSON.stringify(document, null, 2)}</pre> : <p>No job loaded.</p>}
        </section>
        <aside className="panel">
          <h2>JSON and Issues</h2>
          <pre>{JSON.stringify({ job }, null, 2)}</pre>
        </aside>
      </section>
    </main>
  );
}
```

**Step 3: Build frontend**

Run:

```bash
cd apps/web
npm run build
```

Expected: build succeeds.

**Step 4: Commit**

```bash
git add apps/web/app/page.tsx apps/web/lib/api.ts
git commit -m "feat(web): add upload debug flow"
```

---

### Task 14: Manual End-to-End Smoke Test

**Files:**
- Modify: `README.md`

**Step 1: Start backend**

Run:

```bash
cd apps/api
uvicorn app.main:app --reload
```

Expected: API starts on `http://127.0.0.1:8000`.

**Step 2: Start frontend**

Run in another terminal:

```bash
cd apps/web
NEXT_PUBLIC_API_BASE=http://127.0.0.1:8000/api npm run dev
```

Expected: web app starts on `http://127.0.0.1:3000`.

**Step 3: Test upload manually**

Open `http://127.0.0.1:3000`, upload any small PNG or JPG, and verify:

- Job status becomes `completed`.
- JSON preview shows `schema_version: "1.0"`.
- Document contains at least one problem and one figure asset.

**Step 4: Test API export manually**

Run:

```bash
curl -X POST http://127.0.0.1:8000/api/jobs \
  -F mode=auto \
  -F quality_policy=report_only \
  -F file=@sample.png
```

Copy the returned `job_id`, then run:

```bash
curl -X POST http://127.0.0.1:8000/api/jobs/<job_id>/exports \
  -H "Content-Type: application/json" \
  -d '{"format":"markdown","options":{"figure_mode":"selected"}}'
```

Expected: export artifact is returned with `format: "markdown"`.

**Step 5: Update README smoke-test section**

Add:

```markdown
## MVP Smoke Test

1. Start the API from `apps/api`.
2. Start the web console from `apps/web`.
3. Upload an image.
4. Confirm the job completes and the document JSON contains `schema_version`, `document_version`, `problems`, and `assets`.
5. Create a Markdown or HTML export through the API.
```

**Step 6: Commit**

```bash
git add README.md
git commit -m "docs: add MVP smoke test"
```

---

### Task 15: Final Verification and Push

**Files:**
- No new files expected unless fixes are needed.

**Step 1: Run backend tests**

Run:

```bash
cd apps/api
python -m pytest -v
```

Expected: all backend tests PASS.

**Step 2: Build frontend**

Run:

```bash
cd apps/web
npm run build
```

Expected: build succeeds.

**Step 3: Check git status**

Run:

```bash
git status --short
```

Expected: clean working tree.

If files are uncommitted because of final fixes, commit them:

```bash
git add <files>
git commit -m "chore: finalize MVP scaffold"
```

**Step 4: Push**

Run:

```bash
git push
```

Expected: branch `main` pushes to `origin/main`.

---

## Out of Scope for This Plan

- Real OCR provider integration.
- Real layout detection and figure cropping.
- AI figure enhancement or redrawing.
- Persistent SQLModel database tables.
- Authentication and multi-user permissions.
- DOCX and LaTeX renderers.
- Batch paper splitting.

Those should become separate plans after the API and debug console can run end to end.
