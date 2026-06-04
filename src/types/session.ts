import type { PlanExercise, LoggedSet } from './workout'

// ─────────────────────────────────────────────
// SESSION EXERCISE STATUS
// ─────────────────────────────────────────────

/**
 * Lifecycle of a single exercise within an active session:
 *
 *  pending → active → completed
 *                  ↘ skipped   (user tapped "Pomiń")
 *
 * All unstarted exercises become 'skipped' when the user hits
 * "Zakończ trening wcześniej" (early finish).
 */
export type ExerciseStatus = 'pending' | 'active' | 'completed' | 'skipped'

// ─────────────────────────────────────────────
// ACTIVE SESSION STATE
// ─────────────────────────────────────────────

export type SessionStatus =
  | 'idle'
  | 'active'               // user is performing a set
  | 'resting'              // timer counting down between sets
  | 'resting_exercise'     // timer between exercises
  | 'done'                 // session finished normally
  | 'done_early'           // session ended early by user

export interface SessionExercise extends PlanExercise {
  exerciseName: string

  status: ExerciseStatus

  /** Current set being performed (1-indexed) */
  currentSetIndex: number

  /**
   * Sets logged so far.
   * IMPORTANT: these are the ACTUAL values the user typed/adjusted inline —
   * they may differ from the plan targets. The progression algorithm
   * reads from here, not from plan targets.
   */
  completedSets: LoggedSet[]

  /**
   * User-marked success: "Udało się!" checkbox.
   * true  → full progression reward (+2.5 kg next time, +25 XP progression bonus)
   * false → partial / failed (counts toward deload counter)
   * undefined → not yet decided (exercise still in progress)
   */
  success?: boolean

  /** XP earned from this exercise (awarded dynamically when logged) */
  xpEarned: number

  /** Whether a new personal record was set during this exercise */
  isPersonalRecord: boolean
}

export interface ActiveSession {
  id: string
  workoutPlanId: string
  scheduledWorkoutId?: string
  status: SessionStatus
  exercises: SessionExercise[]
  /** Index into exercises array */
  currentExerciseIndex: number
  /** Seconds remaining on the rest timer */
  restSecondsRemaining: number
  /** ISO timestamp */
  startTime: string
  /** ISO timestamp — set when done */
  endTime?: string
  /** Total XP accumulated so far in this session */
  totalXpThisSession: number
}
