# easy-OCR

API-first OCR system for converting math, physics, and other subject exercise images into structured documents and exportable formats.

The project focuses on:

- Large-model OCR through a configurable LiteLLM client layer.
- Formula-preserving structured output.
- Figure extraction, quality scoring, and optional enhancement.
- Extensible exports such as Markdown, HTML, LaTeX, and Word.
- A frontend debugging console for OCR inspection, review issues, and export validation.

The current project state is design-first. See:

- [OCR Exercise API Design](docs/plans/2026-05-20-ocr-exercise-api-design.md)

## Planned Stack

- Backend: FastAPI, Pydantic v2, LiteLLM, Pillow/OpenCV.
- Frontend: Next.js, TypeScript, TanStack Query.
- Storage: local filesystem for MVP, replaceable with object storage later.

## MVP API Flow

```bash
cd apps/api
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
uvicorn app.main:app --reload
```

Open `http://127.0.0.1:8000/docs`.

## MVP Smoke Test

1. Start the API from `apps/api`.
2. Start the web console from `apps/web`.
3. Upload an image.
4. Confirm the job completes and the document JSON contains `schema_version`, `document_version`, `problems`, and `assets`.
5. Create a Markdown or HTML export through the API.

## Repository Status

This repository has been initialized for the first implementation pass. Application code will live under `apps/api` and `apps/web`.
