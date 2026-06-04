// ─────────────────────────────────────────────
// RANK SYSTEM — Wilks-based
// ─────────────────────────────────────────────

export type RankTier =
  | 'unranked'
  | 'bronze'
  | 'silver'
  | 'gold'
  | 'platinum'
  | 'diamond'
  | 'emerald'
  | 'ruby'
  | 'opal'
  | 'damascus'

export interface RankDefinition {
  tier: RankTier
  label: string
  /** Minimum Wilks points needed (inclusive) */
  minPoints: number
  /** Maximum Wilks points (exclusive); Infinity for Damascus */
  maxPoints: number
  /** Tailwind / CSS colour token key (maps to --color-rank-*) */
  colorKey: string
  /** Display emoji */
  emoji: string
}

/** Result returned by the rank calculator */
export interface RankResult {
  tier: RankTier
  wilksPoints: number
  oneRepMax: number
  definition: RankDefinition
  /** Points needed to reach next tier (0 if Damascus) */
  pointsToNextTier: number
  /** Progress within current tier 0–1 */
  tierProgress: number
}

/** Personal Record stored per exercise */
export interface PersonalRecord {
  exerciseId: string
  /** Epley 1RM in kg */
  oneRepMax: number
  /** Actual weight lifted in the PR set */
  weight: number
  /** Actual reps in the PR set */
  reps: number
  /** Wilks score at time of PR (requires user profile) */
  wilksPoints?: number
  rankAtPR?: RankTier
  /** ISO date */
  date: string
}
