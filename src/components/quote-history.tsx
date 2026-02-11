"use client";

import { useState, useEffect } from "react";
import { Clock, ChevronRight, Trash2 } from "lucide-react";
import { getCombinedHistory, deleteQuote, deleteReview } from "@/lib/quote-history";
import type { HistoryItem } from "@/lib/types";

function ConfidenceDot({ confidence }: { confidence: string }) {
  const color =
    confidence === "high"
      ? "bg-success"
      : confidence === "medium"
        ? "bg-warning"
        : "bg-danger";

  return <span className={`w-2 h-2 rounded-full ${color}`} />;
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 8
      ? "text-success bg-success/10"
      : score >= 5
        ? "text-warning bg-warning/10"
        : "text-danger bg-danger/10";

  return (
    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${color}`}>
      {score}
    </span>
  );
}

function formatRelativeTime(date: Date): string {
  const now = Date.now();
  const diff = now - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}

interface QuoteHistoryProps {
  onSelectItem?: (id: string, type: "quote" | "review") => void;
}

export function QuoteHistory({ onSelectItem }: QuoteHistoryProps) {
  const [items, setItems] = useState<HistoryItem[]>([]);

  useEffect(() => {
    setItems(getCombinedHistory());
  }, []);

  function handleDelete(e: React.MouseEvent, id: string, type: "quote" | "review") {
    e.stopPropagation();
    if (type === "quote") {
      deleteQuote(id);
    } else {
      deleteReview(id);
    }
    setItems(getCombinedHistory());
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <Clock className="w-8 h-8 text-muted mx-auto mb-3" />
        <p className="text-muted-foreground text-sm">
          No history yet. Generate an estimate or review to see it here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((entry) => {
        if (entry.type === "quote") {
          const quote = entry.item;
          return (
            <button
              key={quote.id}
              onClick={() => onSelectItem?.(quote.id, "quote")}
              className="w-full flex items-center gap-4 p-4 rounded-lg border border-border bg-surface hover:bg-surface-hover transition-colors text-left"
            >
              <ConfidenceDot confidence={quote.confidence} />

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{quote.title}</p>
                <p className="text-xs text-muted-foreground">
                  <span className="text-primary/70 font-medium">Estimate</span>
                  {" \u00B7 "}
                  {quote.taskCount} tasks &middot;{" "}
                  {quote.provider === "anthropic" ? "Claude" : "Gemini"} &middot;{" "}
                  {formatRelativeTime(quote.createdAt)}
                </p>
              </div>

              <div className="text-right shrink-0">
                <p className="text-sm font-semibold">{quote.totalHours}h</p>
                <p className="text-xs text-muted-foreground">
                  ~{quote.totalDays} days
                </p>
              </div>

              <button
                onClick={(e) => handleDelete(e, quote.id, "quote")}
                className="p-1.5 rounded-md hover:bg-danger/10 text-muted-foreground hover:text-danger transition-colors shrink-0"
                title="Delete quote"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <ChevronRight className="w-4 h-4 text-muted shrink-0" />
            </button>
          );
        }

        const review = entry.item;
        return (
          <button
            key={review.id}
            onClick={() => onSelectItem?.(review.id, "review")}
            className="w-full flex items-center gap-4 p-4 rounded-lg border border-border bg-surface hover:bg-surface-hover transition-colors text-left"
          >
            <ScoreBadge score={review.qualityScore} />

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{review.summary}</p>
              <p className="text-xs text-muted-foreground">
                <span className="text-primary/70 font-medium">Review</span>
                {" \u00B7 "}
                {review.findingCount} findings
                {review.criticalCount > 0 && (
                  <span className="text-danger">
                    {" \u00B7 "}{review.criticalCount} critical
                  </span>
                )}
                {" \u00B7 "}
                {review.provider === "anthropic" ? "Claude" : "Gemini"} &middot;{" "}
                {formatRelativeTime(review.createdAt)}
              </p>
            </div>

            <div className="text-right shrink-0">
              <p className="text-sm font-semibold">{review.qualityScore}/10</p>
            </div>

            <button
              onClick={(e) => handleDelete(e, review.id, "review")}
              className="p-1.5 rounded-md hover:bg-danger/10 text-muted-foreground hover:text-danger transition-colors shrink-0"
              title="Delete review"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <ChevronRight className="w-4 h-4 text-muted shrink-0" />
          </button>
        );
      })}
    </div>
  );
}
