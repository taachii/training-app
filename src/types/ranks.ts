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
  | 'amethyst'  // deep neon violet — second highest
  | 'obsidian'  // darkest elite — highest attainable

export interface RankDefinition {
  tier: RankTier
  label: string
  /** Minimum Wilks points needed (inclusive) */
  minPoints: number
  /** Maximum Wilks points (exclusive); Infinity for Obsidian */
  maxPoints: number
  /** CSS color value for badges, glows, and charts */
  color: string
  /** Display emoji */
  emoji: string
}

/** Result returned by the rank calculator */
export interface RankResult {
  tier: RankTier
  wilksPoints: number
  oneRepMax: number
  definition: RankDefinition
  /** Points needed to reach next tier (0 if Obsidian) */
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
