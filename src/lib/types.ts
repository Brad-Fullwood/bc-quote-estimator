export type AIProvider = "anthropic" | "google";

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
