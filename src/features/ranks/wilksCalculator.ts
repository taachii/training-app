/**
 * Wilks Calculator — Official Formula (2020 update)
 * Updated rank ladder: Bronze → Silver → Gold → Platinum → Diamond → Emerald → Ruby → Amethyst → Obsidian
 */

import type { Gender } from '@/types/profile'
import type { RankDefinition, RankResult, RankTier } from '@/types/ranks'

// ─────────────────────────────────────────────
// WILKS POLYNOMIAL COEFFICIENTS
// ─────────────────────────────────────────────

const MALE_COEFFS = {
  a: -216.0475144,
  b:   16.2606339,
  c:   -0.002388645,
  d:   -0.00113732,
  e:    7.01863e-6,
  f:   -1.291e-8,
} as const

const FEMALE_COEFFS = {
  a:  594.31747775582,
  b:  -27.23842536447,
  c:    0.82112226871,
  d:   -0.00930733913,
  e:    4.731582e-5,
  f:   -9.054e-8,
} as const

// ─────────────────────────────────────────────
// RANK DEFINITIONS (per-exercise Wilks points)
// ─────────────────────────────────────────────

export const RANK_DEFINITIONS: RankDefinition[] = [
  {
    tier: 'unranked',
    label: 'Unranked',
    minPoints: 0,
    maxPoints: 50,
    color: '#6b7280',
    emoji: '⬛',
  },
  {
    tier: 'bronze',
    label: 'Bronze',
    minPoints: 50,
    maxPoints: 100,
    color: '#cd7f32',
    emoji: '🟫',
  },
  {
    tier: 'silver',
    label: 'Silver',
    minPoints: 100,
    maxPoints: 150,
    color: '#c0c0c0',
    emoji: '⬜',
  },
  {
    tier: 'gold',
    label: 'Gold',
    minPoints: 150,
    maxPoints: 200,
    color: '#ffd700',
    emoji: '🟨',
  },
  {
    tier: 'platinum',
    label: 'Platinum',
    minPoints: 200,
    maxPoints: 260,
    color: '#4fc3f7',
    emoji: '🩵',
  },
  {
    tier: 'diamond',
    label: 'Diamond',
    minPoints: 260,
    maxPoints: 320,
    color: '#b9f2ff',
    emoji: '💎',
  },
  {
    tier: 'emerald',
    label: 'Emerald',
    minPoints: 320,
    maxPoints: 380,
    color: '#50fa7b',
    emoji: '💚',
  },
  {
    tier: 'ruby',
    label: 'Ruby',
    minPoints: 380,
    maxPoints: 440,
    color: '#ff5555',
    emoji: '❤️‍🔥',
  },
  {
    tier: 'amethyst',
    label: 'Amethyst',
    minPoints: 440,
    maxPoints: 500,
    color: '#9333ea',   // deep neon violet
    emoji: '💜',
  },
  {
    tier: 'obsidian',
    label: 'Obsidian',
    minPoints: 500,
    maxPoints: Infinity,
    color: '#581c87',   // deep, shimmering dark with purple glow
    emoji: '🖤',
  },
]

// ─────────────────────────────────────────────
// CORE FUNCTIONS
// ─────────────────────────────────────────────

/**
 * Calculate Wilks points for a single lift.
 */
export function calculateWilks(
  gender: Gender,
  bodyWeightKg: number,
  liftedKg: number,
): number {
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
  for (let i = RANK_DEFINITIONS.length - 1; i >= 0; i--) {
    if (wilksPoints >= RANK_DEFINITIONS[i].minPoints) {
      return RANK_DEFINITIONS[i]
    }
  }
  return RANK_DEFINITIONS[0]
}

/**
 * Full rank computation for a barbell/dumbbell exercise.
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
// BODYWEIGHT / REP-BASED RANK
// ─────────────────────────────────────────────

const REP_RANK_THRESHOLDS: Array<{ tier: RankTier; minReps: number }> = [
  { tier: 'unranked',  minReps: 0  },
  { tier: 'bronze',    minReps: 1  },
  { tier: 'silver',    minReps: 5  },
  { tier: 'gold',      minReps: 10 },
  { tier: 'platinum',  minReps: 15 },
  { tier: 'diamond',   minReps: 20 },
  { tier: 'emerald',   minReps: 25 },
  { tier: 'ruby',      minReps: 30 },
  { tier: 'amethyst',  minReps: 35 },
  { tier: 'obsidian',  minReps: 40 },
]

export function getRepRank(reps: number): RankDefinition {
  let tierKey: RankTier = 'unranked'
  for (const threshold of REP_RANK_THRESHOLDS) {
    if (reps >= threshold.minReps) tierKey = threshold.tier
  }
  return RANK_DEFINITIONS.find((r) => r.tier === tierKey) ?? RANK_DEFINITIONS[0]
}
