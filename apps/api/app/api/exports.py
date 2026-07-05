from uuid import uuid4

from fastapi import APIRouter, HTTPException, status

from app.api.jobs import repo
from app.core.config import get_settings
from app.renderers.base import RenderContext
from app.renderers.registry import build_default_registry
from app.schemas.document import ProblemDocument
from app.schemas.export import ExportArtifact, ExportRequest
from app.services.storage import LocalStorage

router = APIRouter(tags=["exports"])


def _asset_resolver(job_id: str) -> callable:
    def resolve(figure_id: str) -> str:
        return f"/api/jobs/{job_id}/assets/{figure_id}"

    return resolve


@router.get("/export-formats")
def list_export_formats() -> list[dict[str, str]]:
    return build_default_registry().list_formats()


@router.get("/exports/{export_id}", response_model=ExportArtifact)
def get_export(export_id: str) -> ExportArtifact:
    artifact = repo.get_export(export_id)
    if not artifact:
        raise HTTPException(status_code=404, detail="export not found")
    return artifact


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

    context = RenderContext(
        options=request.options,
        asset_resolver=_asset_resolver(job_id),
    )
    artifact = renderer.render(document, context)
    content = renderer.render_to_string(document, context)
    export_id = f"export_{uuid4().hex}"
    filename = f"{export_id}.{renderer.file_extension}"
    stored = LocalStorage(get_settings().storage_root).write_bytes(
        "exports",
        filename,
        content.encode("utf-8"),
    )
    completed = ExportArtifact(
        export_id=export_id,
        job_id=job_id,
        document_version=artifact.document_version,
        format=renderer.format,
        mime_type=renderer.mime_type,
        file_extension=renderer.file_extension,
        path=stored.relative_path,
        renderer_version=artifact.renderer_version,
        figure_mode=artifact.figure_mode,
        warnings=artifact.warnings,
    )
    repo.save_export(completed)
    return completed
