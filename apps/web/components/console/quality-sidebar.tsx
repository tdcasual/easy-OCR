"use client";

import { AlertTriangle } from "lucide-react";

import { useConsolePreferences } from "@/components/providers/console-preferences-provider";
import type { QualityReport, Severity } from "@/lib/types";

type QualitySidebarProps = {
  qualityReport: QualityReport | null;
};

const SEVERITY_ORDER: Severity[] = ["info", "warning", "error", "critical"];

function getHighestSeverity(items: QualityReport["items"]): Severity | null {
  for (let index = SEVERITY_ORDER.length - 1; index >= 0; index -= 1) {
    if (items.some((item) => item.severity === SEVERITY_ORDER[index])) {
      return SEVERITY_ORDER[index];
    }
  }
  return null;
}

function getRiskClasses(severity: Severity | null): string {
  switch (severity) {
    case "critical":
      return "border-danger/30 bg-danger-soft text-danger";
    case "error":
      return "border-warning/30 bg-warning-soft text-warning";
    case "warning":
      return "border-warning/30 bg-warning-soft text-warning";
    case "info":
      return "border-info/30 bg-info-soft text-info";
    default:
      return "border-border bg-surface-subtle text-muted";
  }
}

export function QualitySidebar({ qualityReport }: QualitySidebarProps) {
  const { t } = useConsolePreferences();
  const items = qualityReport?.items ?? [];
  const counts = {
    info: items.filter((item) => item.severity === "info").length,
    warning: items.filter((item) => item.severity === "warning").length,
    error: items.filter((item) => item.severity === "error").length,
    critical: items.filter((item) => item.severity === "critical").length,
  };
  const total = items.length;
  const risk = getHighestSeverity(items);
  const topIssues = items.slice(0, 3);

  return (
    <div className="mt-3 grid gap-3">
      <section className="grid grid-cols-[110px_1fr] items-center gap-4 rounded-lg border border-border bg-surface p-4 shadow-panel">
        <div className="grid h-24 w-24 place-items-center rounded-full bg-[conic-gradient(hsl(var(--info))_0_55%,hsl(var(--warning))_55%_82%,hsl(var(--danger))_82%_94%,hsl(var(--brand))_94%_100%)]">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-surface font-bold">{total}</div>
        </div>
        <div>
          <h3 className="font-semibold">{t.panels.qualitySummary}</h3>
          <p className="text-sm text-muted">
            {t.quality.info}: {counts.info} · {t.quality.warning}: {counts.warning} · {t.quality.error}: {counts.error} · {t.quality.critical}: {counts.critical}
          </p>
        </div>
      </section>
      <section className="rounded-lg border border-border bg-surface p-4 shadow-panel">
        <h3 className="font-semibold">{t.panels.riskLevel}</h3>
        <p className={`mt-2 inline-flex items-center gap-2 rounded-md border px-2 py-1 text-sm ${getRiskClasses(risk)}`}>
          <AlertTriangle size={15} />
          {risk ? t.quality.riskLevels[risk] : t.quality.riskLevels.none}
        </p>
        <p className="mt-2 text-sm text-muted">{risk ? t.quality.riskSummaries[risk] : t.quality.noIssues}</p>
      </section>
      <section className="rounded-lg border border-border bg-surface p-4 shadow-panel">
        <h3 className="font-semibold">{t.panels.topIssues}</h3>
        <div className="mt-3 grid gap-2 text-sm text-muted">
          {topIssues.length > 0 ? topIssues.map((item, index) => (
            <p key={index}>[{item.severity}] {item.message}</p>
          )) : <p>{t.quality.noIssues}</p>}
        </div>
      </section>
    </div>
  );
}
