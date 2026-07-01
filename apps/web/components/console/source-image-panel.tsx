"use client";

import { Maximize2, Plus, RefreshCw, Search, Settings, SunMedium } from "lucide-react";

import { useConsolePreferences } from "@/components/providers/console-preferences-provider";

type SourceImagePanelProps = {
  assets?: unknown[];
};

export function SourceImagePanel({ assets = [] }: SourceImagePanelProps) {
  const { t } = useConsolePreferences();
  const crops = assets.length
    ? assets.map((asset, index) => ({
        id: typeof asset === "object" && asset && "figure_id" in asset ? String(asset.figure_id) : `fig_${index + 1}`,
        score: index === 0 ? "0.82" : index === 1 ? "0.91" : "0.65",
      }))
    : [
        { id: "fig_1", score: "0.82" },
        { id: "fig_2", score: "0.91" },
        { id: "fig_3", score: "0.65" },
      ];

  return (
    <aside className="grid gap-3">
      <section className="rounded-lg border border-border bg-surface p-4 shadow-panel">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">{t.panels.sourceImage}</h2>
          <button className="grid h-8 w-8 place-items-center rounded-md border border-border bg-surface hover:bg-surface-subtle" aria-label={t.panels.refreshSource}>
            <RefreshCw size={15} />
          </button>
        </div>
        <div className="relative h-96 overflow-hidden rounded-md border border-border bg-surface-subtle">
          <div className="flex gap-2 p-2.5">
            {[Search, Search, Search, Maximize2, SunMedium].map((Icon, index) => (
              <button key={index} className="grid h-8 w-8 place-items-center rounded-md border border-border bg-surface hover:bg-surface-subtle" aria-label={`Image tool ${index + 1}`}>
                <Icon size={14} />
              </button>
            ))}
          </div>
          <div className="absolute inset-x-7 bottom-3 top-14 rounded-md bg-white shadow-inner dark:bg-surface">
            <div className="absolute left-[6%] top-[8%] h-[20%] w-[88%] rounded border-2 border-info bg-info-soft/40" />
            <div className="absolute left-[8%] top-[31%] h-[40%] w-[84%] rounded border-2 border-brand bg-brand-soft/30" />
            <div className="absolute left-[8%] top-[76%] h-[17%] w-[84%] rounded border-2 border-success bg-success-soft/40" />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {["Text", "Formula", "Figure", "Low Conf.", "Unknown"].map((item) => (
            <span key={item} className="rounded-md border border-border bg-surface-subtle px-2 py-1 text-xs text-muted">{item}</span>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-border bg-surface p-4 shadow-panel">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">{t.panels.figureCrops}</h2>
          <button className="grid h-8 w-8 place-items-center rounded-md border border-border bg-surface hover:bg-surface-subtle" aria-label={t.panels.cropSettings}>
            <Settings size={15} />
          </button>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {crops.map((crop, index) => (
            <div key={crop.id} className={`grid h-24 w-28 content-between rounded-md border bg-surface p-2 ${index === 0 ? "border-brand ring-1 ring-brand" : "border-border"}`}>
              <div className="text-2xl">{index === 0 ? "∠" : "√"}</div>
              <strong className="text-sm">{crop.id}</strong>
              <span className={index === 2 ? "text-warning" : "text-brand"}>{crop.score}</span>
            </div>
          ))}
          <button className="grid h-24 w-28 place-items-center rounded-md border border-dashed border-border bg-surface text-sm text-muted hover:bg-surface-subtle" aria-label="Create new crop">
            <Plus size={18} />
            <span>{t.panels.newCrop}</span>
          </button>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-surface p-4 shadow-panel">
        <h2 className="mb-3 text-sm font-semibold">{t.panels.imageInfo}</h2>
        <div className="grid gap-2 text-sm text-muted">
          <span>File Name: question_001.png</span>
          <span>Size: 2480 x 3508</span>
          <span>Format: PNG</span>
          <span>File Size: 2.34 MB</span>
        </div>
      </section>
    </aside>
  );
}
