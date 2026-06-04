/**
 * Wilks Calculator — Official Formula (2020 update)
 *
 * Reference: Robert Wilks (Powerlifting Australia)
 * Coefficients: https://wilkscalculator.com / IPF Technical Rules
 *
 * Formula:
 *   Wilks Points = lifted_kg × (500 / polynomial(bodyweight_kg))
 *
 * The polynomial is a degree-5 polynomial with gender-specific coefficients.
 * This normalises lifted weight against bodyweight, enabling cross-class comparison.
 *
 * Usage in TrainingApp:
 *   - Input:  gender, body weight (kg), calculated 1RM via Epley formula
 *   - Output: Wilks points → mapped to RPG rank tier
 */

import type { Gender } from '@/types/profile'
import type { RankDefinition, RankResult, RankTier } from '@/types/ranks'

// ─────────────────────────────────────────────
// WILKS POLYNOMIAL COEFFICIENTS
// ─────────────────────────────────────────────

/** Coefficients for MALES */
const MALE_COEFFS = {
  a: -216.0475144,
  b:   16.2606339,
  c:   -0.002388645,
  d:   -0.00113732,
  e:    7.01863e-6,
  f:   -1.291e-8,
} as const

/** Coefficients for FEMALES */
const FEMALE_COEFFS = {
  a:  594.31747775582,
  b:  -27.23842536447,
  c:    0.82112226871,
  d:   -0.00930733913,
  e:    4.731582e-5,
  f:   -9.054e-8,
} as const

// ─────────────────────────────────────────────
// RANK THRESHOLDS (Wilks points)
// ─────────────────────────────────────────────
//
// These are per-exercise single-lift thresholds.
// For a standard powerlifting TOTAL multiply by ~2.7 for reference.
//
// Calibrated for main compound lifts (Squat, Bench, Deadlift, OHP).
// Bodyweight exercises use a separate rep-based system (see getRepRank).

export const RANK_DEFINITIONS: RankDefinition[] = [
  { tier: 'unranked',  label: 'Unranked',  minPoints: 0,   maxPoints: 50,   colorKey: 'muted',    emoji: '⬛' },
  { tier: 'bronze',    label: 'Bronze',    minPoints: 50,  maxPoints: 100,  colorKey: 'bronze',   emoji: '🟫' },
  { tier: 'silver',    label: 'Silver',    minPoints: 100, maxPoints: 150,  colorKey: 'silver',   emoji: '⬜' },
  { tier: 'gold',      label: 'Gold',      minPoints: 150, maxPoints: 200,  colorKey: 'gold',     emoji: '🟨' },
  { tier: 'platinum',  label: 'Platinum',  minPoints: 200, maxPoints: 260,  colorKey: 'platinum', emoji: '🩵' },
  { tier: 'diamond',   label: 'Diamond',   minPoints: 260, maxPoints: 320,  colorKey: 'diamond',  emoji: '💎' },
  { tier: 'emerald',   label: 'Emerald',   minPoints: 320, maxPoints: 380,  colorKey: 'emerald',  emoji: '💚' },
  { tier: 'ruby',      label: 'Ruby',      minPoints: 380, maxPoints: 440,  colorKey: 'ruby',     emoji: '❤️' },
  { tier: 'opal',      label: 'Opal',      minPoints: 440, maxPoints: 500,  colorKey: 'opal',     emoji: '🌈' },
  { tier: 'damascus',  label: 'Damascus',  minPoints: 500, maxPoints: Infinity, colorKey: 'damascus', emoji: '⚫' },
]

// ─────────────────────────────────────────────
// CORE FUNCTIONS
// ─────────────────────────────────────────────

/**
 * Calculate Wilks points for a single lift.
 *
 * @param gender       - 'male' | 'female'
 * @param bodyWeightKg - Athlete's body weight in kg (must be 20–300 range)
 * @param liftedKg     - Calculated 1RM in kg (e.g. via Epley formula)
 * @returns Wilks score (floating point, typically 0–700+ range)
 */
export function calculateWilks(
  gender: Gender,
  bodyWeightKg: number,
  liftedKg: number,
): number {
  // Guard: formula is only valid within reasonable BW range
  const bw = Math.max(20, Math.min(bodyWeightKg, 300))
  const coeffs = gender === 'male' ? MALE_COEFFS : FEMALE_COEFFS

  const denominator =
    coeffs.a +
    coeffs.b * bw +
    coeffs.c * bw ** 2 +
    coeffs.d * bw ** 3 +
    coeffs.e * bw ** 4 +
    coeffs.f * bw ** 5

  if (denominator <= 0) return 0

  return (liftedKg * 500) / denominator
}

/**
 * Calculate 1RM using the Epley formula.
 *
 * @param weight - Weight lifted (kg)
 * @param reps   - Repetitions performed (must be ≥ 1)
 * @returns Estimated 1RM in kg
 */
export function calculateEpley1RM(weight: number, reps: number): number {
  if (reps <= 0) return 0
  if (reps === 1) return weight
  return weight * (1 + reps / 30)
}

/**
 * Look up the RankDefinition for a given Wilks score.
 */
export function getRankDefinition(wilksPoints: number): RankDefinition {
  // Iterate in reverse to find the highest tier that the score qualifies for
  for (let i = RANK_DEFINITIONS.length - 1; i >= 0; i--) {
    if (wilksPoints >= RANK_DEFINITIONS[i].minPoints) {
      return RANK_DEFINITIONS[i]
    }
  }
  return RANK_DEFINITIONS[0] // unranked fallback
}

/**
 * Full rank computation for a barbell / dumbbell exercise.
 *
 * @param gender       - Athlete's gender
 * @param bodyWeightKg - Athlete's body weight in kg
 * @param weight       - Weight lifted in the best set (kg)
 * @param reps         - Reps performed in the best set
 * @returns RankResult with all relevant data
 */
export function computeRank(
  gender: Gender,
  bodyWeightKg: number,
  weight: number,
  reps: number,
): RankResult {
  const oneRepMax   = calculateEpley1RM(weight, reps)
  const wilksPoints = calculateWilks(gender, bodyWeightKg, oneRepMax)
  const definition  = getRankDefinition(wilksPoints)

  const currentIndex = RANK_DEFINITIONS.findIndex((r) => r.tier === definition.tier)
  const nextDef      = RANK_DEFINITIONS[currentIndex + 1] ?? null

  const pointsToNextTier = nextDef
    ? Math.max(0, nextDef.minPoints - wilksPoints)
    : 0

  const tierRange = definition.maxPoints === Infinity
    ? 1
    : definition.maxPoints - definition.minPoints

  const tierProgress = definition.maxPoints === Infinity
    ? 1
    : Math.min(1, (wilksPoints - definition.minPoints) / tierRange)

  return {
    tier:             definition.tier,
    wilksPoints:      Math.round(wilksPoints * 10) / 10,
    oneRepMax:        Math.round(oneRepMax * 10) / 10,
    definition,
    pointsToNextTier: Math.round(pointsToNextTier * 10) / 10,
    tierProgress,
  }
}

// ─────────────────────────────────────────────
// BODYWEIGHT / REP-BASED RANK (Pull-ups, Dips)
// ─────────────────────────────────────────────

const REP_RANK_THRESHOLDS: Array<{ tier: RankTier; minReps: number }> = [
  { tier: 'unranked', minReps: 0  },
  { tier: 'bronze',   minReps: 1  },
  { tier: 'silver',   minReps: 5  },
  { tier: 'gold',     minReps: 10 },
  { tier: 'platinum', minReps: 15 },
  { tier: 'diamond',  minReps: 20 },
  { tier: 'emerald',  minReps: 25 },
  { tier: 'ruby',     minReps: 30 },
  { tier: 'opal',     minReps: 35 },
  { tier: 'damascus', minReps: 40 },
]

/**
 * Rank for bodyweight exercises (Pull-ups, Dips, etc.) based on clean reps.
 */
export function getRepRank(reps: number): RankDefinition {
  let tierKey: RankTier = 'unranked'
  for (const threshold of REP_RANK_THRESHOLDS) {
    if (reps >= threshold.minReps) tierKey = threshold.tier
  }
  return RANK_DEFINITIONS.find((r) => r.tier === tierKey) ?? RANK_DEFINITIONS[0]
}
