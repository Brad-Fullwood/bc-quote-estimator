import type { TaskCategory, Complexity } from "./types";

/**
 * Base hour ranges for each BC task category.
 * [min, max] - the AI picks within this range based on context,
 * then complexity multipliers are applied.
 */
export const BASE_HOURS: Record<TaskCategory, [number, number]> = {
  table: [2, 4],
  "table-extension": [1, 3],
  "page-card": [3, 6],
  "page-list": [3, 6],
  "page-extension": [2, 4],
  "codeunit-simple": [4, 8],
  "codeunit-complex": [8, 20],
  report: [4, 12],
  "api-integration": [8, 24],
  "data-migration": [4, 16],
  enum: [0.5, 1],
  "permission-set": [1, 2],
  "event-subscriber": [2, 4],
  workflow: [4, 12],
  notification: [2, 4],
  xmlport: [4, 8],
  query: [2, 4],
  configuration: [2, 4],
  testing: [2, 6],
  documentation: [1, 4],
  deployment: [2, 4],
};

/**
 * Complexity multipliers applied to the base hours.
 */
export const COMPLEXITY_MULTIPLIERS: Record<Complexity, number> = {
  simple: 1.0,
  medium: 1.5,
  complex: 2.0,
  "very-complex": 3.0,
};

/**
 * Overhead percentages applied to the subtotal.
 */
export const OVERHEAD = {
  codeReview: 0.15,
  testing: 0.20,
  projectManagement: 0.10,
} as const;

/**
 * Human-readable labels for task categories.
 */
export const CATEGORY_LABELS: Record<TaskCategory, string> = {
  table: "New Table",
  "table-extension": "Table Extension",
  "page-card": "Card Page",
  "page-list": "List Page",
  "page-extension": "Page Extension",
  "codeunit-simple": "Codeunit (Simple)",
  "codeunit-complex": "Codeunit (Complex)",
  report: "Report / Report Extension",
  "api-integration": "API / Integration",
  "data-migration": "Data Migration",
  enum: "Enum / Enum Extension",
  "permission-set": "Permission Set",
  "event-subscriber": "Event Subscriber",
  workflow: "Workflow / Approval",
  notification: "Notification",
  xmlport: "XMLport",
  query: "Query Object",
  configuration: "Configuration / Setup",
  testing: "Testing & QA",
  documentation: "Documentation",
  deployment: "Deployment & Release",
};

/**
 * Category color coding for the UI.
 */
export const CATEGORY_COLORS: Record<TaskCategory, string> = {
  table: "#3b82f6",
  "table-extension": "#60a5fa",
  "page-card": "#8b5cf6",
  "page-list": "#a78bfa",
  "page-extension": "#c084fc",
  "codeunit-simple": "#22c55e",
  "codeunit-complex": "#16a34a",
  report: "#f59e0b",
  "api-integration": "#ef4444",
  "data-migration": "#f97316",
  enum: "#06b6d4",
  "permission-set": "#64748b",
  "event-subscriber": "#14b8a6",
  workflow: "#ec4899",
  notification: "#d946ef",
  xmlport: "#84cc16",
  query: "#0ea5e9",
  configuration: "#78716c",
  testing: "#eab308",
  documentation: "#a3a3a3",
  deployment: "#6366f1",
};

/**
 * Calculate adjusted hours given base hours and complexity.
 */
export function calculateAdjustedHours(
  baseHours: number,
  complexity: Complexity
): number {
  return Math.round(baseHours * COMPLEXITY_MULTIPLIERS[complexity] * 10) / 10;
}

/**
 * Calculate the full estimation breakdown from a list of tasks.
 */
export function calculateBreakdown(
  tasks: Array<{
    baseHours: number;
    complexity: Complexity;
  }>,
  contingencyPercent: number = 15
) {
  const subtotalHours = tasks.reduce((sum, task) => {
    return sum + calculateAdjustedHours(task.baseHours, task.complexity);
  }, 0);

  const codeReviewHours =
    Math.round(subtotalHours * OVERHEAD.codeReview * 10) / 10;
  const testingHours =
    Math.round(subtotalHours * OVERHEAD.testing * 10) / 10;
  const projectManagementHours =
    Math.round(subtotalHours * OVERHEAD.projectManagement * 10) / 10;

  const beforeContingency =
    subtotalHours + codeReviewHours + testingHours + projectManagementHours;
  const contingencyHours =
    Math.round(beforeContingency * (contingencyPercent / 100) * 10) / 10;

  const totalHours =
    Math.round((beforeContingency + contingencyHours) * 10) / 10;
  const totalDays = Math.round((totalHours / 7.5) * 10) / 10;

  return {
    subtotalHours: Math.round(subtotalHours * 10) / 10,
    codeReviewHours,
    testingHours,
    projectManagementHours,
    contingencyHours,
    totalHours,
    totalDays,
  };
}
