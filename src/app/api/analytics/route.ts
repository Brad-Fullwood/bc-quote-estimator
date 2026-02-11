import { NextRequest, NextResponse } from "next/server";
import { getTasksWithActualHours } from "@/lib/db/queries";
import { computeMultiplierSuggestions } from "@/lib/analytics";
import { DEFAULT_SETTINGS } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const settingsParam = request.nextUrl.searchParams.get("settings");
    const settings = settingsParam
      ? { ...DEFAULT_SETTINGS, ...JSON.parse(settingsParam) }
      : DEFAULT_SETTINGS;

    const dataPoints = await getTasksWithActualHours();
    const suggestions = computeMultiplierSuggestions(dataPoints, settings);

    return NextResponse.json({
      suggestions,
      totalDataPoints: dataPoints.length,
    });
  } catch (error) {
    console.error("Failed to compute analytics:", error);
    return NextResponse.json(
      { error: "Failed to compute analytics" },
      { status: 500 }
    );
  }
}
