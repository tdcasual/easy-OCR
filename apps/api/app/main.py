from fastapi import FastAPI

from app.core.config import get_settings

settings = get_settings()

app = FastAPI(title="easy-OCR API")


@app.get(f"{settings.api_prefix}/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": settings.service_name}
