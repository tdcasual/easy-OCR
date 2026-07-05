"use client";

import { ChevronRight, Maximize2 } from "lucide-react";

import { useConsolePreferences } from "@/components/providers/console-preferences-provider";
import type { ContentBlock, Problem, ProblemDocument } from "@/lib/types";

type StructuredPreviewProps = {
  document: ProblemDocument | null;
};

function BlockContent({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case "paragraph":
      return (
        <div className="my-2 rounded-md border border-info/30 bg-info-soft p-3 text-sm leading-7">
          {block.text}
        </div>
      );
    case "formula":
      return (
        <div className="my-2 rounded-md border border-brand/30 bg-brand-soft/60 p-3 text-sm">
          {block.latex}
        </div>
      );
    case "figure_ref":
      return (
        <div className="my-2 rounded-md border border-brand/30 bg-brand-soft/60 p-3">
          <div className="mb-2 flex items-center justify-between">
            <strong>Figure: {block.figure_id}</strong>
          </div>
        </div>
      );
    case "choices":
      return (
        <div className="my-2 rounded-md border border-success/30 bg-success-soft/60 p-3">
          {block.items.map((item, index) => (
            <div key={item.label} className="my-1.5 grid grid-cols-[28px_1fr] gap-2 rounded-md bg-success-soft px-2 py-1.5">
              <span>{item.label || String.fromCharCode(65 + index)}</span>
              <span>{item.blocks.map((child) => child.type === "paragraph" ? child.text : child.type === "formula" ? child.latex : null).join("")}</span>
            </div>
          ))}
        </div>
      );
    case "table":
      return (
        <div className="my-2 overflow-auto rounded-md border border-border bg-surface-subtle p-3">
          <table className="w-full text-sm">
            <tbody>
              {block.rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="border border-border px-2 py-1">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "unknown":
      return (
        <div className="my-2 rounded-md border border-warning/30 bg-warning-soft p-3 text-sm text-warning">
          {block.raw_text}
        </div>
      );
    default:
      return null;
  }
}

function ProblemCard({ problem, index }: { problem: Problem; index: number }) {
  const { t } = useConsolePreferences();
  return (
    <article className="mb-4 rounded-lg border border-border p-3.5">
      <div className="mb-3 flex items-center gap-2.5">
        <strong>{t.panels.problem} {index + 1}</strong>
        {problem.confidence !== null && problem.confidence !== undefined ? (
          <span className="rounded-md border border-warning/30 bg-warning-soft px-2 py-1 text-xs text-warning">
            {t.panels.confidence}: {problem.confidence.toFixed(2)}
          </span>
        ) : null}
      </div>
      {problem.blocks.map((block) => (
        <BlockContent key={block.block_id} block={block} />
      ))}
      <button className="flex h-9 w-full items-center justify-between rounded-md border border-border bg-surface px-3 text-sm hover:bg-surface-subtle">
        {t.panels.answerExplanation} <ChevronRight size={15} />
      </button>
    </article>
  );
}

export function StructuredPreview({ document }: StructuredPreviewProps) {
  const { t } = useConsolePreferences();
  const problems = document?.problems ?? [];

  return (
    <section className="rounded-lg border border-border bg-surface p-4 shadow-panel">
      <div className="-mx-4 -mt-4 mb-4 flex gap-5 border-b border-border px-4">
        <button className="border-b-2 border-brand py-3 text-sm text-brand">{t.panels.structuredPreview}</button>
        <button className="border-b-2 border-transparent py-3 text-sm text-muted">{t.panels.edit}</button>
        <button className="ml-auto grid h-9 w-9 place-items-center rounded-md border border-border bg-surface hover:bg-surface-subtle" aria-label="Fullscreen preview">
          <Maximize2 size={14} />
        </button>
      </div>

      {problems.length > 0 ? problems.map((problem, index) => (
        <ProblemCard key={problem.problem_id} problem={problem} index={index} />
      )) : (
        <p className="text-sm text-muted">{t.panels.noDocument}</p>
      )}

      {document ? <pre className="mt-4 overflow-auto whitespace-pre-wrap rounded-md bg-surface-subtle p-3 text-xs">{JSON.stringify(document, null, 2)}</pre> : null}
    </section>
  );
}
