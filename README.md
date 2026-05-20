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

## Repository Status

This repository has been initialized for the first implementation pass. Application code will live under `apps/api` and `apps/web`.
