export type AssetKind =
  | "original_crop"
  | "normalized_crop"
  | "traditional_enhanced"
  | "ai_enhanced"
  | "ai_redrawn"
  | "manual_upload";

export type BlockType =
  | "paragraph"
  | "formula"
  | "figure_ref"
  | "choices"
  | "table"
  | "unknown";

export type SourceImage = {
  image_id: string;
  filename: string;
  path: string;
  width: number | null;
  height: number | null;
};

export type BaseBlock = {
  block_id: string;
};

export type TextBlock = BaseBlock & {
  type: "paragraph";
  text: string;
};

export type FormulaBlock = BaseBlock & {
  type: "formula";
  latex: string;
  display: boolean;
};

export type FigureRefBlock = BaseBlock & {
  type: "figure_ref";
  figure_id: string;
};

export type ChoiceItem = {
  label: string;
  blocks: ContentBlock[];
};

export type ChoicesBlock = BaseBlock & {
  type: "choices";
  items: ChoiceItem[];
};

export type TableBlock = BaseBlock & {
  type: "table";
  rows: string[][];
};

export type UnknownBlock = BaseBlock & {
  type: "unknown";
  raw_text: string;
  reason: string | null;
};

export type ContentBlock =
  | TextBlock
  | FormulaBlock
  | FigureRefBlock
  | ChoicesBlock
  | TableBlock
  | UnknownBlock;

export type Problem = {
  problem_id: string;
  blocks: ContentBlock[];
  figures: string[];
  confidence: number | null;
  answer: ContentBlock[] | null;
  solution: ContentBlock[] | null;
  subject: string | null;
  grade: string | null;
  difficulty: string | null;
  knowledge_points: string[];
  source: string | null;
  tags: string[];
  question_type: string | null;
};

export type FigureVersion = {
  version_id: string;
  kind: AssetKind;
  path: string;
  quality_score: number | null;
  metadata: Record<string, unknown>;
};

export type FigureAsset = {
  figure_id: string;
  source_image_id: string;
  bbox: [number, number, number, number];
  versions: FigureVersion[];
  selected_version: string;
  quality_score: number | null;
  risk_level: string;
  needs_review: boolean;
  metadata: Record<string, unknown>;
  provenance: Record<string, unknown>;
};

export type ProblemDocument = {
  id: string;
  schema_version: string;
  document_version: number;
  source_image: SourceImage;
  problems: Problem[];
  assets: FigureAsset[];
  metadata: Record<string, unknown>;
};

export type Severity = "info" | "warning" | "error" | "critical";

export type QualityItem = {
  severity: Severity;
  category: string;
  message: string;
  target: Record<string, unknown>;
};

export type QualityReport = {
  items: QualityItem[];
};

export type JobMode = "auto" | "review" | "debug";

export type QualityPolicy = "report_only" | "strict";

export type JobStatus =
  | "queued"
  | "preprocessing"
  | "detecting_layout"
  | "cropping_figures"
  | "ocr_running"
  | "structuring"
  | "judging_figures"
  | "enhancing_figures"
  | "rendering_preview"
  | "completed"
  | "failed"
  | "needs_review";

export type Job = {
  job_id: string;
  mode: JobMode;
  quality_policy: QualityPolicy;
  status: JobStatus;
  progress: number;
  source_image_id: string | null;
  latest_document_version: number | null;
  quality_summary: Record<string, unknown>;
  error: string | null;
  created_at: string;
  updated_at: string;
};

export type ModelCallStatus =
  | "success"
  | "warning"
  | "rate_limited"
  | "timeout"
  | "parse_error"
  | "provider_error"
  | "fallback_used";

export type ModelCall = {
  model_call_id: string;
  role: string;
  model: string;
  prompt_version: string;
  input_assets: string[];
  status: ModelCallStatus;
  latency_seconds: number | null;
  token_count: number | null;
  warning: string | null;
};

export type TimelineStepStatus =
  | "pending"
  | "running"
  | "completed"
  | "warning"
  | "failed";

export type TimelineStep = {
  key: string;
  label: string;
  status: TimelineStepStatus;
  warning: string | null;
};

export type FigureMode = "selected" | "original" | "enhanced" | "all";

export type ExportOptions = {
  include_answer: boolean;
  include_solution: boolean;
  figure_mode: FigureMode;
};

export type ExportArtifact = {
  export_id: string;
  job_id: string;
  document_version: number;
  format: string;
  mime_type: string;
  file_extension: string;
  path: string;
  renderer_version: string;
  figure_mode: FigureMode;
  warnings: string[];
  created_at: string;
};

export type ReviewIssueType =
  | "ocr_error"
  | "formula_error"
  | "figure_crop_error"
  | "figure_enhance_error"
  | "layout_error"
  | "export_error"
  | "schema_error"
  | "prompt_improvement";

export type ReviewIssueStatus =
  | "open"
  | "triaged"
  | "in_progress"
  | "resolved"
  | "closed";

export type ReviewIssue = {
  issue_id: string;
  status: ReviewIssueStatus;
  created_at: string;
  updated_at: string;
  title: string;
  description: string;
  expected_result: string | null;
  issue_type: ReviewIssueType;
  severity: Severity;
  affects_auto_export: boolean;
  job_id: string | null;
  problem_id: string | null;
  block_id: string | null;
  block_path: string | null;
  figure_id: string | null;
  model_call_id: string | null;
  export_id: string | null;
  document_version: number | null;
  labels: string[];
};

export type ModelRoleStatus = "ready" | "not_configured" | "degraded";

export type ModelStatusItem = {
  role: string;
  model: string;
  status: ModelRoleStatus;
};

export type ModelStatusResponse = {
  roles: ModelStatusItem[];
};
