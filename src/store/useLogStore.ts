import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { WorkoutLog, LoggedExercise } from '@/types/workout'
import type { PersonalRecord } from '@/types/ranks'
import type { ProgressionState } from '@/types/progression'
import { PROGRESSION_DEFAULTS } from '@/types/progression'

// ─────────────────────────────────────────────
// HELPERS — derive effective weight from actual log
// ─────────────────────────────────────────────

/**
 * Derive the "reference weight" from a logged exercise.
 *
 * Strategy: use the weight from the heaviest COMPLETED set.
 * This respects the user's inline edits during the session —
 * the algorithm always works from what was ACTUALLY done,
 * never from blueprint assumptions.
 */
function deriveEffectiveWeight(logged: LoggedExercise): number {
  const completed = logged.actualSets.filter((s) => s.completed && (s.weight ?? 0) > 0)
  if (completed.length === 0) {
     // fallback to first actual set's weight if any, else 0
     return logged.actualSets[0]?.weight ?? 0
  }
  return Math.max(...completed.map((s) => s.weight ?? 0))
}

/**
 * Round a weight to the nearest 0.25 kg (quarter-plate precision).
 */
function roundWeight(kg: number): number {
  return Math.round(kg * 4) / 4
}

/**
 * Calculates the new suggested weight/reps and updated fail count.
 */
export function calculateProgressionSuggestion(
  logged: LoggedExercise,
  prevFails: number,
  type: 'weight' | 'reps' | 'time' | 'none' = 'weight',
  step?: number,
  plannedWeight: number = 0,
  plannedReps: number = 0
): { nextWeight: number; nextReps: number; consecutiveFails: number } {
  let effectiveWeight = deriveEffectiveWeight(logged)
  if (effectiveWeight === 0 && plannedWeight > 0) {
    effectiveWeight = plannedWeight
  }

  // derive reps from max completed reps
  const completedReps = logged.actualSets.filter((s) => s.completed).map(s => s.reps ?? 0)
  let effectiveReps = completedReps.length > 0 ? Math.max(...completedReps) : 0
  if (effectiveReps === 0 && plannedReps > 0) {
    effectiveReps = plannedReps
  }

  let nextWeight = type === 'weight' ? effectiveWeight : plannedWeight
  let nextReps = type === 'reps' ? effectiveReps : plannedReps
  let consecutiveFails = prevFails

  if (type === 'none' || type === 'time') {
    return { nextWeight, nextReps, consecutiveFails }
  }

  const actualStep = step ?? (type === 'reps' ? 1 : 2.5)

  if (logged.success) {
    // ✅ SUCCESS
    if (type === 'weight') nextWeight = roundWeight(effectiveWeight + actualStep)
    if (type === 'reps') nextReps = effectiveReps + actualStep
    consecutiveFails = 0
  } else {
    consecutiveFails += 1

    if (consecutiveFails >= PROGRESSION_DEFAULTS.deloadTrigger) {
      // ❌❌ DELOAD
      if (type === 'weight') {
        nextWeight = roundWeight(Math.max(0, effectiveWeight - actualStep))
      } else if (type === 'reps') {
        nextReps = Math.max(1, effectiveReps - 1)
      }
      consecutiveFails = 0
    }
  }

  return { nextWeight, nextReps, consecutiveFails }
}

// ─────────────────────────────────────────────
// STORE
// ─────────────────────────────────────────────

interface LogState {
  logs: WorkoutLog[]
  personalRecords: Record<string, PersonalRecord>     // keyed by exerciseId
  progressionStates: Record<string, ProgressionState> // keyed by exerciseId

  addLog: (log: WorkoutLog) => void

  /**
   * Update progression state after a session exercise is completed.
   *
   * KEY ARCHITECTURE DECISION:
   * - Progression is always calculated from ACTUAL logged data (loggedExercise)
   * - The user's inline edits (weight, reps, added/removed sets) are the ground truth
   * - The blueprint/plan values are only used as initial suggestions
   * - success flag is set explicitly by the user (checkbox: "Udało się!") in the session
   *
   * Rules:
   *   success = true  → effectiveWeight + 2.5 kg next time (reset consecutiveFails to 0)
   *   success = false → no weight change; consecutiveFails++
   *   consecutiveFails >= 2 → deload -10% (round to 0.25 kg), reset consecutiveFails to 0
   */
  updateProgressionAfterSession: (loggedExercise: LoggedExercise) => void
  updatePersonalRecord: (pr: PersonalRecord) => void
  removeLog: (id: string) => void
  clearLogs: () => void
}

export const useLogStore = create<LogState>()(
  persist(
    (set) => ({
      logs: [],
      personalRecords: {},
      progressionStates: {},

      addLog: (log) =>
        set((s) => ({ logs: [log, ...s.logs] })),

      removeLog: (id) =>
        set((s) => ({ logs: s.logs.filter(log => log.id !== id) })),

      updateProgressionAfterSession: (logged) =>
        set((s) => {
          const exerciseId = logged.exerciseId
          const prev = s.progressionStates[exerciseId] ?? {
            exerciseId,
            currentWeight: logged.suggestedNextWeight ?? deriveEffectiveWeight(logged),
            consecutiveFails: 0,
            lastUpdated: new Date().toISOString(),
          }

          let consecutiveFails = prev.consecutiveFails
          if (logged.success) {
            consecutiveFails = 0
          } else {
            consecutiveFails += 1
            if (consecutiveFails >= PROGRESSION_DEFAULTS.deloadTrigger) {
              consecutiveFails = 0
            }
          }

          const updated: ProgressionState = {
            ...prev,
            consecutiveFails,
            currentWeight: logged.suggestedNextWeight ?? prev.currentWeight,
            lastUpdated: new Date().toISOString(),
          }

          return {
            progressionStates: { ...s.progressionStates, [exerciseId]: updated },
          }
        }),

      updatePersonalRecord: (pr) =>
        set((s) => {
          const existing = s.personalRecords[pr.exerciseId]
          if (existing && existing.oneRepMax >= pr.oneRepMax) return s
          return {
            personalRecords: { ...s.personalRecords, [pr.exerciseId]: pr },
          }
        }),

      clearLogs: () =>
        set({ logs: [], personalRecords: {}, progressionStates: {} }),
    }),
    { name: 'training-app-logs' },
  ),
)

// ─────────────────────────────────────────────
// SELECTORS
// ─────────────────────────────────────────────

/**
 * Returns the suggested starting weight for the next session.
 * This is the algorithm's SUGGESTION — the user is free to override it inline.
 */
export function useSuggestedWeight(exerciseId: string, fallbackWeight: number): number {
  return useLogStore(
    (s) => s.progressionStates[exerciseId]?.currentWeight ?? fallbackWeight,
  )
}

/**
 * Returns the number of consecutive failures for an exercise.
 * Used to show deload warning in UI.
 */
export function useConsecutiveFails(exerciseId: string): number {
  return useLogStore(
    (s) => s.progressionStates[exerciseId]?.consecutiveFails ?? 0,
  )
}
