"use client";

import { useState } from "react";
import { Download, RotateCcw, Share2 } from "lucide-react";

import { DiagnosticsPanel } from "@/components/console/diagnostics-panel";
import { PipelineStepper } from "@/components/console/pipeline-stepper";
import { QualitySidebar } from "@/components/console/quality-sidebar";
import { SourceImagePanel } from "@/components/console/source-image-panel";
import { StructuredPreview } from "@/components/console/structured-preview";
import { AppShell } from "@/components/layout/app-shell";
import { useConsolePreferences } from "@/components/providers/console-preferences-provider";
import {
  createExport,
  createJob,
  getDocument,
  getQualityReport,
  listAssets,
  listModelCalls,
  listTimeline,
} from "@/lib/api";
import type {
  FigureAsset,
  Job,
  ModelCall,
  ProblemDocument,
  QualityReport,
  TimelineStep,
} from "@/lib/types";

const ALLOWED_FILE_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

function getStatusClasses(status: Job["status"]): string {
  switch (status) {
    case "completed":
      return "bg-success-soft text-success";
    case "failed":
    case "needs_review":
      return "bg-danger-soft text-danger";
    case "queued":
    case "preprocessing":
    case "detecting_layout":
    case "cropping_figures":
    case "ocr_running":
    case "structuring":
    case "judging_figures":
    case "enhancing_figures":
    case "rendering_preview":
      return "bg-brand-soft text-brand";
    default:
      return "bg-surface-subtle text-muted";
  }
}

function formatTimestamp(value: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export default function HomePage() {
  const { t } = useConsolePreferences();
  const [job, setJob] = useState<Job | null>(null);
  const [document, setDocument] = useState<ProblemDocument | null>(null);
  const [timeline, setTimeline] = useState<TimelineStep[]>([]);
  const [modelCalls, setModelCalls] = useState<ModelCall[]>([]);
  const [assets, setAssets] = useState<FigureAsset[]>([]);
  const [qualityReport, setQualityReport] = useState<QualityReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [exportId, setExportId] = useState<string | null>(null);

  function validateFile(file: File): string | null {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return t.errors.invalidFileType;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return t.errors.fileTooLarge;
    }
    return null;
  }

  async function handleFile(file: File | null) {
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError(null);
    setExportId(null);

    try {
      const created = await createJob(file);
      setJob(created);

      const results = await Promise.allSettled([
        getDocument(created.job_id),
        listTimeline(created.job_id),
        listModelCalls(created.job_id),
        listAssets(created.job_id),
        getQualityReport(created.job_id),
      ]);

      const errors: string[] = [];

      const [documentResult, timelineResult, modelCallsResult, assetsResult, qualityResult] =
        results;

      if (documentResult.status === "fulfilled") {
        setDocument(documentResult.value);
      } else {
        errors.push(documentResult.reason instanceof Error ? documentResult.reason.message : String(documentResult.reason));
      }

      if (timelineResult.status === "fulfilled") {
        setTimeline(timelineResult.value);
      } else {
        errors.push(timelineResult.reason instanceof Error ? timelineResult.reason.message : String(timelineResult.reason));
      }

      if (modelCallsResult.status === "fulfilled") {
        setModelCalls(modelCallsResult.value);
      } else {
        errors.push(modelCallsResult.reason instanceof Error ? modelCallsResult.reason.message : String(modelCallsResult.reason));
      }

      if (assetsResult.status === "fulfilled") {
        setAssets(assetsResult.value);
      } else {
        errors.push(assetsResult.reason instanceof Error ? assetsResult.reason.message : String(assetsResult.reason));
      }

      if (qualityResult.status === "fulfilled") {
        setQualityReport(qualityResult.value);
      } else {
        errors.push(qualityResult.reason instanceof Error ? qualityResult.reason.message : String(qualityResult.reason));
      }

      if (errors.length > 0) {
        setError(errors.join("; "));
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t.actions.unknownUploadError);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleExport() {
    if (!job) return;
    setExportId(null);
    setError(null);
    try {
      const artifact = await createExport(job.job_id, "markdown");
      setExportId(artifact.export_id);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t.actions.exportFailed);
    }
  }

  return (
    <AppShell>
      <main className="grid gap-3.5 px-7 py-4">
        <section className="flex items-end justify-between gap-5 max-[900px]:items-start max-[900px]:flex-col">
          <div>
            <a href="#" className="text-sm text-info">{t.actions.backToJobs}</a>
            <h1 className="mt-2 text-2xl font-bold">
              {job ? `Job ${job.job_id}` : t.panels.newJob}{" "}
              <span className={`rounded-md px-2 py-1 text-sm ${job ? getStatusClasses(job.status) : "bg-surface-subtle text-muted"}`}>
                {job?.status ?? "-"}
              </span>
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted">
              <span>{t.panels.jobId}: {job?.job_id ?? "-"}</span>
              <span>{t.panels.createdAt}: {formatTimestamp(job?.created_at ?? null)}</span>
              <span>{t.panels.mode}: {job?.mode ?? "-"}</span>
              <span>{t.panels.qualityPolicy}: {job?.quality_policy ?? "-"}</span>
              <input
                className="max-w-56 rounded-md border border-border bg-surface px-2 py-1 text-sm"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                disabled={isLoading}
                onChange={(event) => {
                  handleFile(event.target.files?.[0] ?? null).catch((caught) => {
                    setError(caught instanceof Error ? caught.message : t.actions.unknownUploadError);
                  });
                }}
              />
            </div>
            {error ? <p className="mt-2 rounded-md bg-danger-soft px-3 py-2 text-sm text-danger" role="alert">{error}</p> : null}
            {isLoading ? <p className="mt-2 text-sm text-muted">{t.panels.loading}</p> : null}
            {exportId ? <p className="mt-2 rounded-md bg-success-soft px-3 py-2 text-sm text-success">{t.panels.exportCreated}: {exportId}</p> : null}
          </div>
          <div className="flex gap-2.5">
            <button
              className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-surface px-3 text-sm hover:bg-surface-subtle disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!job}
            >
              <RotateCcw size={15} />{t.actions.rerun}
            </button>
            <button
              className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-surface px-3 text-sm hover:bg-surface-subtle disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!job}
            >
              <Share2 size={15} />{t.actions.share}
            </button>
            <button
              className="inline-flex h-9 items-center gap-2 rounded-md bg-brand px-3 text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!job || isLoading}
              onClick={handleExport}
            >
              <Download size={15} />{t.actions.export}
            </button>
          </div>
        </section>
        <PipelineStepper steps={timeline} />
        <section className="grid grid-cols-[minmax(330px,0.92fr)_minmax(420px,1.05fr)_minmax(380px,0.94fr)] items-start gap-3 max-[1180px]:grid-cols-1">
          <SourceImagePanel jobId={job?.job_id ?? null} document={document} assets={assets} />
          <StructuredPreview document={document} />
          <div>
            <DiagnosticsPanel
              jobId={job?.job_id ?? null}
              document={document}
              modelCalls={modelCalls}
              qualityReport={qualityReport}
              assets={assets}
            />
            <QualitySidebar qualityReport={qualityReport} />
          </div>
        </section>
      </main>
    </AppShell>
  );
}
