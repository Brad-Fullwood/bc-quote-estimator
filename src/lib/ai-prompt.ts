import { BASE_HOURS, CATEGORY_LABELS } from "./estimation-rules";
import type { TaskCategory, EstimationSettings } from "./types";

const categoryReference = (
  Object.entries(BASE_HOURS) as [TaskCategory, [number, number]][]
)
  .map(
    ([key, [min, max]]) =>
      `  - "${key}" (${CATEGORY_LABELS[key]}): ${min}-${max} base hours`
  )
  .join("\n");

const STYLE_LABELS: Record<number, string> = {
  1: "lean",
  2: "realistic",
  3: "padded",
};

const EXPERIENCE_LABELS: Record<number, string> = {
  1: "expert (10+ years BC, very fast, knows all patterns)",
  2: "senior (5+ years BC, fast, knows most patterns)",
  3: "mid-level (2-5 years BC, moderate speed)",
  4: "junior (under 2 years BC, needs more time)",
};

const GRANULARITY_INSTRUCTIONS: Record<number, string> = {
  1: "Group related work into FEWER, LARGER tasks. For example, a table + its page + its codeunit logic for one feature should be ONE task, not three. Aim for 3-8 tasks total for a typical project. Don't create separate tasks for enums, permission sets, or other trivial objects — fold them into the parent task.",
  2: "Break work into a sensible number of tasks. Group closely related objects together (e.g. a table and its page can be one task) but keep distinct functional areas separate. Aim for 5-12 tasks for a typical project.",
  3: "Break work into granular, individually-deliverable tasks. Each distinct AL object or piece of functionality should be its own task. This gives maximum visibility into the work.",
};

export function buildSystemPrompt(settings: EstimationSettings): string {
  const style = STYLE_LABELS[settings.estimationStyle] ?? "realistic";
  const experience =
    EXPERIENCE_LABELS[settings.developerExperience] ?? EXPERIENCE_LABELS[2];
  const granularity =
    GRANULARITY_INSTRUCTIONS[settings.taskGranularity] ??
    GRANULARITY_INSTRUCTIONS[2];

  let styleGuidance: string;
  if (settings.estimationStyle === 1) {
    styleGuidance = `ESTIMATION APPROACH: LEAN
- Estimate for the happy path. An experienced BC developer who knows the patterns.
- Use the LOWER end of base hour ranges unless there's a clear reason not to.
- Don't pad for unlikely edge cases or hypothetical complexity.
- Assume the developer has done similar work before and won't need ramp-up time.
- Only flag genuine unknowns, not routine BC development concerns.
- Do NOT include separate tasks for testing, documentation, or deployment unless explicitly requested — those are handled as overhead percentages separately.`;
  } else if (settings.estimationStyle === 3) {
    styleGuidance = `ESTIMATION APPROACH: PADDED / CONSERVATIVE
- Estimate for a cautious timeline with buffer built in.
- Use the UPPER end of base hour ranges.
- Consider edge cases, data validation, error handling, and permissions.
- Factor in BC-specific gotchas: posting routines, dimensions, number series.
- Include tasks for setup, configuration, and environment preparation.
- If requirements are vague, note assumptions and estimate higher.`;
  } else {
    styleGuidance = `ESTIMATION APPROACH: REALISTIC
- Estimate what it would actually take a competent BC developer.
- Use the MIDDLE of base hour ranges, adjusting based on apparent complexity.
- Consider common gotchas but don't pad for unlikely scenarios.
- Balance thoroughness with pragmatism.`;
  }

  const customContext = settings.customPromptContext?.trim()
    ? `\n\nADDITIONAL CONTEXT FROM THE USER:\n${settings.customPromptContext}`
    : "";

  return `You are an expert Microsoft Dynamics 365 Business Central developer estimating AL development projects. Break requirements into specific, actionable development tasks with time estimates.

DEVELOPER PROFILE: ${experience}

${styleGuidance}

TASK GRANULARITY:
${granularity}

TASK CATEGORIES AND BASE HOUR RANGES:
${categoryReference}

COMPLEXITY LEVELS (multipliers are applied AFTER your estimate, so estimate base hours only):
- "simple": Straightforward, standard pattern (multiplied by ${settings.complexitySimple}x after)
- "medium": Some custom logic or non-standard requirements (multiplied by ${settings.complexityMedium}x after)
- "complex": Significant custom logic or multiple moving parts (multiplied by ${settings.complexityComplex}x after)
- "very-complex": Novel patterns, heavy integration, significant unknowns (multiplied by ${settings.complexityVeryComplex}x after)

CRITICAL RULES:
1. The baseHours you provide are RAW development hours BEFORE any multipliers.
2. Complexity multipliers, overhead (code review, testing, PM), and contingency are added AUTOMATICALLY by the system — do NOT bake them into your baseHours.
3. Do NOT create separate tasks for: code review, testing/QA, project management, documentation, or deployment UNLESS the requirements explicitly call for something unusual in those areas. These are handled as percentage overheads.
4. Prefer "simple" or "medium" complexity for standard BC patterns. Reserve "complex" and "very-complex" for genuinely difficult work.
5. An experienced BC dev can create a basic table + page in under 2 hours. Keep estimates grounded.${customContext}

Respond with ONLY valid JSON matching this structure:
{
  "tasks": [
    {
      "id": "task-1",
      "title": "Short descriptive title",
      "description": "What this task involves",
      "category": "one of the category keys listed above",
      "complexity": "simple|medium|complex|very-complex",
      "baseHours": <number — raw dev hours, no padding>,
      "dependencies": ["task-id"],
      "notes": "Caveats or assumptions"
    }
  ],
  "confidence": "low|medium|high",
  "assumptions": ["Assumptions made"],
  "risks": ["Risks that could affect the estimate"]
}

Respond ONLY with JSON. No markdown, no code fences.`;
}

export function buildUserPrompt(requirements: string): string {
  return `Analyze these Business Central development requirements and break them into estimatable tasks.

REQUIREMENTS:
---
${requirements}
---

Respond with ONLY valid JSON. Remember: baseHours = raw dev time only. Multipliers and overhead are added automatically.`;
}
