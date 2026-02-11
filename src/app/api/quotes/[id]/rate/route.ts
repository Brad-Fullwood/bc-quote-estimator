import { NextRequest, NextResponse } from "next/server";
import { rateQuote } from "@/lib/db/queries";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = (await request.json()) as {
      sessionId: string;
      actualTotalHours?: number;
      notes?: string;
    };

    if (!body.sessionId) {
      return NextResponse.json(
        { error: "sessionId is required" },
        { status: 400 }
      );
    }

    const [rating] = await rateQuote({
      quoteId: id,
      sessionId: body.sessionId,
      actualTotalHours: body.actualTotalHours,
      notes: body.notes,
    });

    return NextResponse.json(rating, { status: 201 });
  } catch (error) {
    console.error("Failed to rate quote:", error);
    return NextResponse.json(
      { error: "Failed to rate quote" },
      { status: 500 }
    );
  }
}
