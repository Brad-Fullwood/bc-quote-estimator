import { NextRequest, NextResponse } from "next/server";
import { rateTask } from "@/lib/db/queries";
import type { TaskRating } from "@/lib/types";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const { taskId } = await params;
    const body = (await request.json()) as {
      rating: TaskRating;
      actualHours?: number;
    };

    if (!body.rating || !["up", "down"].includes(body.rating)) {
      return NextResponse.json(
        { error: 'rating must be "up" or "down"' },
        { status: 400 }
      );
    }

    if (body.rating === "down" && (body.actualHours == null || body.actualHours <= 0)) {
      return NextResponse.json(
        { error: "actualHours is required and must be > 0 for a down rating" },
        { status: 400 }
      );
    }

    const [updated] = await rateTask(taskId, body.rating, body.actualHours);

    if (!updated) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to rate task:", error);
    return NextResponse.json(
      { error: "Failed to rate task" },
      { status: 500 }
    );
  }
}
