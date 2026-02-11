import { NextRequest, NextResponse } from "next/server";
import { saveQuote, listQuotes } from "@/lib/db/queries";
import type { QuoteResponse, EstimationSettings } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      sessionId: string;
      requirements: string;
      result: QuoteResponse;
      model: string;
      settings: EstimationSettings;
    };

    if (!body.sessionId || !body.result) {
      return NextResponse.json(
        { error: "sessionId and result are required" },
        { status: 400 }
      );
    }

    const saved = await saveQuote(body);
    return NextResponse.json(saved, { status: 201 });
  } catch (error) {
    console.error("Failed to save quote:", error);
    return NextResponse.json(
      { error: "Failed to save quote" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get("sessionId");
    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId query param is required" },
        { status: 400 }
      );
    }

    const results = await listQuotes(sessionId);
    return NextResponse.json(results);
  } catch (error) {
    console.error("Failed to list quotes:", error);
    return NextResponse.json(
      { error: "Failed to list quotes" },
      { status: 500 }
    );
  }
}
