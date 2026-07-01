"use client";

import { AlertTriangle } from "lucide-react";

import { useConsolePreferences } from "@/components/providers/console-preferences-provider";

type QualitySidebarProps = {
  qualityReport?: unknown;
};

export function QualitySidebar({ qualityReport }: QualitySidebarProps) {
  const { t } = useConsolePreferences();
  return (
    <div className="mt-3 grid gap-3">
      <section className="grid grid-cols-[110px_1fr] items-center gap-4 rounded-lg border border-border bg-surface p-4 shadow-panel">
        <div className="grid h-24 w-24 place-items-center rounded-full bg-[conic-gradient(hsl(var(--info))_0_55%,hsl(var(--warning))_55%_82%,hsl(var(--danger))_82%_94%,hsl(var(--brand))_94%_100%)]">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-surface font-bold">9</div>
        </div>
        <div>
          <h3 className="font-semibold">{t.panels.qualitySummary}</h3>
          <p className="text-sm text-muted">Info 5 · Warning 3 · Error 1 · Critical 0</p>
        </div>
      </section>
      <section className="rounded-lg border border-border bg-surface p-4 shadow-panel">
        <h3 className="font-semibold">{t.panels.riskLevel}</h3>
        <p className="mt-2 inline-flex items-center gap-2 rounded-md border border-warning/30 bg-warning-soft px-2 py-1 text-sm text-warning">
          <AlertTriangle size={15} />
          Warning
        </p>
        <p className="mt-2 text-sm text-muted">存在 3 个中等风险问题</p>
      </section>
      <section className="rounded-lg border border-border bg-surface p-4 shadow-panel">
        <h3 className="font-semibold">{t.panels.topIssues}</h3>
        <div className="mt-3 grid gap-2 text-sm text-muted">
          <p>fig_3 图像清晰度较低</p>
          <p>公式区域置信度较低 (Problem 2)</p>
          <p>选项 C 可能存在 OCR 错误</p>
        </div>
        {qualityReport ? <pre className="mt-4 overflow-auto whitespace-pre-wrap rounded-md bg-surface-subtle p-3 text-xs">{JSON.stringify(qualityReport, null, 2)}</pre> : null}
      </section>
    </div>
  );
}
