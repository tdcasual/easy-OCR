"use client";

import { useState } from "react";
import { Box, Eye, ImageIcon } from "lucide-react";

import { useConsolePreferences } from "@/components/providers/console-preferences-provider";
import { getAssetUrl } from "@/lib/api";
import type { FigureAsset, ModelCall, ProblemDocument, QualityReport, Severity } from "@/lib/types";

type DiagnosticsPanelProps = {
  jobId: string | null;
  document: ProblemDocument | null;
  modelCalls: ModelCall[];
  qualityReport: QualityReport | null;
  assets: FigureAsset[];
};

const CALL_ICONS = [Eye, Box, ImageIcon];

function getModelCallStatusClasses(status: ModelCall["status"]): string {
  switch (status) {
    case "success":
      return "bg-success-soft text-success";
    case "warning":
    case "rate_limited":
    case "fallback_used":
      return "bg-warning-soft text-warning";
    case "timeout":
    case "parse_error":
    case "provider_error":
      return "bg-danger-soft text-danger";
    default:
      return "bg-surface-subtle text-muted";
  }
}

function getSeverityClasses(severity: Severity): string {
  switch (severity) {
    case "info":
      return "bg-info-soft text-info";
    case "warning":
      return "bg-warning-soft text-warning";
    case "error":
      return "bg-danger-soft text-danger";
    case "critical":
      return "bg-danger-soft text-danger";
    default:
      return "bg-surface-subtle text-muted";
  }
}

export function DiagnosticsPanel({
  jobId,
  document,
  modelCalls,
  qualityReport,
  assets,
}: DiagnosticsPanelProps) {
  const { t } = useConsolePreferences();
  const tabs = [
    t.diagnostics.json,
    t.diagnostics.modelCalls,
    t.diagnostics.exports,
    t.diagnostics.qualityReport,
    t.diagnostics.issues,
    t.diagnostics.assets,
  ];
  const [activeTab, setActiveTab] = useState<string>(t.diagnostics.modelCalls);

  return (
    <section className="rounded-lg border border-border bg-surface p-4 shadow-panel">
      <div className="-mx-4 -mt-4 mb-4 flex gap-5 overflow-x-auto border-b border-border px-4">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`whitespace-nowrap border-b-2 py-3 text-sm ${tab === activeTab ? "border-brand text-brand" : "border-transparent text-muted"}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === t.diagnostics.json && (
        document ? (
          <pre className="overflow-auto whitespace-pre-wrap rounded-md bg-surface-subtle p-3 text-xs">{JSON.stringify(document, null, 2)}</pre>
        ) : (
          <p className="text-sm text-muted">{t.diagnostics.noDocument}</p>
        )
      )}

      {activeTab === t.diagnostics.modelCalls && (
        modelCalls.length > 0 ? modelCalls.map((call, index) => {
          const Icon = CALL_ICONS[index % CALL_ICONS.length];
          return (
            <div key={call.model_call_id ?? index} className="grid grid-cols-[72px_28px_1fr_auto] gap-3 border-b border-border py-3 text-sm">
              <span className="text-muted">{call.role}</span>
              <Icon size={18} />
              <div>
                <strong>{call.role}</strong>
                <div className="text-xs text-muted">{call.model} · Prompt {call.prompt_version}</div>
                <div className="text-xs text-muted">Input: {(call.input_assets ?? []).join(", ")}</div>
                {call.warning ? <div className="mt-2 rounded-md border border-warning/30 bg-warning-soft px-2 py-1 text-xs text-warning">{call.warning}</div> : null}
              </div>
              <div className="text-right">
                <span className={`rounded-md px-2 py-1 text-xs ${getModelCallStatusClasses(call.status)}`}>{call.status}</span>
                <div className="mt-1.5 text-xs text-muted">{call.latency_seconds ?? "-"}s · {call.token_count ?? "-"} tokens</div>
              </div>
            </div>
          );
        }) : (
          <p className="text-sm text-muted">{t.diagnostics.noModelCalls}</p>
        )
      )}

      {activeTab === t.diagnostics.exports && (
        <p className="text-sm text-muted">{t.diagnostics.noExports}</p>
      )}

      {activeTab === t.diagnostics.qualityReport && (
        qualityReport && qualityReport.items.length > 0 ? (
          <ul className="grid gap-2 text-sm">
            {qualityReport.items.map((item, index) => (
              <li key={index} className="rounded-md border border-border bg-surface-subtle p-2">
                <span className={`rounded px-1.5 py-0.5 text-xs ${getSeverityClasses(item.severity)}`}>{item.severity}</span>
                <span className="ml-2 text-muted">[{item.category}]</span>
                <span className="ml-2">{item.message}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">{t.diagnostics.noQualityReport}</p>
        )
      )}

      {activeTab === t.diagnostics.issues && (
        <p className="text-sm text-muted">{t.diagnostics.noIssues}</p>
      )}

      {activeTab === t.diagnostics.assets && (
        assets.length > 0 ? (
          <ul className="grid gap-2 text-sm">
            {assets.map((asset) => (
              <li key={asset.figure_id} className="rounded-md border border-border bg-surface-subtle p-2">
                <a
                  href={jobId ? getAssetUrl(jobId, asset.figure_id) : "#"}
                  className="text-info hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {asset.figure_id}
                </a>
                <span className="ml-2 text-muted">score: {asset.quality_score?.toFixed(2) ?? "-"}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">{t.diagnostics.noAssets}</p>
        )
      )}
    </section>
  );
}
