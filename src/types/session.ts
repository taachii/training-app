import type { PlanExercise, LoggedSet } from './workout'
import type { ExerciseCategory, MuscleGroup } from './exercise'

// ─────────────────────────────────────────────
// SESSION EXERCISE STATUS
// ─────────────────────────────────────────────

/**
 * Lifecycle of a single exercise within an active session:
 *
 *  pending → active → completed
 *                  ↘ skipped   (user tapped "Pomiń" OR session ended early)
 */
export type ExerciseStatus = 'pending' | 'active' | 'completed' | 'skipped'

// ─────────────────────────────────────────────
// SESSION PHASE
// ─────────────────────────────────────────────

export type SessionPhase =
  | 'working'           // user is entering set data
  | 'resting'           // timer counting down between sets
  | 'resting_last'      // timer after LAST set of exercise (shows next exercise preview)
  | 'done'              // session completed normally
  | 'done_early'        // session ended early by user

// ─────────────────────────────────────────────
// SESSION EXERCISE
// ─────────────────────────────────────────────

export interface SessionExercise extends PlanExercise {
  // ── Resolved exercise metadata ─────────────────────────────────────────
  exerciseName: string
  exerciseCategory: ExerciseCategory
  primaryMuscleGroup: MuscleGroup
  useWilksRank: boolean
  exerciseNotes?: string

  // ── Live session state ─────────────────────────────────────────────────
  status: ExerciseStatus

  /** 0-indexed: which set the user is currently performing */
  currentSetIndex: number

  /**
   * Inline-editable inputs for the current set being performed.
   */
  inputWeight: number
  inputReps: number
  inputTimeSeconds: number

  /**
   * All sets logged so far for this exercise.
   * IMPORTANT: These are the ACTUAL values — the progression algorithm reads
   * from here, not from the plan targets.
   */
  loggedSets: LoggedSet[]

  /**
   * Overall exercise success:
   * true  = ALL logged sets had isSuccess === true
   * false = at least one set failed (→ counts toward deload counter)
   * undefined = exercise not yet completed
   */
  success?: boolean

  /** XP earned from this exercise (awarded when exercise is completed) */
  xpEarned: number

  /** Whether a new personal 1RM record was set during this exercise */
  isPersonalRecord: boolean
}

// ─────────────────────────────────────────────
// ACTIVE SESSION
// ─────────────────────────────────────────────

export interface ActiveSession {
  id: string
  workoutPlanId: string
  planName: string
  scheduledWorkoutId?: string

  phase: SessionPhase

  exercises: SessionExercise[]

  /** true when this is a freestyle "custom" session (no plan, no progression) */
  isCustom?: boolean

  /** Index of the exercise currently being performed */
  currentExerciseIndex: number

  /**
   * The index the user is VIEWING in the carousel.
   * May differ from currentExerciseIndex when user swipes back to review
   * a previous exercise.
   */
  viewIndex: number

  /** Total XP earned so far in this session */
  totalXpThisSession: number

  /** Initial XP state before the session started */
  initialTotalXp: number

  /** ISO timestamp of when the session started */
  startTime: string

  /** ISO timestamp set when session ends */
  endTime?: string
}
