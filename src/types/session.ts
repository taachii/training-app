import type { PlanExercise, LoggedSet } from './workout'

// ─────────────────────────────────────────────
// ACTIVE SESSION STATE
// ─────────────────────────────────────────────

export type SessionStatus =
  | 'idle'
  | 'active'          // user is performing a set
  | 'resting'         // timer counting down between sets
  | 'resting_exercise'// timer between exercises
  | 'done'            // session finished

export interface SessionExercise extends PlanExercise {
  exerciseName: string
  /** Current set being performed (1-indexed) */
  currentSetIndex: number
  /** Sets logged so far */
  completedSets: LoggedSet[]
  /** Resolved after all sets: true = success, false = fail */
  success?: boolean
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
}
