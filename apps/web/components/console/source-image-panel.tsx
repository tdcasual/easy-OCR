"use client";

import { useRef, useState } from "react";
import { Maximize2, Plus, RefreshCw, Search, Settings, SunMedium } from "lucide-react";

import { useConsolePreferences } from "@/components/providers/console-preferences-provider";
import { getAssetUrl, getSourceImageUrl } from "@/lib/api";
import type { FigureAsset, ProblemDocument } from "@/lib/types";

type SourceImagePanelProps = {
  jobId: string | null;
  document: ProblemDocument | null;
  assets: FigureAsset[];
};

const BOX_COLORS = [
  "border-info bg-info-soft/40",
  "border-brand bg-brand-soft/30",
  "border-success bg-success-soft/40",
  "border-warning bg-warning-soft/40",
  "border-danger bg-danger-soft/40",
];

type ImageLayout = {
  scale: number;
  offsetX: number;
  offsetY: number;
};

function getFileExtension(filename: string): string {
  const dotIndex = filename.lastIndexOf(".");
  return dotIndex > 0 ? filename.slice(dotIndex + 1).toUpperCase() : "-";
}

export function SourceImagePanel({ jobId, document, assets }: SourceImagePanelProps) {
  const { t } = useConsolePreferences();
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [layout, setLayout] = useState<ImageLayout>({ scale: 1, offsetX: 0, offsetY: 0 });
  const sourceImage = document?.source_image;

  function updateLayout() {
    const container = containerRef.current;
    const image = imageRef.current;
    if (!container || !image) return;

    const containerRect = container.getBoundingClientRect();
    const imageRect = image.getBoundingClientRect();
    const naturalWidth = image.naturalWidth || sourceImage?.width || 1;
    const naturalHeight = image.naturalHeight || sourceImage?.height || 1;
    if (!naturalWidth || !naturalHeight) return;

    const scaleX = imageRect.width / naturalWidth;
    const scaleY = imageRect.height / naturalHeight;
    const scale = Math.min(scaleX, scaleY);
    const renderedWidth = naturalWidth * scale;
    const renderedHeight = naturalHeight * scale;
    const offsetX = imageRect.left - containerRect.left + (imageRect.width - renderedWidth) / 2;
    const offsetY = imageRect.top - containerRect.top + (imageRect.height - renderedHeight) / 2;

    setLayout({ scale, offsetX, offsetY });
  }

  const boxes = assets.map((asset, index) => {
    const [x, y, width, height] = asset.bbox;
    return {
      id: asset.figure_id,
      left: layout.offsetX + x * layout.scale,
      top: layout.offsetY + y * layout.scale,
      width: width * layout.scale,
      height: height * layout.scale,
      colorClass: BOX_COLORS[index % BOX_COLORS.length],
    };
  });

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
          <div ref={containerRef} className="absolute inset-x-7 bottom-3 top-14 rounded-md bg-white shadow-inner dark:bg-surface">
            {jobId && sourceImage ? (
              <img
                ref={imageRef}
                src={getSourceImageUrl(jobId)}
                alt={sourceImage.filename}
                className="h-full w-full object-contain"
                onLoad={updateLayout}
              />
            ) : (
              <div className="grid h-full place-items-center text-sm text-muted">{t.panels.noSourceImage}</div>
            )}
            {boxes.map((box) => (
              <div
                key={box.id}
                className={`absolute rounded border-2 ${box.colorClass}`}
                style={{
                  left: box.left,
                  top: box.top,
                  width: box.width,
                  height: box.height,
                }}
                title={box.id}
              />
            ))}
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
          {assets.map((asset, index) => (
            <div key={asset.figure_id} className={`grid h-24 w-28 content-between rounded-md border bg-surface p-2 ${index === 0 ? "border-brand ring-1 ring-brand" : "border-border"}`}>
              {jobId ? (
                <img
                  src={getAssetUrl(jobId, asset.figure_id)}
                  alt={asset.figure_id}
                  className="h-10 w-full object-contain"
                />
              ) : (
                <div className="grid h-10 place-items-center text-xl">{index === 0 ? "∠" : "√"}</div>
              )}
              <strong className="text-sm">{asset.figure_id}</strong>
              <span className={index === 0 ? "text-brand" : "text-muted"}>{asset.quality_score?.toFixed(2) ?? "-"}</span>
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
          <span>{t.panels.fileName}: {sourceImage?.filename ?? "-"}</span>
          <span>{t.panels.dimensions}: {sourceImage?.width ?? "-"} x {sourceImage?.height ?? "-"}</span>
          <span>{t.panels.format}: {sourceImage ? getFileExtension(sourceImage.filename) : "-"}</span>
          <span>{t.panels.fileSize}: -</span>
        </div>
      </section>
    </aside>
  );
}
