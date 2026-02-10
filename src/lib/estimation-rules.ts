import type { TaskCategory, Complexity, EstimationSettings } from "./types";

/**
 * Base hour ranges for each BC task category.
 * These are intentionally tight — the AI picks within range,
 * then settings-based multipliers adjust from there.
 */
export const BASE_HOURS: Record<TaskCategory, [number, number]> = {
  table: [1, 3],
  "table-extension": [0.5, 2],
  "page-card": [2, 4],
  "page-list": [2, 4],
  "page-extension": [1, 3],
  "codeunit-simple": [2, 5],
  "codeunit-complex": [4, 12],
  report: [3, 8],
  "api-integration": [4, 16],
  "data-migration": [3, 10],
  enum: [0.25, 0.5],
  "permission-set": [0.5, 1],
  "event-subscriber": [1, 3],
  workflow: [3, 8],
  notification: [1, 3],
  xmlport: [2, 6],
  query: [1, 3],
  configuration: [1, 3],
  testing: [1, 4],
  documentation: [0.5, 2],
  deployment: [1, 3],
};

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
 * Get complexity multipliers from settings.
 */
export function getComplexityMultipliers(
  settings: EstimationSettings
): Record<Complexity, number> {
  return {
    simple: settings.complexitySimple,
    medium: settings.complexityMedium,
    complex: settings.complexityComplex,
    "very-complex": settings.complexityVeryComplex,
  };
}

/**
 * Calculate adjusted hours given base hours, complexity, and settings.
 */
export function calculateAdjustedHours(
  baseHours: number,
  complexity: Complexity,
  settings: EstimationSettings
): number {
  const multipliers = getComplexityMultipliers(settings);
  const adjusted = baseHours * multipliers[complexity] * settings.globalMultiplier;
  return Math.round(adjusted * 10) / 10;
}

/**
 * Calculate the full estimation breakdown from a list of tasks.
 */
export function calculateBreakdown(
  tasks: Array<{
    baseHours: number;
    complexity: Complexity;
  }>,
  settings: EstimationSettings
) {
  const subtotalHours = tasks.reduce((sum, task) => {
    return sum + calculateAdjustedHours(task.baseHours, task.complexity, settings);
  }, 0);

  const codeReviewHours =
    Math.round(subtotalHours * (settings.codeReviewPercent / 100) * 10) / 10;
  const testingHours =
    Math.round(subtotalHours * (settings.testingPercent / 100) * 10) / 10;
  const projectManagementHours =
    Math.round(subtotalHours * (settings.projectManagementPercent / 100) * 10) / 10;

  const beforeContingency =
    subtotalHours + codeReviewHours + testingHours + projectManagementHours;
  const contingencyHours =
    Math.round(beforeContingency * (settings.contingencyPercent / 100) * 10) / 10;

  const totalHours =
    Math.round((beforeContingency + contingencyHours) * 10) / 10;
  const totalDays = Math.round((totalHours / settings.hoursPerDay) * 10) / 10;

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
