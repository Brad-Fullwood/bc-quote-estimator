"use client";

import { useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/header";
import { QuoteHistory } from "@/components/quote-history";
import { EstimationResults } from "@/components/estimation-results";
import type { QuoteResponse, EstimationSettings } from "@/lib/types";
import { DEFAULT_SETTINGS } from "@/lib/types";

interface QuoteDetail {
  quote: {
    id: string;
    settingsSnapshot: EstimationSettings;
    provider: string;
    createdAt: string;
  };
  tasks: Array<{
    id: string;
    taskIndex: number;
    title: string;
    category: string;
    complexity: string;
    baseHours: number;
    adjustedHours: number;
    rating: string | null;
    actualHours: number | null;
  }>;
}

export default function HistoryPage() {
  const [selectedQuote, setSelectedQuote] = useState<QuoteDetail | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSelectQuote(quoteId: string) {
    setLoading(true);
    try {
      const response = await fetch(`/api/quotes/${quoteId}`);
      if (!response.ok) throw new Error("Failed to load quote");
      const data: QuoteDetail = await response.json();
      setSelectedQuote(data);
    } catch {
      setSelectedQuote(null);
    } finally {
      setLoading(false);
    }
  }

  function buildQuoteResponse(detail: QuoteDetail): {
    result: QuoteResponse;
    settings: EstimationSettings;
    taskIds: string[];
  } {
    const settings = {
      ...DEFAULT_SETTINGS,
      ...(detail.quote.settingsSnapshot as EstimationSettings),
    };

    const tasks = detail.tasks.map((t) => ({
      id: t.id,
      title: t.title,
      description: "",
      category: t.category as QuoteResponse["breakdown"]["tasks"][0]["category"],
      complexity: t.complexity as QuoteResponse["breakdown"]["tasks"][0]["complexity"],
      baseHours: t.baseHours,
      adjustedHours: t.adjustedHours,
      dependencies: [] as string[],
      notes: "",
    }));

    const subtotalHours = tasks.reduce((sum, t) => sum + t.adjustedHours, 0);
    const codeReviewHours =
      Math.round(subtotalHours * (settings.codeReviewPercent / 100) * 10) / 10;
    const testingHours =
      Math.round(subtotalHours * (settings.testingPercent / 100) * 10) / 10;
    const projectManagementHours =
      Math.round(subtotalHours * (settings.projectManagementPercent / 100) * 10) / 10;
    const beforeContingency =
      subtotalHours + codeReviewHours + testingHours + projectManagementHours;
    const contingencyHours =
      Math.round(beforeContingency * (settings.contingencyPercent / 100) * 10) / 10;
    const totalHours =
      Math.round((beforeContingency + contingencyHours) * 10) / 10;
    const totalDays =
      Math.round((totalHours / settings.hoursPerDay) * 10) / 10;

    return {
      result: {
        breakdown: {
          tasks,
          subtotalHours: Math.round(subtotalHours * 10) / 10,
          codeReviewHours,
          testingHours,
          projectManagementHours,
          contingencyHours,
          totalHours,
          totalDays,
          confidence: "medium",
          assumptions: [],
          risks: [],
        },
        rawAnalysis: "",
        provider: detail.quote.provider as QuoteResponse["provider"],
        createdAt: detail.quote.createdAt,
      },
      settings,
      taskIds: detail.tasks.map((t) => t.id),
    };
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header onSettingsClick={() => {}} />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-6">
          {selectedQuote ? (
            <button
              onClick={() => setSelectedQuote(null)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to History
            </button>
          ) : (
            <Link
              href="/"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Estimator
            </Link>
          )}
        </div>

        <h2 className="text-2xl font-bold mb-6">
          {selectedQuote ? "Quote Detail" : "Quote History"}
        </h2>

        {loading && (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Loading quote...
          </div>
        )}

        {!loading && !selectedQuote && (
          <QuoteHistory onSelectQuote={handleSelectQuote} />
        )}

        {!loading && selectedQuote && (
          <EstimationResults
            {...buildQuoteResponse(selectedQuote)}
            quoteId={selectedQuote.quote.id}
          />
        )}
      </main>
    </div>
  );
}
