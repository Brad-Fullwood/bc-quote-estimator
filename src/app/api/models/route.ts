import { NextRequest, NextResponse } from "next/server";
import type { AIProvider, AIModel } from "@/lib/types";

async function fetchAnthropicModels(apiKey: string): Promise<AIModel[]> {
  const response = await fetch("https://api.anthropic.com/v1/models", {
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return (data.data as Array<{ id: string; display_name: string }>)
    .map((m) => ({ id: m.id, name: m.display_name || m.id }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

async function fetchGoogleModels(apiKey: string): Promise<AIModel[]> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google AI API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return (
    data.models as Array<{ name: string; displayName: string; supportedGenerationMethods: string[] }>
  )
    .filter((m) => m.supportedGenerationMethods?.includes("generateContent"))
    .map((m) => ({
      id: m.name.replace("models/", ""),
      name: m.displayName || m.name,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function POST(request: NextRequest) {
  try {
    const { provider, apiKey } = (await request.json()) as {
      provider: AIProvider;
      apiKey: string;
    };

    if (!apiKey?.trim()) {
      return NextResponse.json(
        { error: "API key is required" },
        { status: 400 }
      );
    }

    const models =
      provider === "google"
        ? await fetchGoogleModels(apiKey)
        : await fetchAnthropicModels(apiKey);

    return NextResponse.json({ models });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch models";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
