"use client";

import { useState } from "react";
import { MessageSquare, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface QuoteRatingProps {
  quoteId: string;
  sessionId: string;
  totalHours: number;
}

export function QuoteRating({
  quoteId,
  sessionId,
  totalHours,
}: QuoteRatingProps) {
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actualHours, setActualHours] = useState("");
  const [notes, setNotes] = useState("");
  const [expanded, setExpanded] = useState(false);

  if (submitted) {
    return (
      <div className="flex items-center gap-2 text-sm text-success">
        <CheckCircle2 className="w-4 h-4" />
        Overall rating submitted
      </div>
    );
  }

  async function handleSubmit() {
    setSaving(true);
    try {
      const response = await fetch(`/api/quotes/${quoteId}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          actualTotalHours: actualHours ? parseFloat(actualHours) : undefined,
          notes: notes.trim() || undefined,
        }),
      });

      if (!response.ok) throw new Error("Failed to submit rating");

      setSubmitted(true);
      toast.success("Overall rating submitted");
    } catch {
      toast.error("Failed to submit rating");
    } finally {
      setSaving(false);
    }
  }

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <MessageSquare className="w-4 h-4" />
        Rate this quote overall
      </button>
    );
  }

  return (
    <div className="bg-surface rounded-lg border border-border p-4 space-y-3">
      <h4 className="text-sm font-medium flex items-center gap-2">
        <MessageSquare className="w-4 h-4" />
        Overall Quote Rating
      </h4>

      <div className="space-y-2">
        <label className="block text-xs text-muted-foreground">
          Actual total hours (optional)
        </label>
        <input
          type="number"
          step="0.5"
          min="0"
          value={actualHours}
          onChange={(e) => setActualHours(e.target.value)}
          placeholder={`Estimated: ${totalHours}h`}
          className="w-full px-3 py-1.5 text-sm rounded-lg border border-border bg-background text-foreground"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-xs text-muted-foreground">
          Notes (optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="What was accurate? What was off?"
          className="w-full px-3 py-1.5 text-sm rounded-lg border border-border bg-background text-foreground resize-none"
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-primary hover:bg-primary-hover text-primary-foreground rounded-lg transition-colors disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            "Submit"
          )}
        </button>
        <button
          onClick={() => setExpanded(false)}
          className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground rounded-lg transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
