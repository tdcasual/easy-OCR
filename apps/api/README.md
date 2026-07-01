# easy-OCR API

FastAPI backend for the easy-OCR MVP.

## Development

```bash
cd apps/api
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
pytest
uvicorn app.main:app --reload
```

## Example

```bash
curl -X POST http://127.0.0.1:8000/api/jobs \
  -F mode=auto \
  -F quality_policy=report_only \
  -F file=@sample.png
```

Export the resulting document:

```bash
curl -X POST http://127.0.0.1:8000/api/jobs/<job_id>/exports \
  -H "Content-Type: application/json" \
  -d '{"format":"markdown","options":{"figure_mode":"selected"}}'
```
