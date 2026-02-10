"use client";

import { Settings, PoundSterling, Percent } from "lucide-react";

interface SettingsPanelProps {
  hourlyRate: number;
  onHourlyRateChange: (rate: number) => void;
  contingencyPercent: number;
  onContingencyChange: (percent: number) => void;
}

export function SettingsPanel({
  hourlyRate,
  onHourlyRateChange,
  contingencyPercent,
  onContingencyChange,
}: SettingsPanelProps) {
  return (
    <div className="bg-surface rounded-xl border border-border p-5">
      <div className="flex items-center gap-2 mb-4">
        <Settings className="w-4 h-4 text-muted-foreground" />
        <h3 className="text-sm font-medium">Settings</h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
            <PoundSterling className="w-3 h-3" />
            Hourly Rate (£)
          </label>
          <input
            type="number"
            value={hourlyRate || ""}
            onChange={(e) => onHourlyRateChange(Number(e.target.value))}
            placeholder="0 = no cost shown"
            min={0}
            step={5}
            className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
          />
          <p className="text-xs text-muted mt-1">
            Leave at 0 to hide cost estimate
          </p>
        </div>

        <div>
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
            <Percent className="w-3 h-3" />
            Contingency Buffer
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              value={contingencyPercent}
              onChange={(e) => onContingencyChange(Number(e.target.value))}
              min={0}
              max={50}
              step={5}
              className="flex-1 accent-primary"
            />
            <span className="text-sm font-mono w-10 text-right">
              {contingencyPercent}%
            </span>
          </div>
          <p className="text-xs text-muted mt-1">
            Added on top of all other hours
          </p>
        </div>
      </div>
    </div>
  );
}
