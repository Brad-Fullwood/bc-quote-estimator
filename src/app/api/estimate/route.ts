import { NextRequest, NextResponse } from "next/server";
import { buildSystemPrompt, buildUserPrompt } from "@/lib/ai-prompt";
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

async function callAnthropic(
  systemPrompt: string,
  requirements: string,
  apiKey: string,
  model: string
): Promise<string> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 8192,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: buildUserPrompt(requirements),
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

async function callGoogle(
  systemPrompt: string,
  requirements: string,
  apiKey: string,
  model: string
): Promise<string> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
        contents: [
          {
            parts: [{ text: buildUserPrompt(requirements) }],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 8192,
          responseMimeType: "application/json",
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google AI API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

function parseAIResponse(raw: string): AITaskResponse {
  let jsonStr = raw.trim();

  const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    jsonStr = fenceMatch[1].trim();
  }

  const parsed = JSON.parse(jsonStr);

  if (!parsed.tasks || !Array.isArray(parsed.tasks)) {
    throw new Error("Invalid AI response: missing tasks array");
  }

  return parsed as AITaskResponse;
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
    let rawAnalysis: string;

    if (provider === "google") {
      rawAnalysis = await callGoogle(systemPrompt, requirements, apiKey, model);
    } else {
      rawAnalysis = await callAnthropic(systemPrompt, requirements, apiKey, model);
    }

    const aiResponse = parseAIResponse(rawAnalysis);
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
