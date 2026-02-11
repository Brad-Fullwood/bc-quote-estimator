import { NextRequest, NextResponse } from "next/server";
import { buildSystemPrompt, buildUserPrompt } from "@/lib/ai-prompt";
import { callAnthropic, callGoogle, parseJsonResponse } from "@/lib/ai-client";
import { calculateAdjustedHours, calculateBreakdown } from "@/lib/estimation-rules";
import type {
  AIProvider,
  EstimationTask,
  EstimationBreakdown,
  EstimationSettings,
  QuoteResponse,
} from "@/lib/types";

interface AITaskResponse {
  tasks: Array<{
    id: string;
    title: string;
    description: string;
    category: string;
    complexity: string;
    baseHours: number;
    dependencies: string[];
    notes: string;
  }>;
  confidence: string;
  assumptions: string[];
  risks: string[];
}

function buildEstimation(
  aiResponse: AITaskResponse,
  settings: EstimationSettings
): EstimationBreakdown {
  const tasks: EstimationTask[] = aiResponse.tasks.map((task) => {
    const adjustedHours = calculateAdjustedHours(
      task.baseHours,
      task.complexity as EstimationTask["complexity"],
      settings
    );

    return {
      id: task.id,
      title: task.title,
      description: task.description,
      category: task.category as EstimationTask["category"],
      complexity: task.complexity as EstimationTask["complexity"],
      baseHours: task.baseHours,
      adjustedHours,
      dependencies: task.dependencies || [],
      notes: task.notes || "",
    };
  });

  const breakdown = calculateBreakdown(
    tasks.map((t) => ({ baseHours: t.baseHours, complexity: t.complexity })),
    settings
  );

  return {
    tasks,
    ...breakdown,
    confidence: (aiResponse.confidence || "medium") as EstimationBreakdown["confidence"],
    assumptions: aiResponse.assumptions || [],
    risks: aiResponse.risks || [],
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      requirements,
      provider = "anthropic",
      model = "",
      apiKey,
      settings,
    } = body as {
      requirements: string;
      provider: AIProvider;
      model: string;
      apiKey: string;
      settings: EstimationSettings;
    };

    if (!requirements?.trim()) {
      return NextResponse.json(
        { error: "Requirements text is required" },
        { status: 400 }
      );
    }

    if (!apiKey?.trim()) {
      return NextResponse.json(
        { error: "API key is required" },
        { status: 400 }
      );
    }

    if (!model?.trim()) {
      return NextResponse.json(
        { error: "Please select a model" },
        { status: 400 }
      );
    }

    const systemPrompt = buildSystemPrompt(settings);
    const userMessage = buildUserPrompt(requirements);
    let rawAnalysis: string;

    if (provider === "google") {
      rawAnalysis = await callGoogle(systemPrompt, userMessage, apiKey, model);
    } else {
      rawAnalysis = await callAnthropic(systemPrompt, userMessage, apiKey, model);
    }

    const aiResponse = parseJsonResponse<AITaskResponse>(rawAnalysis);

    if (!aiResponse.tasks || !Array.isArray(aiResponse.tasks)) {
      throw new Error("Invalid AI response: missing tasks array");
    }

    const breakdown = buildEstimation(aiResponse, settings);

    const response: QuoteResponse = {
      breakdown,
      rawAnalysis,
      provider,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Estimation error:", error);
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
