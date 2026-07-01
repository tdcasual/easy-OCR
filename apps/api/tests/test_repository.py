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
