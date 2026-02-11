"use client";

import { useState, useCallback, useEffect } from "react";
import { Loader2, Sparkles, RotateCcw, Search } from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/header";
import { ApiKeyInput } from "@/components/api-key-input";
import { RequirementsInput } from "@/components/requirements-input";
import { SettingsModal } from "@/components/settings-modal";
import { EstimationResults } from "@/components/estimation-results";
import { ReviewResults } from "@/components/review-results";
import type {
  AIProvider,
  AppMode,
  EstimationSettings,
  QuoteResponse,
  SpecReviewResult,
} from "@/lib/types";
import { DEFAULT_SETTINGS } from "@/lib/types";
import { getSessionId } from "@/lib/session";
import { saveQuoteToHistory } from "@/lib/quote-history";

const SETTINGS_KEY = "bc-quote-settings";
const PROVIDER_KEY = "bc-quote-provider";
const MODEL_KEY = "bc-quote-model";

function loadSettings(): EstimationSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (!saved) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveSettings(settings: EstimationSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

const MODE_CONFIG = {
  estimate: {
    headline: "Stop Under-Quoting BC Projects",
    subtitle:
      "Paste your requirements or upload a document. AI breaks them down into specific Business Central development tasks with realistic time estimates \u2014 tuned to your experience and preferences.",
    actionLabel: "Generate Estimate",
    loadingLabel: "Analysing requirements...",
    resetLabel: "New Estimate",
    resultHeading: "Your Estimate",
    actionIcon: Sparkles,
  },
  review: {
    headline: "Catch Issues Before Development Starts",
    subtitle:
      "Paste your specification and let AI review it for ambiguities, gaps, missing BC-specific concerns, and improvement opportunities \u2014 before it reaches development.",
    actionLabel: "Review Specification",
    loadingLabel: "Reviewing specification...",
    resetLabel: "New Review",
    resultHeading: "Specification Review",
    actionIcon: Search,
  },
} as const;

export default function Home() {
  const [mode, setMode] = useState<AppMode>("estimate");
  const [provider, setProvider] = useState<AIProvider>(() => {
    if (typeof window === "undefined") return "anthropic";
    return (localStorage.getItem(PROVIDER_KEY) as AIProvider) || "anthropic";
  });
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem(MODEL_KEY) || "";
  });
  const [requirements, setRequirements] = useState("");
  const [settings, setSettings] = useState<EstimationSettings>(DEFAULT_SETTINGS);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [estimateResult, setEstimateResult] = useState<QuoteResponse | null>(null);
  const [reviewResult, setReviewResult] = useState<SpecReviewResult | null>(null);
  const [quoteId, setQuoteId] = useState<string | null>(null);
  const [taskIds, setTaskIds] = useState<string[]>([]);

  // Load settings from localStorage on mount
  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  const handleProviderChange = useCallback((p: AIProvider) => {
    setProvider(p);
    localStorage.setItem(PROVIDER_KEY, p);
  }, []);

  const handleModelChange = useCallback((m: string) => {
    setModel(m);
    localStorage.setItem(MODEL_KEY, m);
  }, []);

  const handleApiKeyChange = useCallback((key: string) => {
    setApiKey(key);
  }, []);

  function handleSettingsChange(newSettings: EstimationSettings) {
    setSettings(newSettings);
    saveSettings(newSettings);
  }

  function handleModeSwitch(newMode: AppMode) {
    if (newMode === mode) return;
    setMode(newMode);
    setEstimateResult(null);
    setReviewResult(null);
    setQuoteId(null);
    setTaskIds([]);
  }

  async function handleEstimate() {
    if (!requirements.trim()) {
      toast.error("Please enter your requirements");
      return;
    }

    if (!apiKey.trim()) {
      toast.error("Please enter your API key");
      return;
    }

    setIsLoading(true);
    setEstimateResult(null);

    try {
      const response = await fetch("/api/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requirements,
          provider,
          model,
          apiKey,
          settings,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate estimate");
      }

      const data: QuoteResponse = await response.json();
      setEstimateResult(data);
      toast.success(
        `Estimate generated: ${data.breakdown.totalHours} hours across ${data.breakdown.tasks.length} tasks`
      );

      // Save to local history
      const savedLocal = saveQuoteToHistory(requirements, data, settings);
      setQuoteId(savedLocal.quoteId);
      setTaskIds(savedLocal.taskIds);

      // Fire-and-forget save to DB for analytics
      const sessionId = getSessionId();
      fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          requirements,
          result: data,
          model,
          settings,
        }),
      }).catch(() => {
        // Silently fail — local history still works without DB
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to generate estimate"
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleReview() {
    if (!requirements.trim()) {
      toast.error("Please enter your specification");
      return;
    }

    if (!apiKey.trim()) {
      toast.error("Please enter your API key");
      return;
    }

    setIsLoading(true);
    setReviewResult(null);

    try {
      const response = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requirements,
          provider,
          model,
          apiKey,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to review specification");
      }

      const data: SpecReviewResult = await response.json();
      setReviewResult(data);

      const criticalCount = data.findings.filter(
        (f) => f.severity === "critical"
      ).length;
      if (criticalCount > 0) {
        toast.warning(
          `Review complete: ${criticalCount} critical finding${criticalCount > 1 ? "s" : ""} identified`
        );
      } else {
        toast.success(
          `Review complete: Score ${data.qualityScore}/10 with ${data.findings.length} findings`
        );
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to review specification"
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleAction() {
    if (mode === "estimate") {
      handleEstimate();
    } else {
      handleReview();
    }
  }

  function handleReset() {
    setEstimateResult(null);
    setReviewResult(null);
    setQuoteId(null);
    setTaskIds([]);
  }

  const hasResult =
    (mode === "estimate" && estimateResult) ||
    (mode === "review" && reviewResult);

  const config = MODE_CONFIG[mode];
  const ActionIcon = config.actionIcon;

  return (
    <div className="min-h-screen flex flex-col">
      <Header onSettingsClick={() => setSettingsOpen(true)} />
      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onSettingsChange={handleSettingsChange}
      />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero */}
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
            {config.headline}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {config.subtitle}
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex rounded-lg bg-surface border border-border p-1">
            <button
              onClick={() => handleModeSwitch("estimate")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                mode === "estimate"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Estimate
            </button>
            <button
              onClick={() => handleModeSwitch("review")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                mode === "review"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Review Spec
            </button>
          </div>
        </div>

        {hasResult ? (
          /* Results View */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{config.resultHeading}</h2>
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface border border-border hover:bg-surface-hover text-sm transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                {config.resetLabel}
              </button>
            </div>
            {mode === "estimate" && estimateResult && (
              <EstimationResults
                result={estimateResult}
                settings={settings}
                quoteId={quoteId}
                taskIds={taskIds}
              />
            )}
            {mode === "review" && reviewResult && (
              <ReviewResults result={reviewResult} />
            )}
          </div>
        ) : (
          /* Input View */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Column */}
            <div className="lg:col-span-2 space-y-6">
              <RequirementsInput
                value={requirements}
                onChange={setRequirements}
              />

              {/* Action Button */}
              <button
                onClick={handleAction}
                disabled={isLoading || !requirements.trim() || !apiKey.trim()}
                className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground font-medium py-3.5 px-6 rounded-xl transition-all shadow-lg shadow-primary/20 hover:shadow-primary/30"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {config.loadingLabel}
                  </>
                ) : (
                  <>
                    <ActionIcon className="w-5 h-5" />
                    {config.actionLabel}
                  </>
                )}
              </button>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <ApiKeyInput
                provider={provider}
                onProviderChange={handleProviderChange}
                apiKey={apiKey}
                onApiKeyChange={handleApiKeyChange}
                model={model}
                onModelChange={handleModelChange}
              />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted">
          <p>&copy; {new Date().getFullYear()} Technically Business Central</p>
          <p>
            Results are AI-generated and should be reviewed by an experienced
            BC developer.
          </p>
        </div>
      </footer>
    </div>
  );
}
