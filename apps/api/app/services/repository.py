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

    def set_model_calls(self, job_id: str, calls: list[ModelCallRead]) -> None:
        self.model_calls[job_id] = calls

    def list_model_calls(self, job_id: str) -> list[ModelCallRead]:
        return self.model_calls.get(job_id, [])

    def set_timeline(self, job_id: str, steps: list[TimelineStep]) -> None:
        self.timelines[job_id] = steps

    def get_timeline(self, job_id: str) -> list[TimelineStep]:
        return self.timelines.get(job_id, [])

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
