import { eq, desc, and, isNotNull } from "drizzle-orm";
import { db } from "./index";
import { quotes, quoteTasks, quoteRatings } from "./schema";
import type {
  QuoteResponse,
  EstimationSettings,
  TaskRating,
} from "@/lib/types";

export async function saveQuote(params: {
  sessionId: string;
  requirements: string;
  result: QuoteResponse;
  model: string;
  settings: EstimationSettings;
}): Promise<{ quoteId: string; taskIds: string[] }> {
  const { sessionId, requirements, result, model, settings } = params;
  const { breakdown, provider } = result;

  const title = requirements.slice(0, 60).trim();

  const [quote] = await db
    .insert(quotes)
    .values({
      sessionId,
      title,
      requirementsText: requirements,
      provider,
      model,
      settingsSnapshot: settings,
      totalHours: breakdown.totalHours,
      totalDays: breakdown.totalDays,
      subtotalHours: breakdown.subtotalHours,
      taskCount: breakdown.tasks.length,
      confidence: breakdown.confidence,
    })
    .returning({ id: quotes.id });

  const taskRows = breakdown.tasks.map((task, index) => ({
    quoteId: quote.id,
    taskIndex: index,
    title: task.title,
    category: task.category,
    complexity: task.complexity,
    baseHours: task.baseHours,
    adjustedHours: task.adjustedHours,
    multiplierUsed:
      task.adjustedHours / (task.baseHours * settings.globalMultiplier) || 1,
  }));

  const insertedTasks = await db
    .insert(quoteTasks)
    .values(taskRows)
    .returning({ id: quoteTasks.id });

  return {
    quoteId: quote.id,
    taskIds: insertedTasks.map((t) => t.id),
  };
}

export async function listQuotes(sessionId: string) {
  return db
    .select({
      id: quotes.id,
      title: quotes.title,
      totalHours: quotes.totalHours,
      totalDays: quotes.totalDays,
      taskCount: quotes.taskCount,
      confidence: quotes.confidence,
      provider: quotes.provider,
      createdAt: quotes.createdAt,
    })
    .from(quotes)
    .where(eq(quotes.sessionId, sessionId))
    .orderBy(desc(quotes.createdAt));
}

export async function getQuoteWithTasks(quoteId: string) {
  const [quote] = await db
    .select()
    .from(quotes)
    .where(eq(quotes.id, quoteId));

  if (!quote) return null;

  const tasks = await db
    .select()
    .from(quoteTasks)
    .where(eq(quoteTasks.quoteId, quoteId))
    .orderBy(quoteTasks.taskIndex);

  const ratings = await db
    .select()
    .from(quoteRatings)
    .where(eq(quoteRatings.quoteId, quoteId));

  return { quote, tasks, ratings };
}

export async function rateTask(
  taskId: string,
  rating: TaskRating,
  actualHours?: number
) {
  return db
    .update(quoteTasks)
    .set({
      rating,
      actualHours: rating === "down" ? actualHours : null,
    })
    .where(eq(quoteTasks.id, taskId))
    .returning();
}

export async function rateQuote(params: {
  quoteId: string;
  sessionId: string;
  actualTotalHours?: number;
  notes?: string;
}) {
  return db.insert(quoteRatings).values(params).returning();
}

export async function getTasksWithActualHours() {
  return db
    .select({
      complexity: quoteTasks.complexity,
      adjustedHours: quoteTasks.adjustedHours,
      actualHours: quoteTasks.actualHours,
      multiplierUsed: quoteTasks.multiplierUsed,
      createdAt: quoteTasks.createdAt,
    })
    .from(quoteTasks)
    .where(
      and(
        eq(quoteTasks.rating, "down"),
        isNotNull(quoteTasks.actualHours)
      )
    );
}

export async function getTasksForQuote(quoteId: string) {
  return db
    .select()
    .from(quoteTasks)
    .where(eq(quoteTasks.quoteId, quoteId))
    .orderBy(quoteTasks.taskIndex);
}
