"use client";

import {
  Copy,
  Download,
  AlertOctagon,
  AlertTriangle,
  Info,
  CircleAlert,
  CircleHelp,
  Lightbulb,
  Cpu,
} from "lucide-react";
import { toast } from "sonner";
import type { SpecReviewResult, FindingCategory, FindingSeverity } from "@/lib/types";

interface ReviewResultsProps {
  result: SpecReviewResult;
}

const SEVERITY_CONFIG: Record<
  FindingSeverity,
  { label: string; color: string; bg: string; border: string }
> = {
  critical: {
    label: "Critical",
    color: "text-danger",
    bg: "bg-danger/10",
    border: "border-danger/20",
  },
  warning: {
    label: "Warning",
    color: "text-warning",
    bg: "bg-warning/10",
    border: "border-warning/20",
  },
  info: {
    label: "Info",
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    border: "border-blue-400/20",
  },
};

const CATEGORY_CONFIG: Record<
  FindingCategory,
  { label: string; icon: typeof AlertOctagon }
> = {
  issue: { label: "Issues", icon: CircleAlert },
  missing: { label: "Missing", icon: CircleHelp },
  "bc-specific": { label: "BC-Specific", icon: Cpu },
  suggestion: { label: "Suggestions", icon: Lightbulb },
};

const SEVERITY_ORDER: FindingSeverity[] = ["critical", "warning", "info"];

function getScoreColor(score: number): string {
  if (score >= 8) return "text-success";
  if (score >= 5) return "text-warning";
  return "text-danger";
}

function getScoreBg(score: number): string {
  if (score >= 8) return "bg-success/10 border-success/20";
  if (score >= 5) return "bg-warning/10 border-warning/20";
  return "bg-danger/10 border-danger/20";
}

function getScoreLabel(score: number): string {
  if (score >= 9) return "Exceptional";
  if (score >= 7) return "Good";
  if (score >= 5) return "Needs Work";
  if (score >= 3) return "Significant Gaps";
  return "Too Vague";
}

function SeverityBadge({ severity }: { severity: FindingSeverity }) {
  const config = SEVERITY_CONFIG[severity];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${config.bg} ${config.color}`}
    >
      {config.label}
    </span>
  );
}

export function ReviewResults({ result }: ReviewResultsProps) {
  const { qualityScore, summary, findings } = result;

  const severityCounts = {
    critical: findings.filter((f) => f.severity === "critical").length,
    warning: findings.filter((f) => f.severity === "warning").length,
    info: findings.filter((f) => f.severity === "info").length,
  };

  const categorizedFindings = (
    ["issue", "missing", "bc-specific", "suggestion"] as FindingCategory[]
  ).map((category) => ({
    category,
    findings: findings
      .filter((f) => f.category === category)
      .sort(
        (a, b) =>
          SEVERITY_ORDER.indexOf(a.severity) -
          SEVERITY_ORDER.indexOf(b.severity)
      ),
  })).filter((group) => group.findings.length > 0);

  function generateTextSummary(): string {
    const lines: string[] = [
      "BC SPECIFICATION REVIEW",
      "=".repeat(50),
      "",
      `Generated: ${new Date(result.createdAt).toLocaleDateString()}`,
      `AI Provider: ${result.provider === "anthropic" ? "Claude (Anthropic)" : "Gemini (Google)"}`,
      `Quality Score: ${qualityScore}/10 — ${getScoreLabel(qualityScore)}`,
      "",
      "SUMMARY",
      "-".repeat(50),
      summary,
      "",
    ];

    for (const group of categorizedFindings) {
      const config = CATEGORY_CONFIG[group.category];
      lines.push(
        config.label.toUpperCase(),
        "-".repeat(50)
      );

      for (const finding of group.findings) {
        lines.push(
          `[${finding.severity.toUpperCase()}] ${finding.title}`,
          `  ${finding.description}`,
          ""
        );
      }
    }

    return lines.join("\n");
  }

  function handleCopy() {
    navigator.clipboard.writeText(generateTextSummary());
    toast.success("Copied review to clipboard");
  }

  function handleDownload() {
    const blob = new Blob([generateTextSummary()], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bc-spec-review-${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded review");
  }

  return (
    <div className="space-y-6">
      {/* Quality Score Card */}
      <div className={`rounded-xl border p-6 ${getScoreBg(qualityScore)}`}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p
                className={`text-5xl font-bold ${getScoreColor(qualityScore)}`}
              >
                {qualityScore}
              </p>
              <p className="text-xs text-muted-foreground mt-1">out of 10</p>
            </div>
            <div>
              <p
                className={`text-lg font-semibold ${getScoreColor(qualityScore)}`}
              >
                {getScoreLabel(qualityScore)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">{summary}</p>
            </div>
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

        {/* Severity Summary Pills */}
        <div className="flex gap-3">
          {severityCounts.critical > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-danger/10 text-danger">
              <AlertOctagon className="w-3.5 h-3.5" />
              {severityCounts.critical} critical
            </span>
          )}
          {severityCounts.warning > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-warning/10 text-warning">
              <AlertTriangle className="w-3.5 h-3.5" />
              {severityCounts.warning} warnings
            </span>
          )}
          {severityCounts.info > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-400/10 text-blue-400">
              <Info className="w-3.5 h-3.5" />
              {severityCounts.info} info
            </span>
          )}
        </div>
      </div>

      {/* Categorized Findings */}
      {categorizedFindings.map((group) => {
        const config = CATEGORY_CONFIG[group.category];
        const Icon = config.icon;

        return (
          <div
            key={group.category}
            className="bg-surface rounded-xl border border-border p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <Icon className="w-5 h-5 text-muted-foreground" />
              <h3 className="text-lg font-semibold">{config.label}</h3>
              <span className="text-xs text-muted-foreground">
                ({group.findings.length})
              </span>
            </div>
            <div className="space-y-3">
              {group.findings.map((finding, i) => (
                <div
                  key={i}
                  className={`rounded-lg border p-4 ${SEVERITY_CONFIG[finding.severity].border} bg-background/50`}
                >
                  <div className="flex items-start gap-3">
                    <SeverityBadge severity={finding.severity} />
                    <div>
                      <p className="text-sm font-medium">{finding.title}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {finding.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
