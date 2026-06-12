// ─────────────────────────────────────────────
// WORKOUT PLAN (Blueprint)
// ─────────────────────────────────────────────

export type ProgressionType = 'weight' | 'reps' | 'time' | 'none'

export interface TargetSet {
  reps?: number
  weight?: number
  timeSeconds?: number
  type: 'reps' | 'time'
}

export interface PlanExercise {
  /** References Exercise.id */
  exerciseId: string
  order: number
  targetSets: TargetSet[]
  /** If true, the user has configured individual sets or time-based config */
  isAdvanced?: boolean
  /** Rest time between sets (seconds), configured in blueprint editor */
  restSeconds: number
  
  /** Progressive overload strategy for this exercise */
  progressionType?: ProgressionType
  /** Step to increase on success (e.g. 2.5 for weight, 1 for reps) */
  progressionStep?: number
  
  /** ID used to group exercises into supersets */
  supersetGroupId?: string
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
  reps?: number
  /** Actual weight used (kg) */
  weight?: number
  timeSeconds?: number
  /** Whether this set was performed */
  completed: boolean
  /**
   * true  = weight >= plannedWeight AND reps >= plannedReps
   * false = user entered less weight or fewer reps than planned
   * Used for circle color: green vs red
   */
  isSuccess: boolean
  /** ISO timestamp */
  completedAt?: string
}

export interface LoggedExercise {
  exerciseId: string
  plannedSets: number
  actualSets: LoggedSet[]
  /**
   * true  = ALL sets had isSuccess === true (→ +2.5 kg next time)
   * false = at least one set failed / exercise was skipped
   *         (counts as 1 fail toward deload trigger)
   */
  success: boolean
  /** Whether the exercise was skipped entirely */
  skipped: boolean

  // ── Progression Suggestions ──
  suggestedNextWeight?: number
  suggestedNextReps?: number
  
  /** ID used to group exercises into supersets */
  supersetGroupId?: string
}

export interface WorkoutLog {
  id: string
  scheduledWorkoutId?: string
  workoutPlanId: string
  planName: string
  /** ISO date string YYYY-MM-DD */
  date: string
  /** ISO timestamp */
  startTime: string
  /** ISO timestamp; set when session finishes */
  endTime: string
  /** Total workout duration in seconds (endTime − startTime) */
  durationSeconds: number
  exercises: LoggedExercise[]
  /** Total XP earned during this session */
  totalXpEarned: number
  /** true = no exercises were skipped (qualifies for +50 XP full-session bonus) */
  fullCompletion: boolean
  /** Whether session ended early (user pressed "Zakończ wcześniej") */
  endedEarly: boolean
  notes?: string
}
