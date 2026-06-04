// ─────────────────────────────────────────────
// USER PROFILE
// ─────────────────────────────────────────────

export type Gender = 'male' | 'female'

export interface WeightEntry {
  /** ISO date string YYYY-MM-DD */
  date: string
  /** Body weight in kg */
  weight: number
}

export interface UserProfile {
  id: string
  name: string
  avatarUrl?: string

  /** Biological sex — required for Wilks coefficient selection */
  gender: Gender

  /** Current body weight in kg (always mirrors last entry in weightHistory) */
  weight: number

  /** Full history of body-weight measurements for charts & Wilks accuracy */
  weightHistory: WeightEntry[]

  /** Height in cm — used for BMI, future TDEE calculator */
  height: number

  // ── Gamification ─────────────────────────────────────────────────────

  /**
   * Cumulative total XP (always increasing, never decreases).
   * Level and currentLevelXp are derived from this via levelFromTotalXp().
   * Hard cap: MAX_TOTAL_XP (63 700 at Level 50).
   */
  totalXp: number

  /** Current account level (1–50). Derived from totalXp, stored for fast access. */
  level: number

  /** XP within the current level (= totalXp − totalXpForLevel(level)) */
  xp: number

  /**
   * Consecutive training weeks.
   * Increments when you train in a new calendar ISO week.
   * Resets to 1 if more than 7 days pass without any workout.
   * Affects XP streak multiplier (×1.0 → ×2.0).
   */
  workoutStreak: number

  /** ISO date string of the last recorded workout (YYYY-MM-DD) */
  lastWorkoutDate: string | null

  createdAt: string
  updatedAt: string
}
