"use client";

import { Download, RotateCcw, Share2 } from "lucide-react";

import { PipelineStepper } from "@/components/console/pipeline-stepper";
import { SourceImagePanel } from "@/components/console/source-image-panel";
import { StructuredPreview } from "@/components/console/structured-preview";
import { DiagnosticsPanel } from "@/components/console/diagnostics-panel";
import { QualitySidebar } from "@/components/console/quality-sidebar";
import { AppShell } from "@/components/layout/app-shell";
import { useConsolePreferences } from "@/components/providers/console-preferences-provider";

export default function HomePage() {
  const { t } = useConsolePreferences();
  return (
    <AppShell>
      <main className="grid gap-3.5 px-7 py-4">
        <section className="flex items-end justify-between gap-5">
          <div>
            <a href="#" className="text-sm text-info">{t.actions.backToJobs}</a>
            <h1 className="mt-2 text-2xl font-bold">Job #20240520-0001 <span className="rounded-md bg-success-soft px-2 py-1 text-sm text-success">Completed</span></h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted">
              <span>Created: 2024-05-20 10:21:03</span>
              <span>Mode: debug</span>
              <span>Policy: report_only</span>
            </div>
          </div>
          <div className="flex gap-2.5">
            <button className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-surface px-3 text-sm hover:bg-surface-subtle"><RotateCcw size={15} />{t.actions.rerun}</button>
            <button className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-surface px-3 text-sm hover:bg-surface-subtle"><Share2 size={15} />{t.actions.share}</button>
            <button className="inline-flex h-9 items-center gap-2 rounded-md bg-brand px-3 text-sm text-white"><Download size={15} />{t.actions.export}</button>
          </div>
        </section>
        <PipelineStepper />
        <section className="grid grid-cols-[minmax(330px,0.92fr)_minmax(420px,1.05fr)_minmax(380px,0.94fr)] items-start gap-3 max-[1180px]:grid-cols-1">
          <SourceImagePanel />
          <StructuredPreview />
          <div>
            <DiagnosticsPanel />
            <QualitySidebar />
          </div>
        </section>
      </main>
    </AppShell>
  );
}
