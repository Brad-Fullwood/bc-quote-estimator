"use client";

import { useState, useCallback } from "react";
import { Loader2, Sparkles, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/header";
import { ApiKeyInput } from "@/components/api-key-input";
import { RequirementsInput } from "@/components/requirements-input";
import { SettingsPanel } from "@/components/settings-panel";
import { EstimationResults } from "@/components/estimation-results";
import type { AIProvider, QuoteResponse } from "@/lib/types";

export default function Home() {
  const [provider, setProvider] = useState<AIProvider>("anthropic");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");
  const [requirements, setRequirements] = useState("");
  const [hourlyRate, setHourlyRate] = useState(0);
  const [contingencyPercent, setContingencyPercent] = useState(15);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<QuoteResponse | null>(null);

  const handleApiKeyChange = useCallback((key: string) => {
    setApiKey(key);
  }, []);

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
          contingencyPercent,
          apiKey,
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
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero */}
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
            Stop Under-Quoting BC Projects
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Paste your requirements or upload a PDF. AI breaks them down into
            specific Business Central development tasks with realistic time
            estimates &mdash; including the hidden complexity you always forget to
            quote for.
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
            <EstimationResults result={result} hourlyRate={hourlyRate} />
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
              <SettingsPanel
                hourlyRate={hourlyRate}
                onHourlyRateChange={setHourlyRate}
                contingencyPercent={contingencyPercent}
                onContingencyChange={setContingencyPercent}
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
