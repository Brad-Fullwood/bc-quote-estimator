"use client";

import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/header";
import { QuoteHistory } from "@/components/quote-history";
import { EstimationResults } from "@/components/estimation-results";
import type { QuoteResponse, EstimationSettings } from "@/lib/types";
import { DEFAULT_SETTINGS } from "@/lib/types";
import { getQuoteById } from "@/lib/quote-history";

export default function HistoryPage() {
  const [selectedQuote, setSelectedQuote] = useState<{
    result: QuoteResponse;
    settings: EstimationSettings;
    quoteId: string;
    taskIds: string[];
  } | null>(null);

  function handleSelectQuote(quoteId: string) {
    const quote = getQuoteById(quoteId);
    if (!quote) return;

    setSelectedQuote({
      result: quote.result,
      settings: { ...DEFAULT_SETTINGS, ...quote.settings },
      quoteId: quote.id,
      taskIds: quote.result.breakdown.tasks.map((t) => t.id),
    });
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

        {!selectedQuote && (
          <QuoteHistory onSelectQuote={handleSelectQuote} />
        )}

        {selectedQuote && (
          <EstimationResults
            result={selectedQuote.result}
            settings={selectedQuote.settings}
            quoteId={selectedQuote.quoteId}
            taskIds={selectedQuote.taskIds}
          />
        )}
      </main>
    </div>
  );
}
