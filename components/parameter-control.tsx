"use client";

import * as React from "react";
import { useState } from "react";
import { Info, ChevronDown } from "lucide-react";

import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { GROUPS, type ParamMeta } from "@/lib/pelton";

export function ParameterControl({
  meta,
  value,
  onChange,
}: {
  meta: ParamMeta;
  value: number;
  onChange: (v: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const group = GROUPS[meta.group];
  const decimals = meta.step < 0.01 ? 3 : meta.step < 1 ? 2 : 0;
  const clamp = (v: number) => Math.min(meta.max, Math.max(meta.min, v));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label className="flex items-center gap-1.5 text-sm text-foreground">
          <span className={cn("h-2 w-2 rounded-full", group.tint)} style={{ backgroundColor: group.hsl }} />
          <span>{meta.label}</span>
          <span className="font-mono text-xs text-muted-foreground">
            {meta.symbol}
            {meta.unit ? ` [${meta.unit}]` : ""}
          </span>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="text-muted-foreground transition-colors hover:text-foreground"
            aria-label={`${meta.label} の説明`}
          >
            <Info className="h-3.5 w-3.5" />
          </button>
        </Label>
        <Input
          type="number"
          value={Number.isFinite(value) ? value : ""}
          min={meta.min}
          max={meta.max}
          step={meta.step}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            if (!Number.isNaN(v)) onChange(clamp(v));
          }}
          className="h-8 w-24 text-right font-mono text-sm tabular-nums"
        />
      </div>

      <Slider
        value={[value]}
        min={meta.min}
        max={meta.max}
        step={meta.step}
        onValueChange={(vals) => onChange(vals[0])}
      />

      <div className="flex items-center justify-between gap-2 font-mono text-[10px] text-muted-foreground">
        <span>{meta.min.toFixed(decimals)}</span>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-1 truncate font-sans transition-colors hover:text-foreground"
        >
          <span className="truncate">{meta.short}</span>
          <ChevronDown className={cn("h-3 w-3 shrink-0 transition-transform", open && "rotate-180")} />
        </button>
        <span>{meta.max.toFixed(decimals)}</span>
      </div>

      {open && (
        <div className={cn("space-y-1.5 rounded-md border border-border p-2.5 text-xs", group.tint)}>
          <p className="leading-relaxed text-foreground/90">{meta.detail}</p>
          <p className="leading-relaxed text-muted-foreground">
            <span className="font-medium text-foreground/80">目安：</span>
            {meta.guide}
          </p>
        </div>
      )}
    </div>
  );
}
