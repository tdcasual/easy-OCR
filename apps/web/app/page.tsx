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
  createJob,
  getDocument,
  getQualityReport,
  listAssets,
  listModelCalls,
  listTimeline,
  type Job,
  type ModelCall,
  type TimelineStep,
} from "@/lib/api";

export default function HomePage() {
  const { t } = useConsolePreferences();
  const [job, setJob] = useState<Job | null>(null);
  const [document, setDocument] = useState<unknown>(null);
  const [timeline, setTimeline] = useState<TimelineStep[]>([]);
  const [modelCalls, setModelCalls] = useState<ModelCall[]>([]);
  const [assets, setAssets] = useState<unknown[]>([]);
  const [qualityReport, setQualityReport] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | null) {
    if (!file) return;
    setError(null);
    const created = await createJob(file);
    setJob(created);
    const [loadedDocument, loadedTimeline, loadedModelCalls, loadedAssets, loadedQualityReport] =
      await Promise.all([
        getDocument(created.job_id),
        listTimeline(created.job_id),
        listModelCalls(created.job_id),
        listAssets(created.job_id),
        getQualityReport(created.job_id),
      ]);
    setDocument(loadedDocument);
    setTimeline(loadedTimeline);
    setModelCalls(loadedModelCalls);
    setAssets(loadedAssets);
    setQualityReport(loadedQualityReport);
  }

  return (
    <AppShell>
      <main className="grid gap-3.5 px-7 py-4">
        <section className="flex items-end justify-between gap-5 max-[900px]:items-start max-[900px]:flex-col">
          <div>
            <a href="#" className="text-sm text-info">{t.actions.backToJobs}</a>
            <h1 className="mt-2 text-2xl font-bold">
              {job ? `Job ${job.job_id}` : "Job #20240520-0001"}{" "}
              <span className="rounded-md bg-success-soft px-2 py-1 text-sm text-success">
                {job?.status ?? "Completed"}
              </span>
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted">
              <span>Mode: {job?.mode ?? "debug"}</span>
              <span>Policy: {job?.quality_policy ?? "report_only"}</span>
              <input
                className="max-w-56 rounded-md border border-border bg-surface px-2 py-1 text-sm"
                type="file"
                accept="image/*"
                onChange={(event) => {
                  handleFile(event.target.files?.[0] ?? null).catch((caught) => {
                    setError(caught instanceof Error ? caught.message : t.actions.unknownUploadError);
                  });
                }}
              />
            </div>
            {error ? <p className="mt-2 rounded-md bg-danger-soft px-3 py-2 text-sm text-danger" role="alert">{error}</p> : null}
          </div>
          <div className="flex gap-2.5">
            <button className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-surface px-3 text-sm hover:bg-surface-subtle"><RotateCcw size={15} />{t.actions.rerun}</button>
            <button className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-surface px-3 text-sm hover:bg-surface-subtle"><Share2 size={15} />{t.actions.share}</button>
            <button className="inline-flex h-9 items-center gap-2 rounded-md bg-brand px-3 text-sm text-white"><Download size={15} />{t.actions.export}</button>
          </div>
        </section>
        <PipelineStepper steps={timeline} />
        <section className="grid grid-cols-[minmax(330px,0.92fr)_minmax(420px,1.05fr)_minmax(380px,0.94fr)] items-start gap-3 max-[1180px]:grid-cols-1">
          <SourceImagePanel assets={assets} />
          <StructuredPreview document={document} />
          <div>
            <DiagnosticsPanel document={document} modelCalls={modelCalls} />
            <QualitySidebar qualityReport={qualityReport} />
          </div>
        </section>
      </main>
    </AppShell>
  );
}
