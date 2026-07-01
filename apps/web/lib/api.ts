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

export async function listTimeline(jobId: string): Promise<TimelineStep[]> {
  const response = await fetch(`${API_BASE}/jobs/${jobId}/timeline`);
  if (!response.ok) {
    throw new Error(`Failed to load timeline: ${response.status}`);
  }
  return response.json();
}

export async function listModelCalls(jobId: string): Promise<ModelCall[]> {
  const response = await fetch(`${API_BASE}/jobs/${jobId}/model-calls`);
  if (!response.ok) {
    throw new Error(`Failed to load model calls: ${response.status}`);
  }
  return response.json();
}

export async function listAssets(jobId: string): Promise<unknown[]> {
  const response = await fetch(`${API_BASE}/jobs/${jobId}/assets`);
  if (!response.ok) {
    throw new Error(`Failed to load assets: ${response.status}`);
  }
  return response.json();
}

export async function getQualityReport(jobId: string): Promise<unknown> {
  const response = await fetch(`${API_BASE}/jobs/${jobId}/quality-report`);
  if (!response.ok) {
    throw new Error(`Failed to load quality report: ${response.status}`);
  }
  return response.json();
}

export async function createJob(file: File): Promise<Job> {
  const form = new FormData();
  form.append("mode", "debug");
  form.append("quality_policy", "report_only");
  form.append("file", file);

  const response = await fetch(`${API_BASE}/jobs`, {
    method: "POST",
    body: form,
  });
  if (!response.ok) {
    throw new Error(`Failed to create job: ${response.status}`);
  }
  return response.json();
}

export async function getDocument(jobId: string): Promise<unknown> {
  const response = await fetch(`${API_BASE}/jobs/${jobId}/document`);
  if (!response.ok) {
    throw new Error(`Failed to load document: ${response.status}`);
  }
  return response.json();
}
