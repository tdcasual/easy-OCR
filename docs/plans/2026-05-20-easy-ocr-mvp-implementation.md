# easy-OCR MVP Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the first API-first MVP for easy-OCR: a FastAPI backend with schema-valid mock OCR jobs, extensible exports, review issues, LiteLLM model-client boundaries, and a Next.js debugging console.

**Architecture:** The backend owns the canonical `ProblemDocument`, job lifecycle, storage, exports, model-call logs, and review issues. The frontend is a debugging and review console that calls the API, shows job state, previews documents/assets/exports, and creates issues. The first implementation uses a mock OCR pipeline and local storage so the whole product flow works before real OCR and figure detection are added.

**Tech Stack:** Python 3.11+, FastAPI, Pydantic v2, SQLModel, SQLite, pytest, httpx, LiteLLM, Node.js, Next.js 16, React 19, TypeScript, Tailwind CSS v3, TanStack Query, Playwright for visual smoke tests.

---

## Ground Rules

- Follow TDD for backend behavior: write a failing test, run it, implement the smallest passing code, rerun it, commit.
- Keep the first pipeline mocked. Do not integrate real OCR providers until the API, schema, storage, renderer, and review loops work.
- Do not commit uploaded images, generated assets, exports, local databases, logs, `.env`, or provider secrets.
- Preserve the existing design document: `docs/plans/2026-05-20-ocr-exercise-api-design.md`.
- Use `schema_version` and `document_version` from the beginning.
- Prefer explicit warnings and quality reports over hidden failures.
- Every commit should leave tests passing for the area touched.
- The frontend must follow the supplied console mockup: it is a dense engineering console, not a marketing page or a simple upload demo.
- Use a refined operational-tool aesthetic: light surface, compact navigation, status chips, timeline diagnostics, strong scanning hierarchy, and stable pane dimensions.
- The frontend must support Simplified Chinese and English from the first implementation pass.
- The frontend must support light and dark themes from the first implementation pass.
- Do not write a large hand-authored CSS theme. Use Tailwind CSS utilities, semantic Tailwind tokens, and a small `globals.css` containing only Tailwind directives and base document rules.
- Do not hard-code display strings directly in UI components. Route visible copy through the i18n dictionary unless it is OCR sample content.
- Do not use `next lint`; it is removed in Next.js 16. Use `tsc --noEmit` and `next build` as the MVP frontend verification commands.
- Use Tailwind CSS v3 setup for this MVP: `tailwindcss@3`, `postcss`, `autoprefixer`, `tailwind.config.ts`, and Tailwind directives in `globals.css`.

## Frontend Reference Requirements

The supplied mockup changes the frontend target from "basic debug page" to "OCR Exercise Console". Treat this as the visual and UX reference for the first real frontend pass.

Required top-level navigation:

```text
Dashboard
Jobs
Create Job
Issues
Exports
Models
Settings
```

Required job-detail layout:

```text
top: app nav, debug-mode selector, model readiness chip, notifications, user menu
subtop: back link, job title, status chip, created time, mode, quality policy
center top: pipeline progress stepper
left column: source image viewer, bbox overlay controls, figure crops, image info
middle column: structured preview and edit tab, document version selector, fullscreen action
right column: tabbed diagnostics, quality summary, risk level, top issues
footer: schema version, document version, renderer versions, storage/API connection status
```

Required diagnostics tabs:

```text
JSON
Model Calls
Exports
Quality Report
Issues
Assets
```

Required visual behavior:

- The source image panel must show colored OCR regions for text, formula, figure, low confidence, and unknown.
- Figure crops must show selected state, score, and a "New Crop" affordance.
- The structured preview must render problem cards with text blocks, figure blocks, options, confidence, and low-confidence chips.
- Model calls must show role, model name, prompt version, input asset, status, token count, latency, and warning/error messages.
- Quality summary must show severity counts and risk level.
- The layout must remain usable at desktop sizes first; mobile can collapse columns later, but text must not overlap.
- The theme toggle must switch between light and dark mode without rebuilding the app.
- The language toggle must switch between Chinese and English labels without changing OCR content.
- Component styling must use Tailwind classes such as `bg-surface`, `text-foreground`, `border-border`, `text-muted`, and `bg-success-soft`, backed by `tailwind.config.ts`.

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
      console/
      layout/
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

## Audit Notes Before Execution

- This plan was audited after the frontend mockup and later i18n/theme/Tailwind requirements were added.
- Frontend verification intentionally uses `npm run typecheck` and `npm run build`, not `next lint`.
- Tailwind is pinned to the v3 configuration path to keep `tailwind.config.ts` and `postcss.config.mjs` straightforward for the MVP.
- Next.js is specified as v16 with React 19. If package installation fails due to registry timing, use the latest stable Next.js 15/16 pair that supports React 19, then update this plan and commit the lockfile.
- Pydantic recursive block schemas require `model_rebuild()` calls in `document.py`.
- Mock data may contain OCR sample text directly; application UI labels must come from `lib/i18n.ts`.
- The repository in this early stage may not have a dedicated worktree yet. If executing directly on `main`, commit after every task as written and push only after verification.

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

````markdown
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
````

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


ChoiceItem.model_rebuild()
ChoicesBlock.model_rebuild()
Problem.model_rebuild()
ProblemDocument.model_rebuild()
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

### Task 11: Job Console Support APIs

**Files:**
- Modify: `apps/api/app/schemas/job.py`
- Modify: `apps/api/app/services/mock_pipeline.py`
- Modify: `apps/api/app/services/repository.py`
- Modify: `apps/api/app/api/jobs.py`
- Create: `apps/api/tests/test_console_support_api.py`

**Step 1: Write failing console support API tests**

Create `apps/api/tests/test_console_support_api.py`:

```python
from fastapi.testclient import TestClient

from app.main import app


def _create_job(client: TestClient) -> str:
    response = client.post(
        "/api/jobs",
        data={"mode": "debug", "quality_policy": "report_only"},
        files={"file": ("question_001.png", b"fake-image", "image/png")},
    )
    assert response.status_code == 201
    return response.json()["job_id"]


def test_job_console_support_endpoints_return_mock_diagnostics():
    client = TestClient(app)
    job_id = _create_job(client)

    assets = client.get(f"/api/jobs/{job_id}/assets")
    assert assets.status_code == 200
    assert assets.json()[0]["figure_id"].startswith("fig_")

    quality = client.get(f"/api/jobs/{job_id}/quality-report")
    assert quality.status_code == 200
    assert quality.json()["items"][0]["category"] == "mock_pipeline"

    model_calls = client.get(f"/api/jobs/{job_id}/model-calls")
    assert model_calls.status_code == 200
    assert model_calls.json()[0]["role"] == "vision_ocr"
    assert model_calls.json()[0]["status"] == "success"


def test_job_timeline_exposes_pipeline_steps_for_stepper():
    client = TestClient(app)
    job_id = _create_job(client)

    response = client.get(f"/api/jobs/{job_id}/timeline")

    assert response.status_code == 200
    steps = response.json()
    assert [step["key"] for step in steps] == [
        "upload",
        "preprocess",
        "layout",
        "crop_figures",
        "ocr",
        "structure",
        "validate",
        "quality",
        "export",
    ]
    assert steps[-1]["status"] == "completed"
```

**Step 2: Run test to verify it fails**

Run:

```bash
cd apps/api
python -m pytest tests/test_console_support_api.py -v
```

Expected: FAIL because assets, quality report, model calls, and timeline endpoints do not exist.

**Step 3: Add model call and timeline schemas**

Modify `apps/api/app/schemas/job.py` and append:

```python
class ModelCallRead(BaseModel):
    model_call_id: str
    role: str
    model: str
    prompt_version: str
    input_assets: list[str] = Field(default_factory=list)
    status: str
    latency_seconds: float | None = None
    token_count: int | None = None
    warning: str | None = None


class TimelineStep(BaseModel):
    key: str
    label: str
    status: str
    warning: str | None = None
```

**Step 4: Store diagnostics in repository**

Modify `apps/api/app/services/repository.py`:

```python
from app.schemas.export import ExportArtifact
from app.schemas.job import JobRead, ModelCallRead, QualityReport, TimelineStep
from app.schemas.review_issue import ReviewIssueRead


class InMemoryRepository:
    def __init__(self):
        self.jobs: dict[str, JobRead] = {}
        self.documents: dict[str, dict] = {}
        self.quality_reports: dict[str, QualityReport] = {}
        self.model_calls: dict[str, list[ModelCallRead]] = {}
        self.timelines: dict[str, list[TimelineStep]] = {}
        self.exports: dict[str, ExportArtifact] = {}
        self.review_issues: dict[str, ReviewIssueRead] = {}

    # keep existing methods

    def set_model_calls(self, job_id: str, calls: list[ModelCallRead]) -> None:
        self.model_calls[job_id] = calls

    def list_model_calls(self, job_id: str) -> list[ModelCallRead]:
        return self.model_calls.get(job_id, [])

    def set_timeline(self, job_id: str, steps: list[TimelineStep]) -> None:
        self.timelines[job_id] = steps

    def get_timeline(self, job_id: str) -> list[TimelineStep]:
        return self.timelines.get(job_id, [])
```

Preserve all existing repository methods from Task 5.

**Step 5: Add mock diagnostics**

Modify `apps/api/app/services/mock_pipeline.py` so `PipelineResult` includes model calls and timeline:

```python
from app.schemas.job import JobMode, ModelCallRead, QualityItem, QualityPolicy, QualityReport, TimelineStep


@dataclass(frozen=True)
class PipelineResult:
    document: ProblemDocument
    quality_report: QualityReport
    model_calls: list[ModelCallRead]
    timeline: list[TimelineStep]
```

Inside `run()`, return:

```python
model_calls = [
    ModelCallRead(
        model_call_id=f"call_{job_id}_vision",
        role="vision_ocr",
        model="mock-vision",
        prompt_version="v1.0.0",
        input_assets=[source_path],
        status="success",
        latency_seconds=0.2,
        token_count=1204,
    ),
    ModelCallRead(
        model_call_id=f"call_{job_id}_structure",
        role="structure",
        model="mock-structure",
        prompt_version="v1.0.0",
        input_assets=["ocr_result.json"],
        status="success",
        latency_seconds=0.1,
        token_count=842,
    ),
    ModelCallRead(
        model_call_id=f"call_{job_id}_quality",
        role="figure_quality",
        model="mock-quality",
        prompt_version="v1.0.0",
        input_assets=[f"{figure_id}_original"],
        status="warning",
        latency_seconds=0.1,
        token_count=312,
        warning="Mock figure quality is medium; review recommended.",
    ),
]
timeline = [
    TimelineStep(key="upload", label="Upload", status="completed"),
    TimelineStep(key="preprocess", label="Preprocess", status="completed"),
    TimelineStep(key="layout", label="Layout", status="completed"),
    TimelineStep(key="crop_figures", label="Crop Figures", status="completed"),
    TimelineStep(key="ocr", label="OCR", status="completed"),
    TimelineStep(key="structure", label="Structure", status="completed"),
    TimelineStep(key="validate", label="Validate", status="completed"),
    TimelineStep(key="quality", label="Quality", status="warning", warning="Medium figure confidence"),
    TimelineStep(key="export", label="Export", status="completed"),
]
return PipelineResult(
    document=document,
    quality_report=report,
    model_calls=model_calls,
    timeline=timeline,
)
```

**Step 6: Persist diagnostics during job creation**

Modify `apps/api/app/api/jobs.py` after setting the quality report:

```python
repo.set_model_calls(job_id, result.model_calls)
repo.set_timeline(job_id, result.timeline)
```

Add endpoints:

```python
@router.get("/{job_id}/assets")
def list_assets(job_id: str) -> list[dict]:
    document = repo.get_document(job_id)
    if not document:
        raise HTTPException(status_code=404, detail="document not found")
    return document.get("assets", [])


@router.get("/{job_id}/quality-report")
def get_quality_report(job_id: str):
    report = repo.get_quality_report(job_id)
    if not report:
        raise HTTPException(status_code=404, detail="quality report not found")
    return report


@router.get("/{job_id}/model-calls")
def list_model_calls(job_id: str):
    job = repo.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="job not found")
    return repo.list_model_calls(job_id)


@router.get("/{job_id}/timeline")
def get_timeline(job_id: str):
    job = repo.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="job not found")
    return repo.get_timeline(job_id)
```

**Step 7: Run console support API tests**

Run:

```bash
cd apps/api
python -m pytest tests/test_console_support_api.py tests/test_jobs_api.py tests/test_mock_pipeline.py -v
```

Expected: PASS.

**Step 8: Commit**

```bash
git add apps/api/app/schemas/job.py apps/api/app/services/mock_pipeline.py apps/api/app/services/repository.py apps/api/app/api/jobs.py apps/api/tests/test_console_support_api.py
git commit -m "feat(api): add job console diagnostics"
```

---

### Task 12: Backend Full Test Pass and API Documentation Update

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

````markdown
## MVP API Flow

```bash
cd apps/api
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
uvicorn app.main:app --reload
```

Open `http://127.0.0.1:8000/docs`.
````

Modify `apps/api/README.md` to include example curl commands:

````markdown
## Example

```bash
curl -X POST http://127.0.0.1:8000/api/jobs \
  -F mode=auto \
  -F quality_policy=report_only \
  -F file=@sample.png
```
````

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

### Task 13: Console Frontend Project Skeleton

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/next.config.ts`
- Create: `apps/web/postcss.config.mjs`
- Create: `apps/web/tailwind.config.ts`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/app/layout.tsx`
- Create: `apps/web/app/page.tsx`
- Create: `apps/web/app/globals.css`
- Create: `apps/web/lib/api.ts`
- Create: `apps/web/lib/i18n.ts`
- Create: `apps/web/lib/mock-data.ts`
- Create: `apps/web/components/providers/theme-provider.tsx`
- Create: `apps/web/components/providers/console-preferences-provider.tsx`
- Create: `apps/web/components/layout/theme-toggle.tsx`
- Create: `apps/web/components/layout/language-toggle.tsx`
- Create: `apps/web/components/layout/app-shell.tsx`
- Create: `apps/web/components/console/pipeline-stepper.tsx`
- Create: `apps/web/components/console/source-image-panel.tsx`
- Create: `apps/web/components/console/structured-preview.tsx`
- Create: `apps/web/components/console/diagnostics-panel.tsx`
- Create: `apps/web/components/console/quality-sidebar.tsx`
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
    "typecheck": "tsc --noEmit",
    "check": "npm run typecheck && npm run build"
  },
  "dependencies": {
    "@tanstack/react-query": "^5.59.0",
    "lucide-react": "^0.468.0",
    "next": "^16.0.0",
    "next-themes": "^0.4.4",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.47",
    "tailwindcss": "^3.4.14",
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

Create `apps/web/postcss.config.mjs`:

```js
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};

export default config;
```

Create `apps/web/tailwind.config.ts`:

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        surface: "hsl(var(--surface))",
        "surface-subtle": "hsl(var(--surface-subtle))",
        border: "hsl(var(--border))",
        muted: "hsl(var(--muted))",
        brand: "hsl(var(--brand))",
        "brand-soft": "hsl(var(--brand-soft))",
        success: "hsl(var(--success))",
        "success-soft": "hsl(var(--success-soft))",
        warning: "hsl(var(--warning))",
        "warning-soft": "hsl(var(--warning-soft))",
        danger: "hsl(var(--danger))",
        "danger-soft": "hsl(var(--danger-soft))",
        info: "hsl(var(--info))",
        "info-soft": "hsl(var(--info-soft))",
      },
      boxShadow: {
        panel: "0 10px 28px hsl(var(--shadow) / 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
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
    "baseUrl": ".",
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

**Step 2: Implement Tailwind globals, theme provider, and i18n provider**

Create `apps/web/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import "./globals.css";

import { ConsolePreferencesProvider } from "@/components/providers/console-preferences-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";

export const metadata: Metadata = {
  title: "easy-OCR Debug Console",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <ConsolePreferencesProvider>{children}</ConsolePreferencesProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

Create `apps/web/app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 216 33% 97%;
    --foreground: 222 35% 15%;
    --surface: 0 0% 100%;
    --surface-subtle: 210 33% 98%;
    --border: 214 30% 90%;
    --muted: 216 15% 45%;
    --brand: 162 100% 33%;
    --brand-soft: 158 64% 94%;
    --success: 150 84% 32%;
    --success-soft: 145 81% 96%;
    --warning: 35 92% 45%;
    --warning-soft: 42 100% 96%;
    --danger: 0 84% 60%;
    --danger-soft: 0 86% 97%;
    --info: 214 84% 56%;
    --info-soft: 211 100% 97%;
    --shadow: 215 40% 18%;
  }

  .dark {
    --background: 222 32% 8%;
    --foreground: 210 30% 94%;
    --surface: 222 28% 12%;
    --surface-subtle: 221 25% 16%;
    --border: 220 20% 24%;
    --muted: 216 13% 68%;
    --brand: 162 78% 44%;
    --brand-soft: 162 42% 18%;
    --success: 150 70% 45%;
    --success-soft: 150 42% 18%;
    --warning: 38 92% 56%;
    --warning-soft: 36 44% 18%;
    --danger: 0 84% 66%;
    --danger-soft: 0 45% 18%;
    --info: 214 92% 66%;
    --info-soft: 214 44% 18%;
    --shadow: 222 45% 4%;
  }

  body {
    @apply bg-background text-foreground antialiased;
  }

  button,
  input,
  select {
    font: inherit;
  }
}
```

Create `apps/web/components/providers/theme-provider.tsx`:

```tsx
"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </NextThemesProvider>
  );
}
```

Create `apps/web/lib/i18n.ts`:

```ts
export type Locale = "zh-CN" | "en";

export const dictionaries = {
  "zh-CN": {
    appName: "OCR 题目控制台",
    nav: {
      dashboard: "仪表盘",
      jobs: "任务",
      createJob: "创建任务",
      issues: "问题",
      exports: "导出",
      models: "模型",
      settings: "设置",
    },
    actions: {
      backToJobs: "返回任务",
      rerun: "重新运行",
      share: "分享",
      export: "导出",
      debugMode: "调试模式",
      readyModels: "模型: 4/4 就绪",
      theme: "主题",
      language: "语言",
      light: "白天",
      dark: "夜间",
      notifications: "通知",
      unknownUploadError: "上传失败",
    },
    panels: {
      sourceImage: "源图片",
      figureCrops: "配图裁剪",
      imageInfo: "图片信息",
      structuredPreview: "结构化预览",
      edit: "编辑",
      qualitySummary: "质量摘要",
      riskLevel: "风险等级",
      topIssues: "主要问题",
      problem: "题目",
      confidence: "置信度",
      lowConfidence: "低置信度",
      answerExplanation: "答案与解析",
      newCrop: "新裁剪",
      refreshSource: "刷新源图片",
      cropSettings: "裁剪设置",
    },
    diagnostics: {
      json: "JSON",
      modelCalls: "模型调用",
      exports: "导出",
      qualityReport: "质量报告",
      issues: "问题",
      assets: "资产",
    },
  },
  en: {
    appName: "OCR Exercise Console",
    nav: {
      dashboard: "Dashboard",
      jobs: "Jobs",
      createJob: "Create Job",
      issues: "Issues",
      exports: "Exports",
      models: "Models",
      settings: "Settings",
    },
    actions: {
      backToJobs: "Back to Jobs",
      rerun: "Re-run",
      share: "Share",
      export: "Export",
      debugMode: "Debug Mode",
      readyModels: "Models: 4/4 Ready",
      theme: "Theme",
      language: "Language",
      light: "Light",
      dark: "Dark",
      notifications: "Notifications",
      unknownUploadError: "Unknown upload error",
    },
    panels: {
      sourceImage: "Source Image",
      figureCrops: "Figure Crops",
      imageInfo: "Image Info",
      structuredPreview: "Structured Preview",
      edit: "Edit",
      qualitySummary: "Quality Summary",
      riskLevel: "Risk Level",
      topIssues: "Top Issues",
      problem: "Problem",
      confidence: "Confidence",
      lowConfidence: "Low confidence",
      answerExplanation: "Answer & Explanation",
      newCrop: "New Crop",
      refreshSource: "Refresh source image",
      cropSettings: "Figure crop settings",
    },
    diagnostics: {
      json: "JSON",
      modelCalls: "Model Calls",
      exports: "Exports",
      qualityReport: "Quality Report",
      issues: "Issues",
      assets: "Assets",
    },
  },
} as const;
```

Create `apps/web/components/providers/console-preferences-provider.tsx`:

```tsx
"use client";

import { createContext, useContext, useMemo, useState } from "react";

import { dictionaries, type Locale } from "@/lib/i18n";

type ConsolePreferences = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (typeof dictionaries)[Locale];
};

const ConsolePreferencesContext = createContext<ConsolePreferences | null>(null);

export function ConsolePreferencesProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>("zh-CN");
  const value = useMemo(() => ({ locale, setLocale, t: dictionaries[locale] }), [locale]);
  return (
    <ConsolePreferencesContext.Provider value={value}>
      {children}
    </ConsolePreferencesContext.Provider>
  );
}

export function useConsolePreferences() {
  const context = useContext(ConsolePreferencesContext);
  if (!context) {
    throw new Error("useConsolePreferences must be used inside ConsolePreferencesProvider");
  }
  return context;
}
```

Create `apps/web/components/layout/theme-toggle.tsx`:

```tsx
"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { useConsolePreferences } from "@/components/providers/console-preferences-provider";

export function ThemeToggle() {
  const { t } = useConsolePreferences();
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  return (
    <button
      type="button"
      className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-surface px-3 text-sm text-foreground hover:bg-surface-subtle"
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? <Sun size={15} /> : <Moon size={15} />}
      {isDark ? t.actions.light : t.actions.dark}
    </button>
  );
}
```

Create `apps/web/components/layout/language-toggle.tsx`:

```tsx
"use client";

import { Languages } from "lucide-react";

import { useConsolePreferences } from "@/components/providers/console-preferences-provider";

export function LanguageToggle() {
  const { locale, setLocale, t } = useConsolePreferences();
  return (
    <button
      type="button"
      className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-surface px-3 text-sm text-foreground hover:bg-surface-subtle"
      onClick={() => setLocale(locale === "zh-CN" ? "en" : "zh-CN")}
    >
      <Languages size={15} />
      {t.actions.language}: {locale === "zh-CN" ? "中文" : "EN"}
    </button>
  );
}
```

Create `apps/web/components/layout/app-shell.tsx`:

```tsx
"use client";

import { Bell, Code2 } from "lucide-react";

import { LanguageToggle } from "@/components/layout/language-toggle";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { useConsolePreferences } from "@/components/providers/console-preferences-provider";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { t } = useConsolePreferences();
  const links = [
    t.nav.dashboard,
    t.nav.jobs,
    t.nav.createJob,
    t.nav.issues,
    t.nav.exports,
    t.nav.models,
    t.nav.settings,
  ];
  return (
    <div className="grid min-h-screen grid-rows-[64px_1fr_34px] bg-background text-foreground">
      <header className="flex items-center gap-7 border-b border-border bg-surface px-7">
        <div className="flex items-center gap-2.5 font-bold">
          <span className="h-6 w-6 rounded-lg bg-brand" />
          <span>{t.appName}</span>
        </div>
        <nav className="flex items-center gap-6">
          {links.map((link) => (
            <a
              key={link}
              className={`border-b-2 px-0 py-5 text-sm no-underline ${link === t.nav.jobs ? "border-brand text-brand" : "border-transparent text-foreground"}`}
              href="#"
            >
              {link}
            </a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <span className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-surface-subtle px-3 text-sm text-muted">
            <Code2 size={14} />
            {t.actions.debugMode}
          </span>
          <span className="inline-flex h-9 items-center rounded-md border border-success/30 bg-success-soft px-3 text-sm text-success">
            {t.actions.readyModels}
          </span>
          <ThemeToggle />
          <LanguageToggle />
          <button className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface hover:bg-surface-subtle" aria-label={t.actions.notifications}>
            <Bell size={16} />
          </button>
        </div>
      </header>
      {children}
      <footer className="flex items-center gap-7 border-t border-border bg-surface px-7 text-xs text-muted">
        <span>Schema Version: 1.0.0</span>
        <span>Document Version: 1</span>
        <span>Renderer: markdown v0.3.0, html v0.2.1</span>
        <span className="ml-auto flex gap-5">
          <span>Storage: Local</span>
          <span>API: Connected</span>
        </span>
      </footer>
    </div>
  );
}
```

Create `apps/web/lib/api.ts`:

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

export type TimelineStep = {
  key: string;
  label: string;
  status: string;
  warning?: string | null;
};

export type ModelCall = {
  model_call_id: string;
  role: string;
  model: string;
  prompt_version: string;
  input_assets: string[];
  status: string;
  latency_seconds?: number | null;
  token_count?: number | null;
  warning?: string | null;
};
```

Create `apps/web/lib/mock-data.ts`:

```ts
export const mockTimeline = [
  { key: "upload", label: "Upload", status: "completed" },
  { key: "preprocess", label: "Preprocess", status: "completed" },
  { key: "layout", label: "Layout", status: "completed" },
  { key: "crop_figures", label: "Crop Figures", status: "completed" },
  { key: "ocr", label: "OCR", status: "completed" },
  { key: "structure", label: "Structure", status: "completed" },
  { key: "validate", label: "Validate", status: "completed" },
  { key: "quality", label: "Quality", status: "warning" },
  { key: "export", label: "Export", status: "completed" },
];

export const mockModelCalls = [
  {
    model_call_id: "call_1",
    role: "vision_ocr",
    model: "gpt-4o-mini",
    prompt_version: "v1.2.0",
    input_assets: ["image_preprocessed_v1.png"],
    status: "success",
    latency_seconds: 2.4,
    token_count: 1204,
  },
  {
    model_call_id: "call_2",
    role: "structure",
    model: "gpt-4o-mini",
    prompt_version: "v1.3.0",
    input_assets: ["ocr_result_v1.json"],
    status: "success",
    latency_seconds: 1.1,
    token_count: 2842,
  },
  {
    model_call_id: "call_3",
    role: "figure_quality",
    model: "gpt-4o-mini",
    prompt_version: "v1.1.0",
    input_assets: ["fig_1_crop.png", "fig_2_crop.png"],
    status: "warning",
    latency_seconds: 0.8,
    token_count: 812,
    warning: "图像 fig_3 清晰度较低，建议增强",
  },
];
```

Create `apps/web/components/console/pipeline-stepper.tsx`:

```tsx
import { AlertTriangle, Check } from "lucide-react";

import type { TimelineStep } from "@/lib/api";
import { mockTimeline } from "@/lib/mock-data";

export function PipelineStepper({ steps = mockTimeline }: { steps?: TimelineStep[] }) {
  const displaySteps = steps.length ? steps : mockTimeline;
  return (
    <section className="mx-auto w-full max-w-3xl rounded-lg border border-border bg-surface px-5 py-4 shadow-panel" aria-label="OCR pipeline progress">
      <div className="grid grid-cols-9 items-center">
        {displaySteps.map((step) => (
          <div key={step.key} className="relative grid justify-items-center gap-2 text-xs text-muted before:absolute before:left-[-50%] before:right-1/2 before:top-2 before:h-0.5 before:bg-success first:before:hidden">
            <span className={`z-10 grid h-4 w-4 place-items-center rounded-full text-white ${step.status === "warning" ? "bg-warning" : "bg-success"}`}>
              {step.status === "warning" ? <AlertTriangle size={11} /> : <Check size={11} />}
            </span>
            <span className="truncate px-1">{step.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
```

Create `apps/web/components/console/source-image-panel.tsx`:

```tsx
"use client";

import { Maximize2, Plus, RefreshCw, Search, Settings, SunMedium } from "lucide-react";

import { useConsolePreferences } from "@/components/providers/console-preferences-provider";

type SourceImagePanelProps = {
  assets?: unknown[];
};

export function SourceImagePanel({ assets = [] }: SourceImagePanelProps) {
  const { t } = useConsolePreferences();
  const crops = assets.length
    ? assets.map((asset, index) => ({
        id: typeof asset === "object" && asset && "figure_id" in asset ? String(asset.figure_id) : `fig_${index + 1}`,
        score: index === 0 ? "0.82" : index === 1 ? "0.91" : "0.65",
      }))
    : [
        { id: "fig_1", score: "0.82" },
        { id: "fig_2", score: "0.91" },
        { id: "fig_3", score: "0.65" },
      ];

  return (
    <aside className="grid gap-3">
      <section className="rounded-lg border border-border bg-surface p-4 shadow-panel">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">{t.panels.sourceImage}</h2>
          <button className="grid h-8 w-8 place-items-center rounded-md border border-border bg-surface hover:bg-surface-subtle" aria-label={t.panels.refreshSource}>
            <RefreshCw size={15} />
          </button>
        </div>
        <div className="relative h-96 overflow-hidden rounded-md border border-border bg-surface-subtle">
          <div className="flex gap-2 p-2.5">
            {[Search, Search, Search, Maximize2, SunMedium].map((Icon, index) => (
              <button key={index} className="grid h-8 w-8 place-items-center rounded-md border border-border bg-surface hover:bg-surface-subtle" aria-label={`Image tool ${index + 1}`}>
                <Icon size={14} />
              </button>
            ))}
          </div>
          <div className="absolute inset-x-7 bottom-3 top-14 rounded-md bg-white shadow-inner dark:bg-surface">
            <div className="absolute left-[6%] top-[8%] h-[20%] w-[88%] rounded border-2 border-info bg-info-soft/40" />
            <div className="absolute left-[8%] top-[31%] h-[40%] w-[84%] rounded border-2 border-brand bg-brand-soft/30" />
            <div className="absolute left-[8%] top-[76%] h-[17%] w-[84%] rounded border-2 border-success bg-success-soft/40" />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {["Text", "Formula", "Figure", "Low Conf.", "Unknown"].map((item) => (
            <span key={item} className="rounded-md border border-border bg-surface-subtle px-2 py-1 text-xs text-muted">{item}</span>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-border bg-surface p-4 shadow-panel">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">{t.panels.figureCrops}</h2>
          <button className="grid h-8 w-8 place-items-center rounded-md border border-border bg-surface hover:bg-surface-subtle" aria-label={t.panels.cropSettings}>
            <Settings size={15} />
          </button>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {crops.map((crop, index) => (
            <div key={crop.id} className={`grid h-24 w-28 content-between rounded-md border bg-surface p-2 ${index === 0 ? "border-brand ring-1 ring-brand" : "border-border"}`}>
              <div className="text-2xl">{index === 0 ? "∠" : "√"}</div>
              <strong className="text-sm">{crop.id}</strong>
              <span className={index === 2 ? "text-warning" : "text-brand"}>{crop.score}</span>
            </div>
          ))}
          <button className="grid h-24 w-28 place-items-center rounded-md border border-dashed border-border bg-surface text-sm text-muted hover:bg-surface-subtle" aria-label="Create new crop">
            <Plus size={18} />
            <span>{t.panels.newCrop}</span>
          </button>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-surface p-4 shadow-panel">
        <h2 className="mb-3 text-sm font-semibold">{t.panels.imageInfo}</h2>
        <div className="grid gap-2 text-sm text-muted">
          <span>File Name: question_001.png</span>
          <span>Size: 2480 x 3508</span>
          <span>Format: PNG</span>
          <span>File Size: 2.34 MB</span>
        </div>
      </section>
    </aside>
  );
}
```

Create `apps/web/components/console/structured-preview.tsx`:

```tsx
"use client";

import { ChevronRight, Maximize2 } from "lucide-react";

import { useConsolePreferences } from "@/components/providers/console-preferences-provider";

type StructuredPreviewProps = {
  document?: unknown;
};

export function StructuredPreview({ document }: StructuredPreviewProps) {
  const { t } = useConsolePreferences();
  return (
    <section className="rounded-lg border border-border bg-surface p-4 shadow-panel">
      <div className="-mx-4 -mt-4 mb-4 flex gap-5 border-b border-border px-4">
        <button className="border-b-2 border-brand py-3 text-sm text-brand">{t.panels.structuredPreview}</button>
        <button className="border-b-2 border-transparent py-3 text-sm text-muted">{t.panels.edit}</button>
        <button className="ml-auto grid h-9 w-9 place-items-center rounded-md border border-border bg-surface hover:bg-surface-subtle" aria-label="Fullscreen preview">
          <Maximize2 size={14} />
        </button>
      </div>

      <article className="mb-4 rounded-lg border border-border p-3.5">
        <div className="mb-3 flex items-center gap-2.5">
          <strong>{t.panels.problem} 1</strong>
          <span className="rounded-md border border-warning/30 bg-warning-soft px-2 py-1 text-xs text-warning">{t.panels.confidence}: 0.86</span>
        </div>
        <div className="my-2 rounded-md border border-info/30 bg-info-soft p-3 text-sm leading-7">
          如图所示，物体从斜面上的 A 点由静止滑下，经过 B 点后水平飞出（不计空气阻力）。
        </div>
        <div className="my-2 rounded-md border border-brand/30 bg-brand-soft/60 p-3">
          <div className="mb-2 flex items-center justify-between">
            <strong>Figure: fig_1</strong>
            <span className="text-brand">0.82</span>
          </div>
          <div className="grid h-32 place-items-center text-4xl">h θ B →</div>
        </div>
        <div className="my-2 rounded-md border border-success/30 bg-success-soft/60 p-3">
          {["√(2h/g)", "√(2h/g) tan θ", "√(2h/g) cot θ", "2√(h/g)"].map((option, index) => (
            <div key={option} className="my-1.5 grid grid-cols-[28px_1fr] gap-2 rounded-md bg-success-soft px-2 py-1.5">
              <span>{String.fromCharCode(65 + index)}</span>
              <span>{option}</span>
            </div>
          ))}
        </div>
        <button className="flex h-9 w-full items-center justify-between rounded-md border border-border bg-surface px-3 text-sm hover:bg-surface-subtle">
          {t.panels.answerExplanation} <ChevronRight size={15} />
        </button>
      </article>

      <article className="rounded-lg border border-border p-3.5">
        <div className="mb-3 flex items-center gap-2.5">
          <strong>{t.panels.problem} 2</strong>
          <span className="rounded-md border border-warning/30 bg-warning-soft px-2 py-1 text-xs text-warning">{t.panels.lowConfidence}</span>
        </div>
        <div className="rounded-md border border-info/30 bg-info-soft p-3 text-sm leading-7">
          如图，电路中电源电动势为 E，内阻为 r，定值电阻为 R。
        </div>
      </article>

      {document ? <pre className="mt-4 overflow-auto whitespace-pre-wrap rounded-md bg-surface-subtle p-3 text-xs">{JSON.stringify(document, null, 2)}</pre> : null}
    </section>
  );
}
```

Create `apps/web/components/console/diagnostics-panel.tsx`:

```tsx
"use client";

import { Box, Eye, ImageIcon } from "lucide-react";

import { useConsolePreferences } from "@/components/providers/console-preferences-provider";
import type { ModelCall } from "@/lib/api";
import { mockModelCalls } from "@/lib/mock-data";

type DiagnosticsPanelProps = {
  document?: unknown;
  modelCalls?: ModelCall[] | unknown[];
};

export function DiagnosticsPanel({ document, modelCalls = mockModelCalls }: DiagnosticsPanelProps) {
  const { t } = useConsolePreferences();
  const calls = modelCalls.length ? modelCalls : mockModelCalls;
  const tabs = [
    t.diagnostics.json,
    t.diagnostics.modelCalls,
    t.diagnostics.exports,
    t.diagnostics.qualityReport,
    t.diagnostics.issues,
    t.diagnostics.assets,
  ];
  return (
    <section className="rounded-lg border border-border bg-surface p-4 shadow-panel">
      <div className="-mx-4 -mt-4 mb-4 flex gap-5 overflow-x-auto border-b border-border px-4">
        {tabs.map((tab) => (
          <button key={tab} className={`whitespace-nowrap border-b-2 py-3 text-sm ${tab === t.diagnostics.modelCalls ? "border-brand text-brand" : "border-transparent text-muted"}`}>
            {tab}
          </button>
        ))}
      </div>
      {calls.map((call, index) => {
        const typed = call as ModelCall;
        const Icon = index === 0 ? Eye : index === 1 ? Box : ImageIcon;
        return (
          <div key={typed.model_call_id ?? index} className="grid grid-cols-[72px_28px_1fr_auto] gap-3 border-b border-border py-3 text-sm">
            <span className="text-muted">10:21:{String(index * 3 + 4).padStart(2, "0")}</span>
            <Icon size={18} />
            <div>
              <strong>{typed.role}</strong>
              <div className="text-xs text-muted">{typed.model} · Prompt {typed.prompt_version}</div>
              <div className="text-xs text-muted">Input: {(typed.input_assets ?? []).join(", ")}</div>
              {typed.warning ? <div className="mt-2 rounded-md border border-warning/30 bg-warning-soft px-2 py-1 text-xs text-warning">{typed.warning}</div> : null}
            </div>
            <div className="text-right">
              <span className={`rounded-md px-2 py-1 text-xs ${typed.status === "success" ? "bg-success-soft text-success" : "bg-warning-soft text-warning"}`}>{typed.status}</span>
              <div className="mt-1.5 text-xs text-muted">{typed.latency_seconds}s · {typed.token_count} tokens</div>
            </div>
          </div>
        );
      })}
      {document ? <pre className="mt-4 overflow-auto whitespace-pre-wrap rounded-md bg-surface-subtle p-3 text-xs">{JSON.stringify(document, null, 2)}</pre> : null}
    </section>
  );
}
```

Create `apps/web/components/console/quality-sidebar.tsx`:

```tsx
"use client";

import { AlertTriangle } from "lucide-react";

import { useConsolePreferences } from "@/components/providers/console-preferences-provider";

type QualitySidebarProps = {
  qualityReport?: unknown;
};

export function QualitySidebar({ qualityReport }: QualitySidebarProps) {
  const { t } = useConsolePreferences();
  return (
    <div className="mt-3 grid gap-3">
      <section className="grid grid-cols-[110px_1fr] items-center gap-4 rounded-lg border border-border bg-surface p-4 shadow-panel">
        <div className="grid h-24 w-24 place-items-center rounded-full bg-[conic-gradient(hsl(var(--info))_0_55%,hsl(var(--warning))_55%_82%,hsl(var(--danger))_82%_94%,hsl(var(--brand))_94%_100%)]">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-surface font-bold">9</div>
        </div>
        <div>
          <h3 className="font-semibold">{t.panels.qualitySummary}</h3>
          <p className="text-sm text-muted">Info 5 · Warning 3 · Error 1 · Critical 0</p>
        </div>
      </section>
      <section className="rounded-lg border border-border bg-surface p-4 shadow-panel">
        <h3 className="font-semibold">{t.panels.riskLevel}</h3>
        <p className="mt-2 inline-flex items-center gap-2 rounded-md border border-warning/30 bg-warning-soft px-2 py-1 text-sm text-warning">
          <AlertTriangle size={15} />
          Warning
        </p>
        <p className="mt-2 text-sm text-muted">存在 3 个中等风险问题</p>
      </section>
      <section className="rounded-lg border border-border bg-surface p-4 shadow-panel">
        <h3 className="font-semibold">{t.panels.topIssues}</h3>
        <div className="mt-3 grid gap-2 text-sm text-muted">
          <p>fig_3 图像清晰度较低</p>
          <p>公式区域置信度较低 (Problem 2)</p>
          <p>选项 C 可能存在 OCR 错误</p>
        </div>
        {qualityReport ? <pre className="mt-4 overflow-auto whitespace-pre-wrap rounded-md bg-surface-subtle p-3 text-xs">{JSON.stringify(qualityReport, null, 2)}</pre> : null}
      </section>
    </div>
  );
}
```

Create `apps/web/app/page.tsx`:

```tsx
"use client";

import { Download, RotateCcw, Share2 } from "lucide-react";

import { PipelineStepper } from "@/components/console/pipeline-stepper";
import { SourceImagePanel } from "@/components/console/source-image-panel";
import { StructuredPreview } from "@/components/console/structured-preview";
import { DiagnosticsPanel } from "@/components/console/diagnostics-panel";
import { QualitySidebar } from "@/components/console/quality-sidebar";
import { AppShell } from "@/components/layout/app-shell";
import { useConsolePreferences } from "@/components/providers/console-preferences-provider";

export default function HomePage() {
  const { t } = useConsolePreferences();
  return (
    <AppShell>
      <main className="grid gap-3.5 px-7 py-4">
        <section className="flex items-end justify-between gap-5">
          <div>
            <a href="#" className="text-sm text-info">{t.actions.backToJobs}</a>
            <h1 className="mt-2 text-2xl font-bold">Job #20240520-0001 <span className="rounded-md bg-success-soft px-2 py-1 text-sm text-success">Completed</span></h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted">
              <span>Created: 2024-05-20 10:21:03</span>
              <span>Mode: debug</span>
              <span>Policy: report_only</span>
            </div>
          </div>
          <div className="flex gap-2.5">
            <button className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-surface px-3 text-sm hover:bg-surface-subtle"><RotateCcw size={15} />{t.actions.rerun}</button>
            <button className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-surface px-3 text-sm hover:bg-surface-subtle"><Share2 size={15} />{t.actions.share}</button>
            <button className="inline-flex h-9 items-center gap-2 rounded-md bg-brand px-3 text-sm text-white"><Download size={15} />{t.actions.export}</button>
          </div>
        </section>
        <PipelineStepper />
        <section className="grid grid-cols-[minmax(330px,0.92fr)_minmax(420px,1.05fr)_minmax(380px,0.94fr)] items-start gap-3 max-[1180px]:grid-cols-1">
          <SourceImagePanel />
          <StructuredPreview />
          <div>
            <DiagnosticsPanel />
            <QualitySidebar />
          </div>
        </section>
      </main>
    </AppShell>
  );
}
```

Create `apps/web/README.md`:

````markdown
# easy-OCR Web

Next.js debugging console for the easy-OCR API.

```bash
cd apps/web
npm install
npm run dev
```
````

**Step 3: Install and build**

Run:

```bash
cd apps/web
npm install
npm run check
```

Expected: typecheck and build succeed.

**Step 4: Commit**

```bash
git add apps/web package-lock.json
git commit -m "feat(web): add Next.js debug console skeleton"
```

If npm creates `apps/web/package-lock.json` instead of root `package-lock.json`, add that path.

---

### Task 14: Connect Console to Job APIs

**Files:**
- Modify: `apps/web/app/page.tsx`
- Modify: `apps/web/lib/api.ts`
- Modify: `apps/web/components/console/pipeline-stepper.tsx`
- Modify: `apps/web/components/console/structured-preview.tsx`
- Modify: `apps/web/components/console/diagnostics-panel.tsx`
- Modify: `apps/web/components/console/source-image-panel.tsx`

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

export async function listTimeline(jobId: string): Promise<TimelineStep[]> {
  const response = await fetch(`${API_BASE}/jobs/${jobId}/timeline`);
  if (!response.ok) {
    throw new Error(`Failed to load timeline: ${response.status}`);
  }
  return response.json();
}

export async function listModelCalls(jobId: string): Promise<ModelCall[]> {
  const response = await fetch(`${API_BASE}/jobs/${jobId}/model-calls`);
  if (!response.ok) {
    throw new Error(`Failed to load model calls: ${response.status}`);
  }
  return response.json();
}

export async function listAssets(jobId: string): Promise<unknown[]> {
  const response = await fetch(`${API_BASE}/jobs/${jobId}/assets`);
  if (!response.ok) {
    throw new Error(`Failed to load assets: ${response.status}`);
  }
  return response.json();
}

export async function getQualityReport(jobId: string): Promise<unknown> {
  const response = await fetch(`${API_BASE}/jobs/${jobId}/quality-report`);
  if (!response.ok) {
    throw new Error(`Failed to load quality report: ${response.status}`);
  }
  return response.json();
}

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

**Step 2: Wire upload into the console without destroying the mockup layout**

Modify `apps/web/app/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Download, RotateCcw, Share2 } from "lucide-react";

import { DiagnosticsPanel } from "@/components/console/diagnostics-panel";
import { PipelineStepper } from "@/components/console/pipeline-stepper";
import { QualitySidebar } from "@/components/console/quality-sidebar";
import { SourceImagePanel } from "@/components/console/source-image-panel";
import { StructuredPreview } from "@/components/console/structured-preview";
import { AppShell } from "@/components/layout/app-shell";
import { useConsolePreferences } from "@/components/providers/console-preferences-provider";
import {
  createJob,
  getDocument,
  getQualityReport,
  listAssets,
  listModelCalls,
  listTimeline,
  type Job,
  type ModelCall,
  type TimelineStep,
} from "@/lib/api";

export default function HomePage() {
  const { t } = useConsolePreferences();
  const [job, setJob] = useState<Job | null>(null);
  const [document, setDocument] = useState<unknown>(null);
  const [timeline, setTimeline] = useState<TimelineStep[]>([]);
  const [modelCalls, setModelCalls] = useState<ModelCall[]>([]);
  const [assets, setAssets] = useState<unknown[]>([]);
  const [qualityReport, setQualityReport] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | null) {
    if (!file) return;
    setError(null);
    const created = await createJob(file);
    setJob(created);
    const [loadedDocument, loadedTimeline, loadedModelCalls, loadedAssets, loadedQualityReport] =
      await Promise.all([
        getDocument(created.job_id),
        listTimeline(created.job_id),
        listModelCalls(created.job_id),
        listAssets(created.job_id),
        getQualityReport(created.job_id),
      ]);
    setDocument(loadedDocument);
    setTimeline(loadedTimeline);
    setModelCalls(loadedModelCalls);
    setAssets(loadedAssets);
    setQualityReport(loadedQualityReport);
  }

  return (
    <AppShell>
      <main className="grid gap-3.5 px-7 py-4">
        <section className="flex items-end justify-between gap-5 max-[900px]:items-start max-[900px]:flex-col">
          <div>
            <a href="#" className="text-sm text-info">{t.actions.backToJobs}</a>
            <h1 className="mt-2 text-2xl font-bold">
              {job ? `Job ${job.job_id}` : "Job #20240520-0001"}{" "}
              <span className="rounded-md bg-success-soft px-2 py-1 text-sm text-success">
                {job?.status ?? "Completed"}
              </span>
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted">
              <span>Mode: {job?.mode ?? "debug"}</span>
              <span>Policy: {job?.quality_policy ?? "report_only"}</span>
              <input
                className="max-w-56 rounded-md border border-border bg-surface px-2 py-1 text-sm"
                type="file"
                accept="image/*"
                onChange={(event) => {
                  handleFile(event.target.files?.[0] ?? null).catch((caught) => {
                    setError(caught instanceof Error ? caught.message : t.actions.unknownUploadError);
                  });
                }}
              />
            </div>
            {error ? <p className="mt-2 rounded-md bg-danger-soft px-3 py-2 text-sm text-danger" role="alert">{error}</p> : null}
          </div>
          <div className="flex gap-2.5">
            <button className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-surface px-3 text-sm hover:bg-surface-subtle"><RotateCcw size={15} />{t.actions.rerun}</button>
            <button className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-surface px-3 text-sm hover:bg-surface-subtle"><Share2 size={15} />{t.actions.share}</button>
            <button className="inline-flex h-9 items-center gap-2 rounded-md bg-brand px-3 text-sm text-white"><Download size={15} />{t.actions.export}</button>
          </div>
        </section>
        <PipelineStepper steps={timeline} />
        <section className="grid grid-cols-[minmax(330px,0.92fr)_minmax(420px,1.05fr)_minmax(380px,0.94fr)] items-start gap-3 max-[1180px]:grid-cols-1">
          <SourceImagePanel assets={assets} />
          <StructuredPreview document={document} />
          <div>
            <DiagnosticsPanel document={document} modelCalls={modelCalls} />
            <QualitySidebar qualityReport={qualityReport} />
          </div>
        </section>
      </main>
    </AppShell>
  );
}
```

Update the console components so they accept optional API data and fall back to `mock-data.ts` when data is empty. Keep all styling in Tailwind classes and route labels through `useConsolePreferences()`.

**Step 3: Build frontend**

Run:

```bash
cd apps/web
npm run check
```

Expected: typecheck and build succeed.

**Step 4: Commit**

```bash
git add apps/web/app/page.tsx apps/web/lib/api.ts
git commit -m "feat(web): add upload debug flow"
```

---

### Task 15: Visual Verification with Browser

**Files:**
- Modify only if screenshot verification finds layout issues.

**Step 1: Start backend**

Run:

```bash
cd apps/api
uvicorn app.main:app --reload
```

Expected: API starts on `http://127.0.0.1:8000`.

**Step 2: Start frontend**

Run:

```bash
cd apps/web
NEXT_PUBLIC_API_BASE=http://127.0.0.1:8000/api npm run dev
```

Expected: web app starts on `http://127.0.0.1:3000`.

**Step 3: Use @browser to inspect the page**

Use the Browser plugin or Playwright to open:

```text
http://127.0.0.1:3000
```

Verify against the supplied mockup:

- Top navigation contains all seven sections.
- Debug mode and model readiness chips are visible.
- Theme toggle switches between light and dark mode, with no unreadable contrast regressions.
- Language toggle switches navigation, actions, panel titles, and diagnostic tab labels between Chinese and English.
- Job header, progress stepper, source image panel, structured preview, diagnostics tabs, quality summary, risk level, and top issues are visible.
- No text overlaps inside buttons, chips, cards, tabs, or panels.
- Three-column layout fits a desktop viewport around 1440px wide.
- At 1024px wide, columns remain usable or stack without clipped text.
- No component relies on the removed `.panel`, `.chip`, `.workspace`, `.app-shell`, `.action-button`, or `.icon-button` CSS classes.

**Step 4: Fix visual defects**

If defects appear, modify only the affected frontend files and rebuild:

```bash
cd apps/web
npm run check
```

Expected: typecheck and build succeed and visual defects are resolved.

**Step 5: Commit visual fixes**

```bash
git add apps/web
git commit -m "fix(web): polish OCR console layout"
```

Skip this commit if no fixes were needed.

---

### Task 16: Manual End-to-End Smoke Test

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
- Timeline, assets, model calls, and quality report panels populate from the API.
- The page still visually resembles the supplied OCR Exercise Console mockup after real API data loads.
- Chinese/English switching works after API data loads.
- Light/dark switching works after API data loads.

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

### Task 17: Final Verification and Push

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
npm run check
```

Expected: typecheck and build succeed.

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

## Plan Audit Checklist

Before executing this plan, confirm:

- Markdown code fences render correctly, especially README snippets that contain nested fenced code blocks.
- Backend tests can import `app.main` from `apps/api` using the `pythonpath = ["."]` pytest setting.
- `document.py` includes `model_rebuild()` calls for recursive content blocks.
- Frontend package scripts use `typecheck`, `build`, and `check`; no task depends on `next lint`.
- Tailwind config includes every semantic color used by components.
- All UI labels in layout, navigation, panels, tabs, actions, and fallback errors come from `lib/i18n.ts`.
- OCR sample content may stay literal Chinese because it represents extracted exercise content, not application UI.
- Visual verification checks Chinese, English, light mode, and dark mode.
- `storage/` runtime data remains ignored by git.
