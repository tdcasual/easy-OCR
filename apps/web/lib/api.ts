export const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://127.0.0.1:8000/api";

export type Job = {
  job_id: string;
  mode: string;
  quality_policy: string;
  status: string;
  progress: number;
  latest_document_version?: number;
  quality_summary: Record<string, unknown>;
};

export type TimelineStep = {
  key: string;
  label: string;
  status: string;
  warning?: string | null;
};

export type ModelCall = {
  model_call_id: string;
  role: string;
  model: string;
  prompt_version: string;
  input_assets: string[];
  status: string;
  latency_seconds?: number | null;
  token_count?: number | null;
  warning?: string | null;
};
