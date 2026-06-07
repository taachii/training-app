// ─────────────────────────────────────────────
// MUSCLE GROUPS
// ─────────────────────────────────────────────

export type MuscleGroup =
  | 'chest'
  | 'lats'
  | 'upper_back'      // rhomboids, mid-traps
  | 'lower_back'
  | 'traps'
  | 'shoulders'       // front/side/rear deltoids (general)
  | 'front_delts'
  | 'side_delts'
  | 'rear_delts'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'core'            // rectus abdominis, obliques
  | 'quadriceps'
  | 'hamstrings'
  | 'glutes'
  | 'calves'
  | 'hip_flexors'
  | 'adductors'
  | 'abductors'
  | 'neck'

// ─────────────────────────────────────────────
// EXERCISE
// ─────────────────────────────────────────────

/**
 * Category governs how the rank / progress system treats the exercise:
 *  - 'barbell'  : tracked via Wilks-based 1RM
 *  - 'dumbbell' : tracked via Wilks-based 1RM (per-hand weight stored)
 *  - 'bodyweight': ranked by max clean reps (no 1RM needed)
 *  - 'machine'  : tracked via 1RM (no Wilks normalisation — raw kg)
 *  - 'cable'    : tracked via 1RM (raw kg)
 *  - 'cardio'   : no rank, tracked by duration/distance
 */
export type ExerciseCategory =
  | 'barbell'
  | 'dumbbell'
  | 'bodyweight'
  | 'machine'
  | 'cable'
  | 'cardio'

export interface Exercise {
  id: string
  name: string

  /** Whether this exercise is from the built-in library or user-created */
  isCustom: boolean

  category: ExerciseCategory

  /** Primary muscle group — used for volume charts */
  primaryMuscleGroup: MuscleGroup

  /** Secondary muscles recruited */
  secondaryMuscleGroups: MuscleGroup[]

  /** 'reps' (default) for strength, 'time' for isometric or cardio */
  type?: 'reps' | 'time'

  /**
   * true  → rank is computed via Wilks formula (barbell big lifts)
   * false → rank is computed via raw reps (bodyweight) or disabled
   */
  useWilksRank: boolean

  /** Default plan values — user can override per plan */
  defaultSets: number
  defaultReps: number
  /** kg; undefined for bodyweight exercises */
  defaultWeight?: number
  /** Rest between sets in seconds */
  defaultRestSeconds: number

  /** Optional coaching note shown during session */
  notes?: string
}
