"use client";

import { useState } from "react";
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  Lightbulb,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import type { QuoteResponse, EstimationTask } from "@/lib/types";
import {
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  COMPLEXITY_MULTIPLIERS,
} from "@/lib/estimation-rules";

interface EstimationResultsProps {
  result: QuoteResponse;
  hourlyRate: number;
}

function ConfidenceBadge({ confidence }: { confidence: string }) {
  const config = {
    high: {
      icon: CheckCircle2,
      color: "text-success",
      bg: "bg-success/10",
      label: "High Confidence",
    },
    medium: {
      icon: AlertTriangle,
      color: "text-warning",
      bg: "bg-warning/10",
      label: "Medium Confidence",
    },
    low: {
      icon: AlertTriangle,
      color: "text-danger",
      bg: "bg-danger/10",
      label: "Low Confidence",
    },
  }[confidence] ?? {
    icon: AlertTriangle,
    color: "text-muted",
    bg: "bg-muted/10",
    label: confidence,
  };

  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}
    >
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </span>
  );
}

function TaskRow({ task, index }: { task: EstimationTask; index: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4 hover:bg-surface-hover transition-colors text-left"
      >
        <span className="text-xs text-muted font-mono w-6">
          {String(index + 1).padStart(2, "0")}
        </span>
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: CATEGORY_COLORS[task.category] }}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{task.title}</p>
          <p className="text-xs text-muted-foreground">
            {CATEGORY_LABELS[task.category]} &middot;{" "}
            <span className="capitalize">{task.complexity}</span> (
            {COMPLEXITY_MULTIPLIERS[task.complexity]}x)
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-semibold">{task.adjustedHours}h</p>
          <p className="text-xs text-muted">base: {task.baseHours}h</p>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-muted shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted shrink-0" />
        )}
      </button>
      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-border bg-background/50">
          <p className="text-sm text-muted-foreground mb-2">
            {task.description}
          </p>
          {task.notes && (
            <p className="text-xs text-warning/80 flex items-start gap-1.5 mt-2">
              <Lightbulb className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              {task.notes}
            </p>
          )}
          {task.dependencies.length > 0 && (
            <p className="text-xs text-muted mt-2">
              Depends on: {task.dependencies.join(", ")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function EstimationResults({
  result,
  hourlyRate,
}: EstimationResultsProps) {
  const { breakdown } = result;
  const totalCost = hourlyRate > 0 ? breakdown.totalHours * hourlyRate : null;

  function generateTextSummary(): string {
    const lines: string[] = [
      "BC DEVELOPMENT ESTIMATE",
      "=" .repeat(50),
      "",
      `Generated: ${new Date(result.createdAt).toLocaleDateString()}`,
      `AI Provider: ${result.provider === "anthropic" ? "Claude (Anthropic)" : "Gemini (Google)"}`,
      `Confidence: ${breakdown.confidence}`,
      "",
      "TASK BREAKDOWN",
      "-".repeat(50),
    ];

    breakdown.tasks.forEach((task, i) => {
      lines.push(
        `${i + 1}. ${task.title}`,
        `   Category: ${CATEGORY_LABELS[task.category]}`,
        `   Complexity: ${task.complexity} (${COMPLEXITY_MULTIPLIERS[task.complexity]}x)`,
        `   Hours: ${task.adjustedHours}h (base: ${task.baseHours}h)`,
        `   ${task.description}`,
        ""
      );
    });

    lines.push(
      "",
      "SUMMARY",
      "-".repeat(50),
      `Development:       ${breakdown.subtotalHours}h`,
      `Code Review (15%): ${breakdown.codeReviewHours}h`,
      `Testing (20%):     ${breakdown.testingHours}h`,
      `Project Mgmt (10%):${breakdown.projectManagementHours}h`,
      `Contingency:       ${breakdown.contingencyHours}h`,
      "-".repeat(50),
      `TOTAL:             ${breakdown.totalHours}h (~${breakdown.totalDays} days)`,
    );

    if (totalCost !== null) {
      lines.push(
        `ESTIMATED COST:    £${totalCost.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      );
    }

    if (breakdown.assumptions.length > 0) {
      lines.push("", "ASSUMPTIONS:", ...breakdown.assumptions.map((a) => `  - ${a}`));
    }

    if (breakdown.risks.length > 0) {
      lines.push("", "RISKS:", ...breakdown.risks.map((r) => `  - ${r}`));
    }

    return lines.join("\n");
  }

  function handleCopy() {
    navigator.clipboard.writeText(generateTextSummary());
    toast.success("Copied estimate to clipboard");
  }

  function handleDownload() {
    const blob = new Blob([generateTextSummary()], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bc-estimate-${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded estimate");
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="bg-surface rounded-xl border border-border p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold mb-1">Estimation Summary</h2>
            <ConfidenceBadge confidence={breakdown.confidence} />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="p-2 rounded-lg hover:bg-surface-hover transition-colors text-muted-foreground hover:text-foreground"
              title="Copy to clipboard"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={handleDownload}
              className="p-2 rounded-lg hover:bg-surface-hover transition-colors text-muted-foreground hover:text-foreground"
              title="Download as text"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Hours Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-background rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Development</p>
            <p className="text-lg font-semibold">{breakdown.subtotalHours}h</p>
          </div>
          <div className="bg-background rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Code Review</p>
            <p className="text-lg font-semibold">
              {breakdown.codeReviewHours}h
            </p>
          </div>
          <div className="bg-background rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Testing</p>
            <p className="text-lg font-semibold">{breakdown.testingHours}h</p>
          </div>
          <div className="bg-background rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Project Mgmt</p>
            <p className="text-lg font-semibold">
              {breakdown.projectManagementHours}h
            </p>
          </div>
          <div className="bg-background rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Contingency</p>
            <p className="text-lg font-semibold">
              {breakdown.contingencyHours}h
            </p>
          </div>
          <div className="bg-primary/10 rounded-lg p-3 border border-primary/20">
            <p className="text-xs text-primary mb-1">Total</p>
            <p className="text-lg font-bold text-primary">
              {breakdown.totalHours}h
            </p>
            <p className="text-xs text-muted-foreground">
              ~{breakdown.totalDays} days
            </p>
          </div>
        </div>

        {/* Cost estimate */}
        {totalCost !== null && (
          <div className="bg-accent/10 border border-accent/20 rounded-lg p-4 mb-6">
            <p className="text-sm text-accent-foreground">
              Estimated cost at £{hourlyRate}/hour:{" "}
              <span className="text-lg font-bold">
                £
                {totalCost.toLocaleString("en-GB", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </p>
          </div>
        )}

        {/* Tasks count */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          {breakdown.tasks.length} tasks identified
        </div>
      </div>

      {/* Task Breakdown */}
      <div className="bg-surface rounded-xl border border-border p-6">
        <h3 className="text-lg font-semibold mb-4">Task Breakdown</h3>
        <div className="space-y-2">
          {breakdown.tasks.map((task, index) => (
            <TaskRow key={task.id} task={task} index={index} />
          ))}
        </div>
      </div>

      {/* Assumptions & Risks */}
      {(breakdown.assumptions.length > 0 || breakdown.risks.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {breakdown.assumptions.length > 0 && (
            <div className="bg-surface rounded-xl border border-border p-5">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-4 h-4 text-warning" />
                <h3 className="text-sm font-medium">Assumptions</h3>
              </div>
              <ul className="space-y-2">
                {breakdown.assumptions.map((assumption, i) => (
                  <li
                    key={i}
                    className="text-sm text-muted-foreground flex items-start gap-2"
                  >
                    <span className="text-muted mt-1">&bull;</span>
                    {assumption}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {breakdown.risks.length > 0 && (
            <div className="bg-surface rounded-xl border border-border p-5">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-4 h-4 text-danger" />
                <h3 className="text-sm font-medium">Risks</h3>
              </div>
              <ul className="space-y-2">
                {breakdown.risks.map((risk, i) => (
                  <li
                    key={i}
                    className="text-sm text-muted-foreground flex items-start gap-2"
                  >
                    <span className="text-muted mt-1">&bull;</span>
                    {risk}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
