"use client";

import { ChevronRight, Maximize2 } from "lucide-react";

import { useConsolePreferences } from "@/components/providers/console-preferences-provider";

type StructuredPreviewProps = {
  document?: unknown;
};

export function StructuredPreview({ document }: StructuredPreviewProps) {
  const { t } = useConsolePreferences();
  return (
    <section className="rounded-lg border border-border bg-surface p-4 shadow-panel">
      <div className="-mx-4 -mt-4 mb-4 flex gap-5 border-b border-border px-4">
        <button className="border-b-2 border-brand py-3 text-sm text-brand">{t.panels.structuredPreview}</button>
        <button className="border-b-2 border-transparent py-3 text-sm text-muted">{t.panels.edit}</button>
        <button className="ml-auto grid h-9 w-9 place-items-center rounded-md border border-border bg-surface hover:bg-surface-subtle" aria-label="Fullscreen preview">
          <Maximize2 size={14} />
        </button>
      </div>

      <article className="mb-4 rounded-lg border border-border p-3.5">
        <div className="mb-3 flex items-center gap-2.5">
          <strong>{t.panels.problem} 1</strong>
          <span className="rounded-md border border-warning/30 bg-warning-soft px-2 py-1 text-xs text-warning">{t.panels.confidence}: 0.86</span>
        </div>
        <div className="my-2 rounded-md border border-info/30 bg-info-soft p-3 text-sm leading-7">
          如图所示，物体从斜面上的 A 点由静止滑下，经过 B 点后水平飞出（不计空气阻力）。
        </div>
        <div className="my-2 rounded-md border border-brand/30 bg-brand-soft/60 p-3">
          <div className="mb-2 flex items-center justify-between">
            <strong>Figure: fig_1</strong>
            <span className="text-brand">0.82</span>
          </div>
          <div className="grid h-32 place-items-center text-4xl">h θ B →</div>
        </div>
        <div className="my-2 rounded-md border border-success/30 bg-success-soft/60 p-3">
          {["√(2h/g)", "√(2h/g) tan θ", "√(2h/g) cot θ", "2√(h/g)"].map((option, index) => (
            <div key={option} className="my-1.5 grid grid-cols-[28px_1fr] gap-2 rounded-md bg-success-soft px-2 py-1.5">
              <span>{String.fromCharCode(65 + index)}</span>
              <span>{option}</span>
            </div>
          ))}
        </div>
        <button className="flex h-9 w-full items-center justify-between rounded-md border border-border bg-surface px-3 text-sm hover:bg-surface-subtle">
          {t.panels.answerExplanation} <ChevronRight size={15} />
        </button>
      </article>

      <article className="rounded-lg border border-border p-3.5">
        <div className="mb-3 flex items-center gap-2.5">
          <strong>{t.panels.problem} 2</strong>
          <span className="rounded-md border border-warning/30 bg-warning-soft px-2 py-1 text-xs text-warning">{t.panels.lowConfidence}</span>
        </div>
        <div className="rounded-md border border-info/30 bg-info-soft p-3 text-sm leading-7">
          如图，电路中电源电动势为 E，内阻为 r，定值电阻为 R。
        </div>
      </article>

      {document ? <pre className="mt-4 overflow-auto whitespace-pre-wrap rounded-md bg-surface-subtle p-3 text-xs">{JSON.stringify(document, null, 2)}</pre> : null}
    </section>
  );
}
