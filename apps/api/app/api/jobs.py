import asyncio
from uuid import uuid4

from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status

from app.core.config import Settings, get_settings
from app.schemas.job import JobMode, JobRead, JobStatus, QualityPolicy
from app.services.mock_pipeline import MockOcrPipeline
from app.services.repository import InMemoryRepository
from app.services.storage import LocalStorage

router = APIRouter(prefix="/jobs", tags=["jobs"])
repo = InMemoryRepository()


def _allowed_content_types(settings: Settings) -> set[str]:
    allowed = {ct.strip().lower() for ct in settings.upload_content_types.split(",") if ct.strip()}
    if "image/jpeg" in allowed:
        allowed.add("image/jpg")
    return allowed


@router.post("", response_model=JobRead, status_code=status.HTTP_201_CREATED)
async def create_job(
    file: UploadFile = File(...),
    mode: JobMode = Form(JobMode.AUTO),
    quality_policy: QualityPolicy = Form(QualityPolicy.REPORT_ONLY),
) -> JobRead:
    settings = get_settings()
    storage = LocalStorage(settings.storage_root)
    content = await file.read()

    if len(content) > settings.max_upload_bytes:
        raise HTTPException(status_code=413, detail="upload too large")

    allowed = _allowed_content_types(settings)
    if not file.content_type or file.content_type.lower() not in allowed:
        raise HTTPException(status_code=415, detail="unsupported content type")

    filename = storage.unique_name(file.filename or "upload.png")
    stored = await asyncio.to_thread(storage.write_bytes, "uploads", filename, content)

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
    repo.set_model_calls(job_id, result.model_calls)
    repo.set_timeline(job_id, result.timeline)

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
