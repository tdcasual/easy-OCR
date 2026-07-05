import type { ReactNode } from "react";
import { AlertTriangle, Check, Loader2, X } from "lucide-react";

import type { TimelineStep } from "@/lib/api";

type PipelineStepperProps = {
  steps: TimelineStep[];
};

function getStepClasses(status: TimelineStep["status"]): {
  bg: string;
  icon: ReactNode;
} {
  switch (status) {
    case "completed":
      return { bg: "bg-success", icon: <Check size={11} /> };
    case "running":
      return { bg: "bg-brand", icon: <Loader2 size={11} className="animate-spin" /> };
    case "warning":
      return { bg: "bg-warning", icon: <AlertTriangle size={11} /> };
    case "failed":
      return { bg: "bg-danger", icon: <X size={11} /> };
    case "pending":
    default:
      return { bg: "bg-surface-subtle", icon: <span className="h-2 w-2 rounded-full bg-muted" /> };
  }
}

function getConnectorClasses(status: TimelineStep["status"]): string {
  switch (status) {
    case "completed":
      return "bg-success";
    case "failed":
    case "warning":
      return "bg-warning";
    case "running":
      return "bg-brand";
    case "pending":
    default:
      return "bg-border";
  }
}

export function PipelineStepper({ steps }: PipelineStepperProps) {
  if (!steps.length) {
    return (
      <section className="mx-auto w-full max-w-3xl rounded-lg border border-border bg-surface px-5 py-4 shadow-panel" aria-label="OCR pipeline progress">
        <div className="text-center text-sm text-muted">-</div>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-3xl rounded-lg border border-border bg-surface px-5 py-4 shadow-panel" aria-label="OCR pipeline progress">
      <div className="grid grid-cols-9 items-center">
        {steps.map((step, index) => {
          const { bg, icon } = getStepClasses(step.status);
          const isLast = index === steps.length - 1;
          return (
            <div key={step.key} className="relative grid justify-items-center gap-2 text-xs text-muted">
              {!isLast && (
                <span className={`absolute left-1/2 right-[-50%] top-2 h-0.5 ${getConnectorClasses(step.status)}`} />
              )}
              <span className={`z-10 grid h-4 w-4 place-items-center rounded-full text-white ${bg}`}>
                {icon}
              </span>
              <span className="truncate px-1">{step.label}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
