import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { WorkoutLog } from '@/types/workout'
import type { PersonalRecord } from '@/types/ranks'
import type { ProgressionState } from '@/types/progression'
import { PROGRESSION_DEFAULTS } from '@/types/progression'

interface LogState {
  logs: WorkoutLog[]
  personalRecords: Record<string, PersonalRecord>   // keyed by exerciseId
  progressionStates: Record<string, ProgressionState> // keyed by exerciseId

  addLog: (log: WorkoutLog) => void
  updateProgressionAfterSession: (exerciseId: string, success: boolean, currentWeight: number) => void
  updatePersonalRecord: (pr: PersonalRecord) => void
}

export const useLogStore = create<LogState>()(
  persist(
    (set, get) => ({
      logs: [],
      personalRecords: {},
      progressionStates: {},

      addLog: (log) =>
        set((s) => ({ logs: [log, ...s.logs] })),

      updateProgressionAfterSession: (exerciseId, success, currentWeight) =>
        set((s) => {
          const prev = s.progressionStates[exerciseId] ?? {
            exerciseId,
            currentWeight,
            consecutiveFails: 0,
            lastUpdated: new Date().toISOString(),
          }

          let nextWeight = prev.currentWeight
          let consecutiveFails = success ? 0 : prev.consecutiveFails + 1

          if (success) {
            nextWeight = prev.currentWeight + PROGRESSION_DEFAULTS.successIncrement
          } else if (consecutiveFails >= PROGRESSION_DEFAULTS.deloadTrigger) {
            nextWeight = Math.round(
              prev.currentWeight * (1 - PROGRESSION_DEFAULTS.deloadFraction) * 2,
            ) / 2 // round to nearest 0.5 kg
            consecutiveFails = 0
          }

          const updated: ProgressionState = {
            exerciseId,
            currentWeight: nextWeight,
            consecutiveFails,
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
    }),
    { name: 'training-app-logs' },
  ),
)

/** Convenience selector — returns suggested next weight for an exercise */
export function useSuggestedWeight(exerciseId: string, fallbackWeight: number): number {
  return useLogStore((s) => s.progressionStates[exerciseId]?.currentWeight ?? fallbackWeight)
}
