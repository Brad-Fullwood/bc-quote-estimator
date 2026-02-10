"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { FileText, Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface RequirementsInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function RequirementsInput({ value, onChange }: RequirementsInputProps) {
  const [isParsing, setIsParsing] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      const isPdf = file.type === "application/pdf";
      const isDocx =
        file.type ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        file.name.endsWith(".docx");
      const isText =
        file.type === "text/plain" ||
        file.name.endsWith(".txt") ||
        file.name.endsWith(".md");

      if (isPdf || isDocx) {
        setIsParsing(true);
        try {
          const formData = new FormData();
          formData.append("file", file);

          const response = await fetch("/api/parse-pdf", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Failed to parse document");
          }

          const data = await response.json();
          onChange(data.text);
          setFileName(file.name);
          const pageInfo = data.pages ? ` (${data.pages} pages)` : "";
          toast.success(`Parsed ${file.name}${pageInfo}`);
        } catch (error) {
          toast.error(
            error instanceof Error ? error.message : "Failed to parse document"
          );
        } finally {
          setIsParsing(false);
        }
      } else if (isText) {
        const text = await file.text();
        onChange(text);
        setFileName(file.name);
        toast.success(`Loaded ${file.name}`);
      } else {
        toast.error("Please upload a PDF, DOCX, or text file");
      }
    },
    [onChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
      "text/plain": [".txt", ".md"],
    },
    maxFiles: 1,
    multiple: false,
  });

  return (
    <div className="bg-surface rounded-xl border border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-medium">Requirements</h3>
        </div>
        {fileName && (
          <button
            onClick={() => {
              setFileName(null);
              onChange("");
            }}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-3 h-3" />
            Clear
          </button>
        )}
      </div>

      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-4 mb-3 text-center cursor-pointer transition-all ${
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-border hover:border-border-hover"
        }`}
      >
        <input {...getInputProps()} />
        {isParsing ? (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Parsing document...
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1">
            <Upload className="w-5 h-5 text-muted" />
            <p className="text-sm text-muted-foreground">
              {isDragActive
                ? "Drop your file here"
                : "Drop a PDF, DOCX, or text file, or click to browse"}
            </p>
          </div>
        )}
      </div>

      {fileName && (
        <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground bg-background rounded-lg px-3 py-2">
          <FileText className="w-3 h-3" />
          {fileName}
        </div>
      )}

      {/* Text area */}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Describe the Business Central development requirements...

Example:
"We need a custom approval workflow for purchase orders over £5,000. This should include:
- A setup page where users can configure approval thresholds per department
- Email notifications to approvers
- A factbox on the purchase order card showing approval status
- Integration with our existing dimension structure for department filtering
- Reporting on approval turnaround times"`}
        rows={12}
        className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-y min-h-[200px]"
      />

      <div className="flex items-center justify-between mt-2">
        <p className="text-xs text-muted">
          {value.length > 0
            ? `${value.length.toLocaleString()} characters`
            : "Paste, type, or upload your requirements"}
        </p>
      </div>
    </div>
  );
}
