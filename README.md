# easy-OCR

API-first OCR system for converting math, physics, and other subject exercise images into structured documents and exportable formats.

The project focuses on:

- Large-model OCR through a configurable LiteLLM client layer.
- Formula-preserving structured output.
- Figure extraction, quality scoring, and optional enhancement.
- Extensible exports such as Markdown, HTML, LaTeX, and Word.
- A frontend debugging console for OCR inspection, review issues, and export validation.

## Repository Status

The MVP implementation is complete and verified:

- FastAPI backend with job upload, document generation, export rendering, and review-issue APIs.
- Next.js debugging console wired to the backend.
- End-to-end smoke test covering upload, document preview, and export creation.

See the design documents for the long-term architecture:

- [OCR Exercise API Design](docs/plans/2026-05-20-ocr-exercise-api-design.md)
- [MVP Implementation Plan](docs/plans/2026-05-20-easy-ocr-mvp-implementation.md)

## Stack

- **Backend:** FastAPI, Pydantic v2, SQLModel (declared; in-memory store used for MVP).
- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS v3.
- **Storage:** local filesystem for MVP, replaceable with object storage later.

## Quick Start

### Backend

```bash
cd apps/api
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Open `http://127.0.0.1:8000/docs`.

### Frontend

```bash
cd apps/web
npm install
npm run build
npm start
```

The console expects the API at `http://127.0.0.1:8000/api` by default. To override it:

```bash
NEXT_PUBLIC_API_BASE=http://your-api-host/api npm run build
```

## Verification

```bash
# Backend tests
cd apps/api
pytest -q

# Frontend typecheck + production build
cd apps/web
npm run check

# End-to-end smoke test (requires both servers running)
cd apps/web
node scripts/e2e-smoke.js
```

## Repository Layout

```text
apps/
  api/          FastAPI application
  web/          Next.js debugging console
docs/
  plans/        Architecture and implementation plans
storage/
  uploads/      Uploaded source images
  assets/       Extracted figure crops
  exports/      Generated export artifacts
  tmp/          Temporary files
  model_calls/  Raw model responses (created when feature enabled)
```
