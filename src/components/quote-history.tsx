"use client";

import { useState, useEffect } from "react";
import { Clock, ChevronRight, Loader2, AlertTriangle } from "lucide-react";
import { getSessionId } from "@/lib/session";
import type { SavedQuoteListItem } from "@/lib/types";

function ConfidenceDot({ confidence }: { confidence: string }) {
  const color =
    confidence === "high"
      ? "bg-success"
      : confidence === "medium"
        ? "bg-warning"
        : "bg-danger";

  return <span className={`w-2 h-2 rounded-full ${color}`} />;
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
  onSelectQuote?: (quoteId: string) => void;
}

export function QuoteHistory({ onSelectQuote }: QuoteHistoryProps) {
  const [quotes, setQuotes] = useState<SavedQuoteListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchQuotes() {
      const sessionId = getSessionId();
      if (!sessionId) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/quotes?sessionId=${encodeURIComponent(sessionId)}`
        );
        if (!response.ok) throw new Error("Failed to load quotes");
        const data = await response.json();
        setQuotes(data);
      } catch {
        setError("Failed to load quote history");
      } finally {
        setLoading(false);
      }
    }

    fetchQuotes();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Loading history...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12 text-danger">
        <AlertTriangle className="w-5 h-5 mr-2" />
        {error}
      </div>
    );
  }

  if (quotes.length === 0) {
    return (
      <div className="text-center py-12">
        <Clock className="w-8 h-8 text-muted mx-auto mb-3" />
        <p className="text-muted-foreground text-sm">
          No quotes yet. Generate your first estimate to see it here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {quotes.map((quote) => (
        <button
          key={quote.id}
          onClick={() => onSelectQuote?.(quote.id)}
          className="w-full flex items-center gap-4 p-4 rounded-lg border border-border bg-surface hover:bg-surface-hover transition-colors text-left"
        >
          <ConfidenceDot confidence={quote.confidence} />

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{quote.title}</p>
            <p className="text-xs text-muted-foreground">
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

          <ChevronRight className="w-4 h-4 text-muted shrink-0" />
        </button>
      ))}
    </div>
  );
}
