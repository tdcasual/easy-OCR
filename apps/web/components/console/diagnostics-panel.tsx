"use client";

import { Box, Eye, ImageIcon } from "lucide-react";

import { useConsolePreferences } from "@/components/providers/console-preferences-provider";
import type { ModelCall } from "@/lib/api";
import { mockModelCalls } from "@/lib/mock-data";

type DiagnosticsPanelProps = {
  document?: unknown;
  modelCalls?: ModelCall[] | unknown[];
};

export function DiagnosticsPanel({ document, modelCalls = mockModelCalls }: DiagnosticsPanelProps) {
  const { t } = useConsolePreferences();
  const calls = modelCalls.length ? modelCalls : mockModelCalls;
  const tabs = [
    t.diagnostics.json,
    t.diagnostics.modelCalls,
    t.diagnostics.exports,
    t.diagnostics.qualityReport,
    t.diagnostics.issues,
    t.diagnostics.assets,
  ];
  return (
    <section className="rounded-lg border border-border bg-surface p-4 shadow-panel">
      <div className="-mx-4 -mt-4 mb-4 flex gap-5 overflow-x-auto border-b border-border px-4">
        {tabs.map((tab) => (
          <button key={tab} className={`whitespace-nowrap border-b-2 py-3 text-sm ${tab === t.diagnostics.modelCalls ? "border-brand text-brand" : "border-transparent text-muted"}`}>
            {tab}
          </button>
        ))}
      </div>
      {calls.map((call, index) => {
        const typed = call as ModelCall;
        const Icon = index === 0 ? Eye : index === 1 ? Box : ImageIcon;
        return (
          <div key={typed.model_call_id ?? index} className="grid grid-cols-[72px_28px_1fr_auto] gap-3 border-b border-border py-3 text-sm">
            <span className="text-muted">10:21:{String(index * 3 + 4).padStart(2, "0")}</span>
            <Icon size={18} />
            <div>
              <strong>{typed.role}</strong>
              <div className="text-xs text-muted">{typed.model} · Prompt {typed.prompt_version}</div>
              <div className="text-xs text-muted">Input: {(typed.input_assets ?? []).join(", ")}</div>
              {typed.warning ? <div className="mt-2 rounded-md border border-warning/30 bg-warning-soft px-2 py-1 text-xs text-warning">{typed.warning}</div> : null}
            </div>
            <div className="text-right">
              <span className={`rounded-md px-2 py-1 text-xs ${typed.status === "success" ? "bg-success-soft text-success" : "bg-warning-soft text-warning"}`}>{typed.status}</span>
              <div className="mt-1.5 text-xs text-muted">{typed.latency_seconds}s · {typed.token_count} tokens</div>
            </div>
          </div>
        );
      })}
      {document ? <pre className="mt-4 overflow-auto whitespace-pre-wrap rounded-md bg-surface-subtle p-3 text-xs">{JSON.stringify(document, null, 2)}</pre> : null}
    </section>
  );
}
