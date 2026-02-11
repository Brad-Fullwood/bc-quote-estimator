export type AIProvider = "anthropic" | "google";

export interface AIModel {
  id: string;
  name: string;
}

export type TaskCategory =
  | "table"
  | "table-extension"
  | "page-card"
  | "page-list"
  | "page-extension"
  | "codeunit-simple"
  | "codeunit-complex"
  | "report"
  | "api-integration"
  | "data-migration"
  | "enum"
  | "permission-set"
  | "event-subscriber"
  | "workflow"
  | "notification"
  | "xmlport"
  | "query"
  | "configuration"
  | "testing"
  | "documentation"
  | "deployment";

export type Complexity = "simple" | "medium" | "complex" | "very-complex";

export interface EstimationTask {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  complexity: Complexity;
  baseHours: number;
  adjustedHours: number;
  dependencies: string[];
  notes: string;
}

export interface EstimationBreakdown {
  tasks: EstimationTask[];
  subtotalHours: number;
  codeReviewHours: number;
  testingHours: number;
  projectManagementHours: number;
  contingencyHours: number;
  totalHours: number;
  totalDays: number;
  confidence: "low" | "medium" | "high";
  assumptions: string[];
  risks: string[];
}

export interface QuoteRequest {
  requirements: string;
  provider: AIProvider;
  includeContingency: boolean;
  contingencyPercent: number;
  hourlyRate?: number;
}

export interface QuoteResponse {
  breakdown: EstimationBreakdown;
  rawAnalysis: string;
  provider: AIProvider;
  createdAt: string;
}

export interface SavedQuote {
  id: string;
  title: string;
  requirements: string;
  response: QuoteResponse;
  createdAt: string;
}

export interface EstimationSettings {
  // Prompt tuning
  estimationStyle: number; // 1=lean, 2=realistic, 3=padded
  developerExperience: number; // 1=expert, 2=senior, 3=mid, 4=junior
  taskGranularity: number; // 1=coarse (fewer bigger tasks), 2=balanced, 3=granular
  customPromptContext: string; // free text appended to prompt

  // Calculation tuning
  codeReviewPercent: number;
  testingPercent: number;
  projectManagementPercent: number;
  contingencyPercent: number;
  hoursPerDay: number;
  hourlyRate: number;

  // Complexity multipliers
  complexitySimple: number;
  complexityMedium: number;
  complexityComplex: number;
  complexityVeryComplex: number;

  // Global scaling
  globalMultiplier: number; // 0.5 - 2.0
}

// Rating types
export type TaskRating = "up" | "down";

export interface TaskRatingState {
  rating: TaskRating | null;
  actualHours?: number;
}

export interface SavedQuoteListItem {
  id: string;
  title: string;
  totalHours: number;
  totalDays: number;
  taskCount: number;
  confidence: string;
  provider: string;
  createdAt: Date;
}

export interface SavedQuoteTask {
  id: string;
  quoteId: string;
  taskIndex: number;
  title: string;
  category: string;
  complexity: string;
  baseHours: number;
  adjustedHours: number;
  multiplierUsed: number;
  rating: string | null;
  actualHours: number | null;
  createdAt: Date;
}

export interface MultiplierSuggestion {
  complexity: string;
  currentMultiplier: number;
  suggestedMultiplier: number;
  correction: number;
  dataPoints: number;
}

export const DEFAULT_SETTINGS: EstimationSettings = {
  estimationStyle: 2,
  developerExperience: 2,
  taskGranularity: 2,
  customPromptContext: "",
  codeReviewPercent: 10,
  testingPercent: 10,
  projectManagementPercent: 5,
  contingencyPercent: 10,
  hoursPerDay: 7.5,
  hourlyRate: 0,
  complexitySimple: 1.0,
  complexityMedium: 1.3,
  complexityComplex: 1.6,
  complexityVeryComplex: 2.5,
  globalMultiplier: 1.0,
};
