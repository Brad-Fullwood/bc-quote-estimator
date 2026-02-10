import { NextRequest, NextResponse } from "next/server";

const ALLOWED_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const isDocx =
      file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.name.endsWith(".docx");

    if (!ALLOWED_TYPES.has(file.type) && !file.name.endsWith(".docx")) {
      return NextResponse.json(
        { error: "File must be a PDF or DOCX" },
        { status: 400 }
      );
    }

    // Max 10MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File must be under 10MB" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    if (isDocx) {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });

      return NextResponse.json({
        text: result.value,
        pages: null,
        info: { format: "docx" },
      });
    }

    // PDF path
    const pdfParse = (await import("pdf-parse")).default;
    const data = await pdfParse(buffer);

    return NextResponse.json({
      text: data.text,
      pages: data.numpages,
      info: data.info,
    });
  } catch (error) {
    console.error("Document parse error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to parse document";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
