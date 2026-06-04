// ─────────────────────────────────────────────
// WEIGHT PROGRESSION & DELOAD RULES
// ─────────────────────────────────────────────

export interface ProgressionState {
  exerciseId: string

  /** Weight to use on the NEXT session (auto-updated by algorithm) */
  currentWeight: number

  /**
   * Rolling counter of consecutive session failures for this exercise.
   * Reset to 0 on success.
   * When it reaches 2 → deload triggers automatically.
   */
  consecutiveFails: number

  /** ISO date of last update */
  lastUpdated: string
}

// ─────────────────────────────────────────────
// PROGRESSION CONSTANTS (global defaults)
// ─────────────────────────────────────────────

export const PROGRESSION_DEFAULTS = {
  /** kg added on each successful session */
  successIncrement: 2.5,

  /** Fraction subtracted on deload (2 consecutive fails) */
  deloadFraction: 0.1, // -10%

  /** Number of consecutive fails required to trigger deload */
  deloadTrigger: 2,
} as const
