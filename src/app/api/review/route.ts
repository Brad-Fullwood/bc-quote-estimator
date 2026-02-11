import { NextRequest, NextResponse } from "next/server";
import { buildReviewSystemPrompt, buildReviewUserPrompt } from "@/lib/review-prompt";
import { callAnthropic, callGoogle, parseJsonResponse } from "@/lib/ai-client";
import type { AIProvider, SpecReviewResult, SpecFinding } from "@/lib/types";

interface AIReviewResponse {
  qualityScore: number;
  summary: string;
  findings: SpecFinding[];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      requirements,
      provider = "anthropic",
      model = "",
      apiKey,
    } = body as {
      requirements: string;
      provider: AIProvider;
      model: string;
      apiKey: string;
    };

    if (!requirements?.trim()) {
      return NextResponse.json(
        { error: "Specification text is required" },
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

    const systemPrompt = buildReviewSystemPrompt();
    const userMessage = buildReviewUserPrompt(requirements);
    let rawResponse: string;

    if (provider === "google") {
      rawResponse = await callGoogle(systemPrompt, userMessage, apiKey, model);
    } else {
      rawResponse = await callAnthropic(systemPrompt, userMessage, apiKey, model);
    }

    const aiResponse = parseJsonResponse<AIReviewResponse>(rawResponse);

    if (typeof aiResponse.qualityScore !== "number" || !aiResponse.summary || !Array.isArray(aiResponse.findings)) {
      throw new Error("Invalid AI response: missing qualityScore, summary, or findings");
    }

    const result: SpecReviewResult = {
      qualityScore: aiResponse.qualityScore,
      summary: aiResponse.summary,
      findings: aiResponse.findings,
      provider,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Review error:", error);
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
