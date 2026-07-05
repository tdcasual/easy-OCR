import {
  type ExportArtifact,
  type FigureAsset,
  type Job,
  type ModelCall,
  type ProblemDocument,
  type QualityReport,
  type TimelineStep,
} from "@/lib/types";

export type {
  ExportArtifact,
  FigureAsset,
  Job,
  ModelCall,
  ProblemDocument,
  QualityReport,
  TimelineStep,
} from "@/lib/types";

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://127.0.0.1:8000/api";

export function getSourceImageUrl(jobId: string): string {
  return `${API_BASE}/jobs/${jobId}/source-image`;
}

export function getAssetUrl(jobId: string, figureId: string): string {
  return `${API_BASE}/jobs/${jobId}/assets/${figureId}`;
}

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

export async function listAssets(jobId: string): Promise<FigureAsset[]> {
  const response = await fetch(`${API_BASE}/jobs/${jobId}/assets`);
  if (!response.ok) {
    throw new Error(`Failed to load assets: ${response.status}`);
  }
  return response.json();
}

export async function getQualityReport(jobId: string): Promise<QualityReport> {
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

export async function getDocument(jobId: string): Promise<ProblemDocument> {
  const response = await fetch(`${API_BASE}/jobs/${jobId}/document`);
  if (!response.ok) {
    throw new Error(`Failed to load document: ${response.status}`);
  }
  return response.json();
}

export async function createExport(jobId: string, format: string): Promise<ExportArtifact> {
  const response = await fetch(`${API_BASE}/jobs/${jobId}/exports`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ format }),
  });
  if (!response.ok) {
    throw new Error(`Failed to create export: ${response.status}`);
  }
  return response.json();
}

export async function getExport(exportId: string): Promise<ExportArtifact> {
  const response = await fetch(`${API_BASE}/exports/${exportId}`);
  if (!response.ok) {
    throw new Error(`Failed to load export: ${response.status}`);
  }
  return response.json();
}
