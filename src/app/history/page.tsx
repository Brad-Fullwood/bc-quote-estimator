"use client";

import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/header";
import { QuoteHistory } from "@/components/quote-history";
import { EstimationResults } from "@/components/estimation-results";
import { ReviewResults } from "@/components/review-results";
import type { QuoteResponse, EstimationSettings, SpecReviewResult } from "@/lib/types";
import { DEFAULT_SETTINGS } from "@/lib/types";
import { getQuoteById, getReviewById } from "@/lib/quote-history";

export default function HistoryPage() {
  const [selectedQuote, setSelectedQuote] = useState<{
    result: QuoteResponse;
    settings: EstimationSettings;
    quoteId: string;
    taskIds: string[];
  } | null>(null);

  const [selectedReview, setSelectedReview] = useState<SpecReviewResult | null>(
    null
  );

  function handleSelectItem(id: string, type: "quote" | "review") {
    if (type === "quote") {
      const quote = getQuoteById(id);
      if (!quote) return;

      setSelectedQuote({
        result: quote.result,
        settings: { ...DEFAULT_SETTINGS, ...quote.settings },
        quoteId: quote.id,
        taskIds: quote.result.breakdown.tasks.map((t) => t.id),
      });
      setSelectedReview(null);
      return;
    }

    const review = getReviewById(id);
    if (!review) return;

    setSelectedReview(review.result);
    setSelectedQuote(null);
  }

  function handleBack() {
    setSelectedQuote(null);
    setSelectedReview(null);
  }

  const hasSelection = selectedQuote || selectedReview;
  const detailHeading = selectedQuote ? "Quote Detail" : "Review Detail";

  return (
    <div className="min-h-screen flex flex-col">
      <Header onSettingsClick={() => {}} />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-6">
          {hasSelection ? (
            <button
              onClick={handleBack}
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
              Back to Home
            </Link>
          )}
        </div>

        <h2 className="text-2xl font-bold mb-6">
          {hasSelection ? detailHeading : "History"}
        </h2>

        {!hasSelection && (
          <QuoteHistory onSelectItem={handleSelectItem} />
        )}

        {selectedQuote && (
          <EstimationResults
            result={selectedQuote.result}
            settings={selectedQuote.settings}
            quoteId={selectedQuote.quoteId}
            taskIds={selectedQuote.taskIds}
          />
        )}

        {selectedReview && <ReviewResults result={selectedReview} />}
      </main>
    </div>
  );
}
