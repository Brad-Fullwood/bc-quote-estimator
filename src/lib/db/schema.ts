import {
  pgTable,
  uuid,
  text,
  real,
  integer,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";

export const quotes = pgTable(
  "quotes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: text("session_id").notNull(),
    title: text("title").notNull(),
    requirementsText: text("requirements_text").notNull(),
    provider: text("provider").notNull(),
    model: text("model").notNull(),
    settingsSnapshot: jsonb("settings_snapshot").notNull(),
    totalHours: real("total_hours").notNull(),
    totalDays: real("total_days").notNull(),
    subtotalHours: real("subtotal_hours").notNull(),
    taskCount: integer("task_count").notNull(),
    confidence: text("confidence").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("quotes_session_id_idx").on(table.sessionId)]
);

export const quoteTasks = pgTable(
  "quote_tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    quoteId: uuid("quote_id")
      .notNull()
      .references(() => quotes.id, { onDelete: "cascade" }),
    taskIndex: integer("task_index").notNull(),
    title: text("title").notNull(),
    category: text("category").notNull(),
    complexity: text("complexity").notNull(),
    baseHours: real("base_hours").notNull(),
    adjustedHours: real("adjusted_hours").notNull(),
    multiplierUsed: real("multiplier_used").notNull(),
    rating: text("rating"),
    actualHours: real("actual_hours"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("quote_tasks_quote_id_idx").on(table.quoteId)]
);

export const quoteRatings = pgTable("quote_ratings", {
  id: uuid("id").primaryKey().defaultRandom(),
  quoteId: uuid("quote_id")
    .notNull()
    .references(() => quotes.id, { onDelete: "cascade" }),
  sessionId: text("session_id").notNull(),
  actualTotalHours: real("actual_total_hours"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
