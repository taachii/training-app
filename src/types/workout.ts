// ─────────────────────────────────────────────
// WORKOUT PLAN (Blueprint)
// ─────────────────────────────────────────────

export interface PlanExercise {
  /** References Exercise.id */
  exerciseId: string
  order: number
  sets: number
  reps: number
  /** kg; undefined/0 for bodyweight */
  weight: number
  /** Rest after all sets (seconds) */
  restSeconds: number
  /** Rest between sets (seconds) — falls back to restSeconds if not set */
  restBetweenSetsSeconds?: number
}

export interface WorkoutPlan {
  id: string
  name: string
  description?: string
  /** emoji or short tag for quick recognition */
  icon?: string
  exercises: PlanExercise[]
  createdAt: string
  updatedAt: string
}

// ─────────────────────────────────────────────
// SCHEDULED WORKOUT (Calendar entry)
// ─────────────────────────────────────────────

export type ScheduledWorkoutStatus = 'planned' | 'completed' | 'skipped'

export interface ScheduledWorkout {
  id: string
  /** ISO date string YYYY-MM-DD */
  date: string
  workoutPlanId: string
  status: ScheduledWorkoutStatus
  /** Populated after session is completed */
  workoutLogId?: string
}

// ─────────────────────────────────────────────
// WORKOUT LOG (Completed session record)
// ─────────────────────────────────────────────

export interface LoggedSet {
  setNumber: number
  reps: number
  /** Actual weight used (kg) */
  weight: number
  /** Whether this set was completed as planned */
  completed: boolean
  /** ISO timestamp */
  completedAt?: string
}

export interface LoggedExercise {
  exerciseId: string
  plannedSets: number
  plannedReps: number
  plannedWeight: number
  actualSets: LoggedSet[]
  /**
   * true  = all sets completed at planned weight/reps (success → +2.5 kg next time)
   * false = partial / failed (counts as 1 fail toward deload trigger)
   */
  success: boolean
}

export interface WorkoutLog {
  id: string
  scheduledWorkoutId?: string
  workoutPlanId: string
  /** ISO date string YYYY-MM-DD */
  date: string
  /** ISO timestamp */
  startTime: string
  /** ISO timestamp; set when session finishes */
  endTime?: string
  /** Duration in seconds (derived from start/end) */
  durationSeconds?: number
  exercises: LoggedExercise[]
  notes?: string
}
