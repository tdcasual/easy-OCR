import { AlertTriangle, Check } from "lucide-react";

import type { TimelineStep } from "@/lib/api";
import { mockTimeline } from "@/lib/mock-data";

export function PipelineStepper({ steps = mockTimeline }: { steps?: TimelineStep[] }) {
  const displaySteps = steps.length ? steps : mockTimeline;
  return (
    <section className="mx-auto w-full max-w-3xl rounded-lg border border-border bg-surface px-5 py-4 shadow-panel" aria-label="OCR pipeline progress">
      <div className="grid grid-cols-9 items-center">
        {displaySteps.map((step) => (
          <div key={step.key} className="relative grid justify-items-center gap-2 text-xs text-muted before:absolute before:left-[-50%] before:right-1/2 before:top-2 before:h-0.5 before:bg-success first:before:hidden">
            <span className={`z-10 grid h-4 w-4 place-items-center rounded-full text-white ${step.status === "warning" ? "bg-warning" : "bg-success"}`}>
              {step.status === "warning" ? <AlertTriangle size={11} /> : <Check size={11} />}
            </span>
            <span className="truncate px-1">{step.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
