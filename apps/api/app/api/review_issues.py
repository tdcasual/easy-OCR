from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, status

from app.api.jobs import repo
from app.schemas.review_issue import ReviewIssueCreate, ReviewIssueRead, ReviewIssueStatus

router = APIRouter(prefix="/review-issues", tags=["review-issues"])


def _new_issue_id() -> str:
    return f"issue_{uuid4().hex}"


@router.post("", response_model=ReviewIssueRead, status_code=status.HTTP_201_CREATED)
def create_review_issue(payload: ReviewIssueCreate) -> ReviewIssueRead:
    now = datetime.now(timezone.utc)
    issue = ReviewIssueRead(
        issue_id=_new_issue_id(),
        status=ReviewIssueStatus.OPEN,
        created_at=now,
        updated_at=now,
        title=payload.title,
        description=payload.description,
        expected_result=payload.expected_result,
        issue_type=payload.issue_type,
        severity=payload.severity,
        affects_auto_export=payload.affects_auto_export,
        job_id=payload.job_id,
        problem_id=payload.problem_id,
        block_id=payload.block_id,
        block_path=payload.block_path,
        figure_id=payload.figure_id,
        model_call_id=payload.model_call_id,
        export_id=payload.export_id,
        document_version=payload.document_version,
        labels=payload.labels,
    )
    return repo.save_review_issue(issue)


@router.get("", response_model=list[ReviewIssueRead])
def list_review_issues() -> list[ReviewIssueRead]:
    return repo.list_review_issues()
