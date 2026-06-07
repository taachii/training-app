import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { WorkoutPlan } from '@/types/workout'
import type { Exercise } from '@/types/exercise'
import { PREDEFINED_EXERCISES } from '@/features/workouts/exerciseLibrary'
import { useScheduleStore } from './useScheduleStore'

interface WorkoutState {
  plans: WorkoutPlan[]
  /** Merged list: predefined library + user-created custom exercises */
  exercises: Exercise[]

  // Plan actions
  addPlan: (plan: WorkoutPlan) => void
  updatePlan: (id: string, partial: Partial<WorkoutPlan>) => void
  deletePlan: (id: string) => void

  // Custom exercise actions
  addCustomExercise: (exercise: Exercise) => void
  deleteCustomExercise: (id: string) => void
}

export const useWorkoutStore = create<WorkoutState>()(
  persist(
    (set) => ({
      plans: [],
      exercises: PREDEFINED_EXERCISES,

      addPlan: (plan) =>
        set((s) => ({ plans: [...s.plans, plan] })),

      updatePlan: (id, partial) =>
        set((s) => ({
          plans: s.plans.map((p) =>
            p.id === id ? { ...p, ...partial, updatedAt: new Date().toISOString() } : p,
          ),
        })),

      deletePlan: (id) => {
        set((s) => ({ plans: s.plans.filter((p) => p.id !== id) }))
        useScheduleStore.getState().removeSchedulesByPlanId(id)
      },

      addCustomExercise: (exercise) =>
        set((s) => ({ exercises: [...s.exercises, exercise] })),

      deleteCustomExercise: (id) =>
        set((s) => ({
          exercises: s.exercises.filter((e) => e.id !== id || !e.isCustom),
        })),
    }),
    {
      name: 'training-app-workouts',
      partialize: (s) => ({
        plans: s.plans,
        // Only persist user-created exercises; predefined ones are always in code
        exercises: s.exercises.filter((e) => e.isCustom),
      }),
      merge: (persisted: unknown, current) => {
        const p = persisted as Partial<WorkoutState>
        return {
          ...current,
          plans: p.plans ?? [],
          exercises: [
            ...PREDEFINED_EXERCISES,
            ...(p.exercises ?? []).filter((e: Exercise) => e.isCustom),
          ],
        }
      },
    },
  ),
)
