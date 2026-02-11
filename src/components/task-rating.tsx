"use client";

import { useState } from "react";
import { ThumbsUp, ThumbsDown, Check, Loader2 } from "lucide-react";
import type { TaskRating as TaskRatingType } from "@/lib/types";

interface TaskRatingProps {
  quoteId: string;
  taskId: string;
  adjustedHours: number;
  initialRating?: TaskRatingType | null;
  initialActualHours?: number | null;
  onRated: (rating: TaskRatingType, actualHours?: number) => void;
}

export function TaskRating({
  quoteId,
  taskId,
  adjustedHours,
  initialRating,
  initialActualHours,
  onRated,
}: TaskRatingProps) {
  const [rating, setRating] = useState<TaskRatingType | null>(
    initialRating ?? null
  );
  const [showActualInput, setShowActualInput] = useState(false);
  const [actualHours, setActualHours] = useState(
    initialActualHours?.toString() ?? ""
  );
  const [saving, setSaving] = useState(false);

  async function submitRating(type: TaskRatingType, hours?: number) {
    setSaving(true);
    try {
      const response = await fetch(
        `/api/quotes/${quoteId}/tasks/${taskId}/rate`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rating: type,
            actualHours: hours,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to save rating");

      setRating(type);
      setShowActualInput(false);
      onRated(type, hours);
    } catch {
      // Silently fail — the user can retry
    } finally {
      setSaving(false);
    }
  }

  function handleThumbsUp(e: React.MouseEvent) {
    e.stopPropagation();
    if (rating === "up") return;
    submitRating("up");
  }

  function handleThumbsDown(e: React.MouseEvent) {
    e.stopPropagation();
    if (rating === "down" && !showActualInput) return;
    setRating("down");
    setShowActualInput(true);
    onRated("down");
  }

  function handleSubmitActual(e: React.MouseEvent) {
    e.stopPropagation();
    const hours = parseFloat(actualHours);
    if (isNaN(hours) || hours <= 0) return;
    submitRating("down", hours);
  }

  if (saving) {
    return (
      <div className="flex items-center gap-1 text-muted-foreground">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-1"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={handleThumbsUp}
        className={`p-1 rounded transition-colors ${
          rating === "up"
            ? "text-success bg-success/10"
            : "text-muted-foreground hover:text-success hover:bg-success/10"
        }`}
        title="Estimate was accurate"
      >
        <ThumbsUp className="w-3.5 h-3.5" />
      </button>

      <button
        onClick={handleThumbsDown}
        className={`p-1 rounded transition-colors ${
          rating === "down"
            ? "text-danger bg-danger/10"
            : "text-muted-foreground hover:text-danger hover:bg-danger/10"
        }`}
        title="Estimate was off"
      >
        <ThumbsDown className="w-3.5 h-3.5" />
      </button>

      {rating === "down" && !showActualInput && initialActualHours != null && (
        <span className="text-xs text-muted-foreground ml-1">
          {initialActualHours}h actual
        </span>
      )}

      {showActualInput && (
        <div className="flex items-center gap-1 ml-1">
          <input
            type="number"
            step="0.5"
            min="0.5"
            value={actualHours}
            onChange={(e) => setActualHours(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            placeholder={`${adjustedHours}h`}
            className="w-16 px-1.5 py-0.5 text-xs rounded border border-border bg-background text-foreground"
          />
          <button
            onClick={handleSubmitActual}
            disabled={!actualHours || parseFloat(actualHours) <= 0}
            className="p-0.5 rounded text-success hover:bg-success/10 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Submit actual hours"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
