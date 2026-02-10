"use client";

import { useEffect, useRef } from "react";
import {
  X,
  RotateCcw,
  Gauge,
  User,
  LayoutList,
  Percent,
  Clock,
  PoundSterling,
  SlidersHorizontal,
  MessageSquare,
} from "lucide-react";
import type { EstimationSettings } from "@/lib/types";
import { DEFAULT_SETTINGS } from "@/lib/types";

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  settings: EstimationSettings;
  onSettingsChange: (settings: EstimationSettings) => void;
}

function SliderRow({
  label,
  icon: Icon,
  value,
  onChange,
  min,
  max,
  step,
  unit,
  description,
}: {
  label: string;
  icon: React.ElementType;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  unit: string;
  description?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Icon className="w-3 h-3" />
          {label}
        </label>
        <span className="text-xs font-mono text-foreground">
          {value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        min={min}
        max={max}
        step={step}
        className="w-full accent-primary h-1.5"
      />
      {description && (
        <p className="text-[10px] text-muted mt-0.5">{description}</p>
      )}
    </div>
  );
}

function SegmentedControl({
  label,
  icon: Icon,
  options,
  value,
  onChange,
  description,
}: {
  label: string;
  icon: React.ElementType;
  options: { value: number; label: string }[];
  value: number;
  onChange: (v: number) => void;
  description?: string;
}) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
        <Icon className="w-3 h-3" />
        {label}
      </label>
      <div className="flex gap-1">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`flex-1 px-2 py-1.5 rounded-md text-xs font-medium transition-all ${
              value === opt.value
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-background text-muted-foreground hover:text-foreground border border-border"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {description && (
        <p className="text-[10px] text-muted mt-1">{description}</p>
      )}
    </div>
  );
}

export function SettingsModal({
  open,
  onClose,
  settings,
  onSettingsChange,
}: SettingsModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);

  if (!open) return null;

  function update(partial: Partial<EstimationSettings>) {
    onSettingsChange({ ...settings, ...partial });
  }

  function handleReset() {
    onSettingsChange({ ...DEFAULT_SETTINGS });
  }

  return (
    <div
      ref={overlayRef}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[5vh] overflow-y-auto"
    >
      <div className="bg-surface border border-border rounded-2xl w-full max-w-2xl mx-4 mb-8 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-primary" />
            <h2 className="text-base font-semibold">Estimation Settings</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground rounded-lg hover:bg-surface-hover transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Reset defaults
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-surface-hover text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-6">
          {/* AI Prompt Tuning */}
          <div>
            <h3 className="text-sm font-medium mb-3 text-muted-foreground uppercase tracking-wider">
              AI Prompt Tuning
            </h3>
            <div className="space-y-4">
              <SegmentedControl
                label="Estimation Style"
                icon={Gauge}
                value={settings.estimationStyle}
                onChange={(v) => update({ estimationStyle: v })}
                options={[
                  { value: 1, label: "Lean" },
                  { value: 2, label: "Realistic" },
                  { value: 3, label: "Padded" },
                ]}
                description="Lean = happy path, minimal padding. Padded = conservative, accounts for everything that could go wrong."
              />
              <SegmentedControl
                label="Developer Experience"
                icon={User}
                value={settings.developerExperience}
                onChange={(v) => update({ developerExperience: v })}
                options={[
                  { value: 1, label: "Expert" },
                  { value: 2, label: "Senior" },
                  { value: 3, label: "Mid" },
                  { value: 4, label: "Junior" },
                ]}
                description="Affects how the AI considers development speed and pattern familiarity."
              />
              <SegmentedControl
                label="Task Granularity"
                icon={LayoutList}
                value={settings.taskGranularity}
                onChange={(v) => update({ taskGranularity: v })}
                options={[
                  { value: 1, label: "Coarse" },
                  { value: 2, label: "Balanced" },
                  { value: 3, label: "Granular" },
                ]}
                description="Coarse = fewer bigger tasks (3-8). Granular = many small tasks with full visibility."
              />
            </div>
          </div>

          {/* Overhead Percentages */}
          <div>
            <h3 className="text-sm font-medium mb-3 text-muted-foreground uppercase tracking-wider">
              Overhead &amp; Buffers
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SliderRow
                label="Code Review"
                icon={Percent}
                value={settings.codeReviewPercent}
                onChange={(v) => update({ codeReviewPercent: v })}
                min={0}
                max={30}
                step={5}
                unit="%"
              />
              <SliderRow
                label="Testing"
                icon={Percent}
                value={settings.testingPercent}
                onChange={(v) => update({ testingPercent: v })}
                min={0}
                max={30}
                step={5}
                unit="%"
              />
              <SliderRow
                label="Project Management"
                icon={Percent}
                value={settings.projectManagementPercent}
                onChange={(v) => update({ projectManagementPercent: v })}
                min={0}
                max={30}
                step={5}
                unit="%"
              />
              <SliderRow
                label="Contingency"
                icon={Percent}
                value={settings.contingencyPercent}
                onChange={(v) => update({ contingencyPercent: v })}
                min={0}
                max={50}
                step={5}
                unit="%"
                description="Buffer on top of everything else"
              />
            </div>
          </div>

          {/* Complexity Multipliers */}
          <div>
            <h3 className="text-sm font-medium mb-3 text-muted-foreground uppercase tracking-wider">
              Complexity Multipliers
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <SliderRow
                label="Simple"
                icon={SlidersHorizontal}
                value={settings.complexitySimple}
                onChange={(v) => update({ complexitySimple: v })}
                min={0.5}
                max={2}
                step={0.1}
                unit="x"
              />
              <SliderRow
                label="Medium"
                icon={SlidersHorizontal}
                value={settings.complexityMedium}
                onChange={(v) => update({ complexityMedium: v })}
                min={0.8}
                max={3}
                step={0.1}
                unit="x"
              />
              <SliderRow
                label="Complex"
                icon={SlidersHorizontal}
                value={settings.complexityComplex}
                onChange={(v) => update({ complexityComplex: v })}
                min={1}
                max={4}
                step={0.1}
                unit="x"
              />
              <SliderRow
                label="Very Complex"
                icon={SlidersHorizontal}
                value={settings.complexityVeryComplex}
                onChange={(v) => update({ complexityVeryComplex: v })}
                min={1.5}
                max={5}
                step={0.1}
                unit="x"
              />
            </div>
          </div>

          {/* Global & Cost */}
          <div>
            <h3 className="text-sm font-medium mb-3 text-muted-foreground uppercase tracking-wider">
              Global Adjustments
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <SliderRow
                label="Global Multiplier"
                icon={SlidersHorizontal}
                value={settings.globalMultiplier}
                onChange={(v) => update({ globalMultiplier: v })}
                min={0.3}
                max={2}
                step={0.1}
                unit="x"
                description="Scale all estimates up or down"
              />
              <div>
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                  <Clock className="w-3 h-3" />
                  Hours per Day
                </label>
                <input
                  type="number"
                  value={settings.hoursPerDay}
                  onChange={(e) =>
                    update({ hoursPerDay: Number(e.target.value) || 7.5 })
                  }
                  min={1}
                  max={12}
                  step={0.5}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                  <PoundSterling className="w-3 h-3" />
                  Hourly Rate (£)
                </label>
                <input
                  type="number"
                  value={settings.hourlyRate || ""}
                  onChange={(e) =>
                    update({ hourlyRate: Number(e.target.value) })
                  }
                  placeholder="0 = no cost"
                  min={0}
                  step={5}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                />
              </div>
            </div>
          </div>

          {/* Custom Prompt Context */}
          <div>
            <h3 className="text-sm font-medium mb-3 text-muted-foreground uppercase tracking-wider">
              Custom Prompt Context
            </h3>
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
              <MessageSquare className="w-3 h-3" />
              Additional instructions for the AI
            </label>
            <textarea
              value={settings.customPromptContext}
              onChange={(e) =>
                update({ customPromptContext: e.target.value })
              }
              placeholder="e.g. 'We already have a base extension with common tables set up, so don't include initial scaffolding. The developer is very familiar with the Sales module.'"
              rows={3}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-y"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-border flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-primary hover:bg-primary-hover text-primary-foreground rounded-lg text-sm font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
