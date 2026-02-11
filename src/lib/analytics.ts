import type { MultiplierSuggestion, EstimationSettings } from "./types";

const HALF_LIFE_DAYS = 90;
const MIN_DATA_POINTS = 3;
const MIN_MULTIPLIER = 0.5;
const MAX_MULTIPLIER = 5.0;

interface TaskDataPoint {
  complexity: string;
  adjustedHours: number;
  actualHours: number | null;
  multiplierUsed: number;
  createdAt: Date;
}

function recencyWeight(createdAt: Date): number {
  const ageMs = Date.now() - new Date(createdAt).getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  return Math.pow(0.5, ageDays / HALF_LIFE_DAYS);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function computeMultiplierSuggestions(
  dataPoints: TaskDataPoint[],
  currentSettings: EstimationSettings
): MultiplierSuggestion[] {
  const complexityMap = new Map<string, TaskDataPoint[]>();

  for (const dp of dataPoints) {
    if (dp.actualHours == null) continue;

    const existing = complexityMap.get(dp.complexity) ?? [];
    existing.push(dp);
    complexityMap.set(dp.complexity, existing);
  }

  const settingsMultipliers: Record<string, number> = {
    simple: currentSettings.complexitySimple,
    medium: currentSettings.complexityMedium,
    complex: currentSettings.complexityComplex,
    "very-complex": currentSettings.complexityVeryComplex,
  };

  const suggestions: MultiplierSuggestion[] = [];

  for (const [complexity, points] of complexityMap.entries()) {
    if (points.length < MIN_DATA_POINTS) continue;

    let weightedCorrectionSum = 0;
    let totalWeight = 0;

    for (const point of points) {
      if (point.adjustedHours <= 0 || point.actualHours == null) continue;

      const correction = point.actualHours / point.adjustedHours;
      const weight = recencyWeight(point.createdAt);
      weightedCorrectionSum += correction * weight;
      totalWeight += weight;
    }

    if (totalWeight <= 0) continue;

    const avgCorrection = weightedCorrectionSum / totalWeight;
    const currentMultiplier = settingsMultipliers[complexity] ?? 1.0;
    const suggested = clamp(
      currentMultiplier * avgCorrection,
      MIN_MULTIPLIER,
      MAX_MULTIPLIER
    );

    suggestions.push({
      complexity,
      currentMultiplier,
      suggestedMultiplier: Math.round(suggested * 100) / 100,
      correction: Math.round(avgCorrection * 100) / 100,
      dataPoints: points.length,
    });
  }

  return suggestions;
}
