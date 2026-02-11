import type {
  QuoteResponse,
  EstimationSettings,
  SavedQuoteListItem,
  SpecReviewResult,
  SavedReviewListItem,
  HistoryItem,
} from "./types";

const HISTORY_KEY = "bc-quote-history";
const REVIEW_HISTORY_KEY = "bc-review-history";
const MAX_ITEMS = 50;

// --- Quote history ---

export interface LocalQuote {
  id: string;
  requirements: string;
  result: QuoteResponse;
  settings: EstimationSettings;
  createdAt: string;
}

function loadQuoteHistory(): LocalQuote[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as LocalQuote[];
  } catch {
    return [];
  }
}

function persistQuoteHistory(quotes: LocalQuote[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(quotes));
}

export function saveQuoteToHistory(
  requirements: string,
  result: QuoteResponse,
  settings: EstimationSettings
): { quoteId: string; taskIds: string[] } {
  const quoteId = crypto.randomUUID();
  const taskIds = result.breakdown.tasks.map(() => crypto.randomUUID());

  const entry: LocalQuote = {
    id: quoteId,
    requirements,
    result: {
      ...result,
      breakdown: {
        ...result.breakdown,
        tasks: result.breakdown.tasks.map((t, i) => ({ ...t, id: taskIds[i] })),
      },
    },
    settings,
    createdAt: new Date().toISOString(),
  };

  const history = loadQuoteHistory();
  history.unshift(entry);

  if (history.length > MAX_ITEMS) {
    history.length = MAX_ITEMS;
  }

  persistQuoteHistory(history);
  return { quoteId, taskIds };
}

export function getQuoteHistory(): SavedQuoteListItem[] {
  return loadQuoteHistory().map((q) => ({
    id: q.id,
    title: q.result.breakdown.tasks[0]?.title ?? "Untitled Quote",
    totalHours: q.result.breakdown.totalHours,
    totalDays: q.result.breakdown.totalDays,
    taskCount: q.result.breakdown.tasks.length,
    confidence: q.result.breakdown.confidence,
    provider: q.result.provider,
    createdAt: new Date(q.createdAt),
  }));
}

export function getQuoteById(id: string): LocalQuote | undefined {
  return loadQuoteHistory().find((q) => q.id === id);
}

export function deleteQuote(id: string) {
  const history = loadQuoteHistory().filter((q) => q.id !== id);
  persistQuoteHistory(history);
}

// --- Review history ---

export interface LocalReview {
  id: string;
  requirements: string;
  result: SpecReviewResult;
  createdAt: string;
}

function loadReviewHistory(): LocalReview[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(REVIEW_HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as LocalReview[];
  } catch {
    return [];
  }
}

function persistReviewHistory(reviews: LocalReview[]) {
  localStorage.setItem(REVIEW_HISTORY_KEY, JSON.stringify(reviews));
}

export function saveReviewToHistory(
  requirements: string,
  result: SpecReviewResult
): { reviewId: string } {
  const reviewId = crypto.randomUUID();

  const entry: LocalReview = {
    id: reviewId,
    requirements,
    result,
    createdAt: new Date().toISOString(),
  };

  const history = loadReviewHistory();
  history.unshift(entry);

  if (history.length > MAX_ITEMS) {
    history.length = MAX_ITEMS;
  }

  persistReviewHistory(history);
  return { reviewId };
}

export function getReviewHistory(): SavedReviewListItem[] {
  return loadReviewHistory().map((r) => ({
    id: r.id,
    summary: r.result.summary,
    qualityScore: r.result.qualityScore,
    findingCount: r.result.findings.length,
    criticalCount: r.result.findings.filter((f) => f.severity === "critical").length,
    provider: r.result.provider,
    createdAt: new Date(r.createdAt),
  }));
}

export function getReviewById(id: string): LocalReview | undefined {
  return loadReviewHistory().find((r) => r.id === id);
}

export function deleteReview(id: string) {
  const history = loadReviewHistory().filter((r) => r.id !== id);
  persistReviewHistory(history);
}

// --- Combined history ---

export function getCombinedHistory(): HistoryItem[] {
  const quotes: HistoryItem[] = getQuoteHistory().map((item) => ({
    type: "quote",
    item,
  }));

  const reviews: HistoryItem[] = getReviewHistory().map((item) => ({
    type: "review",
    item,
  }));

  return [...quotes, ...reviews].sort(
    (a, b) => b.item.createdAt.getTime() - a.item.createdAt.getTime()
  );
}
