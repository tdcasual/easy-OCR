# OCR Exercise API Design

Date: 2026-05-20

## Goal

Build an API-first system that converts exercise images into structured, reusable exercise documents. The system should support math, physics, and other subject exercises, preserve formulas and figures, and export to multiple output formats such as LaTeX, Word, Markdown, and HTML.

The first product shape is an API service. A frontend debugging console is included from the start so OCR quality, figure handling, model calls, exports, and review issues can be inspected during development.

## Core Principles

- Keep OCR output independent from export formats.
- Treat figures as first-class assets, not inline decorations.
- Use LiteLLM as the model client abstraction so model providers can be changed by configuration.
- Support both fully automatic processing and human review/debug workflows.
- Make outputs extensible so future renderers can be added without changing the OCR pipeline.
- Preserve auditability for model calls, image crops, enhanced figures, schema repairs, and user feedback.
- Make every generated result traceable to source assets, model calls, prompt versions, and renderer versions.
- Prefer explicit risk reports over blocking automation unless the caller asks for strict quality gates.

## Recommended Stack

Backend:

- Python
- FastAPI
- Pydantic v2
- LiteLLM
- Pillow/OpenCV for image preprocessing and cropping
- SQLModel or SQLAlchemy for persistence

Frontend:

- Next.js
- TypeScript
- TanStack Query
- shadcn/ui or another practical component system

Storage:

- Local filesystem for MVP uploads, assets, and exports
- Database records for jobs, model calls, documents, exports, assets, and review issues
- Object storage can replace local files later without changing the data model

MVP defaults:

- Database: SQLite through SQLModel, with a migration path to PostgreSQL.
- Worker: in-process background worker for the first implementation, with a service boundary that can later move to RQ, arq, Celery, or another queue.
- Storage paths: local filesystem under `storage/`, never committed except `.gitkeep` placeholders.
- Schema validation: Pydantic models with explicit `schema_version` fields.

## Project Shape

```text
ocrforexercise/
  apps/
    api/
      app/
        main.py
        core/
        models/
        schemas/
        services/
        renderers/
        storage/
      tests/
    web/
      app/
      components/
      lib/
  packages/
    schemas/
  storage/
    uploads/
    assets/
    exports/
  docs/
    plans/
```

## Processing Modes

The system supports three run modes.

`auto` mode is the production batch path. It does not stop for human confirmation. It runs OCR, structure extraction, figure handling, export generation, and produces a quality report. Risky results are marked, but processing continues.

`review` mode focuses on content correction. It highlights low-confidence blocks, unclear figures, formula risks, and export problems. Users can edit content and create review issues.

`debug` mode focuses on engineering inspection. It exposes bounding boxes, intermediate images, prompts, model responses, schema repairs, token usage, latency, and errors.

Run mode is a job option, not a separate endpoint. The same job and document APIs should work across all modes.

Automation policy:

- `auto` mode completes exports whenever possible.
- `auto` mode writes warnings and risk levels instead of stopping for review.
- Callers can pass `quality_policy: "strict"` when they want severe risks to fail the job.
- Default `quality_policy` is `"report_only"` so batch processing remains unattended.
- `review` and `debug` modes can create issues and edits, but those edits should produce a new document version rather than mutating history silently.

## Pipeline

```text
image upload
  -> create job
  -> save source image
  -> preprocess image
  -> detect layout and figure candidates
  -> crop original figures
  -> call vision OCR model through LiteLLM
  -> structure OCR output into ProblemDocument
  -> validate and repair schema
  -> judge figure quality
  -> optionally enhance figures
  -> create preview document
  -> export to requested formats
  -> create quality report
```

MVP can start with a mock pipeline and then replace steps with real model calls and image processing.

## LiteLLM Model Client

LiteLLM is used behind an internal model client, not scattered through business code.

```python
class ModelClient:
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
```

The application config defines model roles rather than hard-coded providers.

```yaml
models:
  vision_ocr:
    model: ""
    api_base: ""
  structure:
    model: ""
    api_base: ""
  figure_quality:
    model: ""
    api_base: ""
  figure_enhance:
    model: ""
    api_base: ""
```

Model providers are configured later through environment variables or config files. The MVP should not assume OpenAI, Gemini, a domestic provider, or a local OpenAI-compatible service.

Every model call should be recorded with role, model name, input asset references, prompt version, response, parsed output, token usage when available, latency, status, and error details.

Provider configuration rules:

- Secrets must come from environment variables or a local ignored config file.
- Committed examples may include model role names and placeholder environment variable names only.
- Each model role can define primary and fallback models.
- Prompt templates should have stable names and versions.
- Parsed outputs must be validated before entering persistent documents.
- Raw model responses should be stored for debugging, but large binary payloads should be referenced as assets rather than embedded in database rows.

The first real implementation should support LiteLLM completion-style multimodal requests. Image generation or image editing should remain behind `FigureEnhancer` because provider support varies more than chat and vision OCR.

## ProblemDocument

`ProblemDocument` is the canonical intermediate format. Exporters render from this format only.

Required top-level fields:

```text
id
schema_version
source_image
problems
assets
metadata
document_version
```

Required problem fields:

```text
problem_id
blocks
figures
confidence
```

Optional fields are reserved for later formal question-bank use:

```text
answer
solution
subject
grade
difficulty
knowledge_points
source
tags
question_type
```

Content should be represented as semantic blocks rather than one plain text string.

```json
[
  { "type": "paragraph", "children": [] },
  { "type": "formula", "latex": "x^2+y^2=1", "display": true },
  { "type": "figure_ref", "figure_id": "fig_1" },
  { "type": "choices", "items": [] }
]
```

This allows future outputs such as LMS imports, Anki cards, EPUB, PDF, interactive HTML, MathML, formula ASTs, or question-bank JSON without rewriting the OCR pipeline.

Document versioning:

- The first OCR result creates document version `1`.
- Manual edits, schema repairs after review, or model reruns create later versions.
- Exports always point at a specific document version.
- Review issues should record the document version where the problem was observed.
- A later version can mark an issue as resolved without deleting the original evidence.

Block design should stay conservative. MVP block types:

```text
paragraph
formula
figure_ref
choices
table
unknown
```

`unknown` is important. It lets the system preserve uncertain content instead of dropping it or forcing it into the wrong structure.

## Figure Asset Model

Figures are stored in `assets` and referenced from problem blocks.

Each figure should track:

```text
figure_id
source_image_id
bbox
versions
selected_version
quality_score
risk_level
needs_review
metadata
provenance
```

Example:

```json
{
  "figure_id": "fig_1",
  "bbox": [120, 340, 460, 690],
  "versions": [
    {
      "version_id": "fig_1_original",
      "kind": "original_crop",
      "path": "storage/assets/fig_1_original.png",
      "quality_score": 0.62
    },
    {
      "version_id": "fig_1_enhanced",
      "kind": "enhanced",
      "path": "storage/assets/fig_1_enhanced.png",
      "quality_score": 0.84
    }
  ],
  "selected_version": "fig_1_original",
  "needs_review": true
}
```

Default behavior:

- Prefer original crops when they are clear enough.
- Use traditional enhancement when the crop is fixable.
- Use AI-generated or AI-enhanced figures only when needed.
- Never silently overwrite the original crop.
- Mark AI-enhanced geometry, circuit, coordinate, and function graph figures as higher risk unless verified by quality checks or review.

Figure version kinds:

```text
original_crop
normalized_crop
traditional_enhanced
ai_enhanced
ai_redrawn
manual_upload
```

Selection policy:

- Default selection should be deterministic and explainable.
- `selected_version` must be recorded with a reason.
- `ai_redrawn` should only be selected automatically when no acceptable crop exists and the quality policy allows it.
- When an AI-generated figure is used, exports should be able to include provenance metadata or a warning in sidecar output.
- Original crop must remain available even if the selected version changes.

## Export System

Exporters are plugins behind a registry.

```python
class ExportRenderer(Protocol):
    format: str
    mime_type: str
    file_extension: str

    async def render(
        self,
        document: ProblemDocument,
        options: ExportOptions,
    ) -> ExportArtifact:
        ...
```

Initial renderers:

- Markdown
- HTML

Near-term renderers:

- LaTeX
- DOCX

Future renderers can include PDF, EPUB, Anki, LMS import formats, PPT handouts, or question-bank JSON.

Exports are reproducible artifacts. Each export record should store format, renderer version, document version, options, created time, output path, and any warnings.

Renderer requirements:

- Renderers must not call OCR or mutate documents.
- Renderers should return warnings instead of hiding unsupported blocks.
- Renderers must handle `unknown` blocks by preserving visible content where possible.
- Renderers should expose supported options through `GET /api/export-formats`.
- Renderer output should include asset references that can be resolved by the API or bundled into a package.

Example request:

```json
{
  "format": "html",
  "options": {
    "include_answer": true,
    "include_solution": true,
    "figure_mode": "selected"
  }
}
```

## API Surface

MVP API:

```text
POST /api/jobs
GET  /api/jobs/{job_id}
GET  /api/jobs/{job_id}/document
PATCH /api/jobs/{job_id}/document
GET  /api/jobs/{job_id}/assets
POST /api/jobs/{job_id}/exports
GET  /api/exports/{export_id}
GET  /api/export-formats
GET  /api/models/status
```

Review issue API:

```text
POST /api/review-issues
GET  /api/review-issues
GET  /api/review-issues/{issue_id}
PATCH /api/review-issues/{issue_id}
```

Task states:

```text
queued
preprocessing
detecting_layout
cropping_figures
ocr_running
structuring
judging_figures
enhancing_figures
rendering_preview
completed
failed
needs_review
```

Job response fields should include:

```text
job_id
mode
quality_policy
status
progress
created_at
updated_at
source_image_id
latest_document_version
quality_summary
error
```

API design notes:

- File upload should support multipart form data.
- Job creation should accept optional mode, quality policy, requested export formats, and model role overrides.
- Document patches should create a new version.
- Asset URLs should be generated through the API, not exposed as raw filesystem paths.
- The API should be usable without the frontend.

## Frontend Debug Console

The frontend is a development and quality console, not the core product boundary.

Main layout:

```text
left: upload, source image, detected boxes
middle: structured exercise preview and editable content
right: JSON, model-call logs, exports, review issues
```

The first version should support:

- Uploading an image.
- Viewing job status.
- Viewing the source image and detected/cropped figures.
- Inspecting `ProblemDocument` JSON.
- Previewing Markdown or HTML output.
- Creating exports.
- Opening model-call logs.
- Creating review issues from a problem, block, figure, model call, or export.

Frontend mode behavior:

- In `auto` view, emphasize job completion, exports, and quality report.
- In `review` view, emphasize editing content, comparing figure versions, and writing issues.
- In `debug` view, emphasize raw JSON, prompts, model calls, timings, bbox overlays, and schema repair logs.
- The same job can be opened in any frontend view because mode belongs to processing, while view belongs to the user interface.

## Review Issues

Review issues turn human feedback into engineering improvement data.

Issues can attach to:

```text
job_id
problem_id
block_path
figure_id
model_call_id
export_id
```

Issue types:

```text
ocr_error
formula_error
figure_crop_error
figure_enhance_error
layout_error
export_error
schema_error
prompt_improvement
```

Each issue should include:

```text
title
description
expected_result
severity
status
affects_auto_export
attachments
created_at
updated_at
```

Initial statuses:

```text
open
triaged
in_progress
resolved
closed
```

These issues should later support regression tests, prompt improvements, renderer fixes, and quality dashboards.

Issue improvement loop:

```text
review issue
  -> triage
  -> attach expected result or corrected document fragment
  -> convert to regression fixture when useful
  -> implement prompt/pipeline/renderer fix
  -> rerun fixture
  -> resolve issue with evidence
```

Issues should be lightweight enough for daily use. MVP should support issue creation, listing, filtering by status/type/severity, and linking to the related job, figure, block, model call, or export.

Useful issue labels:

```text
model
prompt
layout
figure
formula
renderer
schema
frontend
regression-candidate
```

## Quality Report

Every automatic run should produce a quality report even when export succeeds.

Report items may include:

- Low-confidence OCR regions.
- Formula parsing risks.
- Schema repair events.
- Unclear original figures.
- AI-enhanced figures.
- Missing answer or solution fields.
- Export warnings.
- Model errors or fallbacks.

This lets the system run unattended while still surfacing risks for later review.

Quality severity:

```text
info
warning
error
critical
```

Default auto mode should export when severity is `info`, `warning`, or `error`, but mark the artifact as risky. `critical` should only block exports when the quality policy is strict or when no usable document can be produced.

Quality summary should include counts by severity and category so batch callers can sort jobs by review priority.

## Security and Privacy

The system may process copyrighted worksheets, student data, school materials, or paid question-bank content. MVP should treat all uploads and model payloads as sensitive.

Requirements:

- Do not commit uploaded images, generated assets, exports, local databases, or model responses.
- Do not log API keys, signed URLs, or full secret-bearing configuration.
- Make provider calls explicit and configurable so users know which external model service receives images.
- Keep a local-only mock mode for development without sending images to external providers.
- Add later support for asset retention policies and deletion APIs.
- Avoid using public image URLs for private uploaded assets.

## Testing and Acceptance

MVP acceptance criteria:

- A user can create a job by uploading an image.
- The job produces a schema-valid `ProblemDocument`, even if the first pipeline is mocked.
- The API can export Markdown and HTML from the same document.
- Figure assets are represented separately from content blocks.
- A review issue can be created against a job, figure, block path, model call, or export.
- The frontend can show job status, document JSON, figure assets, export preview, and issue list.
- Model roles are configurable through LiteLLM settings without hard-coding a provider.
- No runtime images, exports, databases, or secrets are tracked by git.

Regression strategy:

- Store small synthetic fixtures for schema and renderer tests.
- Convert high-value review issues into fixtures after triage.
- Test renderers against `unknown`, missing optional fields, and figure-version variations.
- Test `auto` mode with report-only and strict quality policies.

## MVP Scope

Include:

- FastAPI service skeleton.
- Pydantic schemas for jobs, documents, assets, exports, model calls, and review issues.
- LiteLLM model client abstraction.
- Configurable model roles.
- Image upload and local storage.
- Mock pipeline that returns a valid `ProblemDocument`.
- Original figure asset structure.
- Markdown and HTML renderers.
- Review issue creation and listing.
- Next.js debug console.
- Quality report and mode-aware job options.
- Document version fields and export reproducibility metadata.

Defer:

- Production-grade layout detection.
- Full batch paper splitting.
- Polished DOCX layout.
- Complete LaTeX templates.
- Advanced AI figure redrawing.
- Multi-user authentication.
- Distributed task queue.

## Implementation Phases

1. Create backend and frontend skeletons.
2. Define schemas and storage conventions.
3. Implement job creation and mock pipeline.
4. Add LiteLLM model client and model-call logging.
5. Add image upload, original asset handling, and figure placeholders.
6. Add Markdown and HTML renderers.
7. Build the Next.js debug console.
8. Add review issue workflow.
9. Add quality report output.
10. Replace mock steps with real OCR, layout, and figure quality implementations.

## Open Decisions

- First real vision model to test through LiteLLM.
- Whether figure enhancement should use LiteLLM directly or a separate provider plugin first.
- Exact threshold values for figure quality scores and auto risk levels.
- Whether public repository issues should be synced from internal review issues later.
