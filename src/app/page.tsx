"use client";

import { useState, useCallback, useEffect } from "react";
import { Loader2, Sparkles, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/header";
import { ApiKeyInput } from "@/components/api-key-input";
import { RequirementsInput } from "@/components/requirements-input";
import { SettingsModal } from "@/components/settings-modal";
import { EstimationResults } from "@/components/estimation-results";
import type { AIProvider, EstimationSettings, QuoteResponse } from "@/lib/types";
import { DEFAULT_SETTINGS } from "@/lib/types";
import { getSessionId } from "@/lib/session";

const SETTINGS_KEY = "bc-quote-settings";

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

export default function Home() {
  const [provider, setProvider] = useState<AIProvider>("anthropic");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");
  const [requirements, setRequirements] = useState("");
  const [settings, setSettings] = useState<EstimationSettings>(DEFAULT_SETTINGS);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<QuoteResponse | null>(null);
  const [quoteId, setQuoteId] = useState<string | null>(null);
  const [taskIds, setTaskIds] = useState<string[]>([]);

  // Load settings from localStorage on mount
  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  const handleApiKeyChange = useCallback((key: string) => {
    setApiKey(key);
  }, []);

  function handleSettingsChange(newSettings: EstimationSettings) {
    setSettings(newSettings);
    saveSettings(newSettings);
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
    setResult(null);

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
      setResult(data);
      toast.success(
        `Estimate generated: ${data.breakdown.totalHours} hours across ${data.breakdown.tasks.length} tasks`
      );

      // Fire-and-forget save to DB
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
      })
        .then((res) => res.json())
        .then((saved: { quoteId: string; taskIds: string[] }) => {
          setQuoteId(saved.quoteId);
          setTaskIds(saved.taskIds);
        })
        .catch(() => {
          // Silently fail — quote display still works without DB
        });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to generate estimate"
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleReset() {
    setResult(null);
    setQuoteId(null);
    setTaskIds([]);
  }

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
            Stop Under-Quoting BC Projects
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Paste your requirements or upload a document. AI breaks them down into
            specific Business Central development tasks with realistic time
            estimates &mdash; tuned to your experience and preferences.
          </p>
        </div>

        {result ? (
          /* Results View */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Your Estimate</h2>
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface border border-border hover:bg-surface-hover text-sm transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                New Estimate
              </button>
            </div>
            <EstimationResults
              result={result}
              settings={settings}
              quoteId={quoteId}
              taskIds={taskIds}
            />
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

              {/* Generate Button */}
              <button
                onClick={handleEstimate}
                disabled={isLoading || !requirements.trim() || !apiKey.trim()}
                className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground font-medium py-3.5 px-6 rounded-xl transition-all shadow-lg shadow-primary/20 hover:shadow-primary/30"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analysing requirements...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Generate Estimate
                  </>
                )}
              </button>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <ApiKeyInput
                provider={provider}
                onProviderChange={setProvider}
                apiKey={apiKey}
                onApiKeyChange={handleApiKeyChange}
                model={model}
                onModelChange={setModel}
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
            Estimates are AI-generated and should be reviewed by an experienced
            BC developer.
          </p>
        </div>
      </footer>
    </div>
  );
}
