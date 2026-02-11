import type { QuoteResponse, EstimationSettings, SavedQuoteListItem } from "./types";

const HISTORY_KEY = "bc-quote-history";
const MAX_QUOTES = 50;

export interface LocalQuote {
  id: string;
  requirements: string;
  result: QuoteResponse;
  settings: EstimationSettings;
  createdAt: string;
}

function loadHistory(): LocalQuote[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as LocalQuote[];
  } catch {
    return [];
  }
}

function persistHistory(quotes: LocalQuote[]) {
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

  const history = loadHistory();
  history.unshift(entry);

  // Cap storage size
  if (history.length > MAX_QUOTES) {
    history.length = MAX_QUOTES;
  }

  persistHistory(history);
  return { quoteId, taskIds };
}

export function getQuoteHistory(): SavedQuoteListItem[] {
  return loadHistory().map((q) => ({
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
  return loadHistory().find((q) => q.id === id);
}

export function deleteQuote(id: string) {
  const history = loadHistory().filter((q) => q.id !== id);
  persistHistory(history);
}
