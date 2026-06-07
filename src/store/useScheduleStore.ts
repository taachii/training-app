import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ScheduledWorkout {
  id: string
  date: string // YYYY-MM-DD
  planId: string
  isCompleted?: boolean
}

interface ScheduleState {
  scheduledWorkouts: ScheduledWorkout[]
  scheduleWorkout: (date: string, planId: string) => void
  removeScheduledWorkout: (id: string) => void
  removeSchedulesByPlanId: (planId: string) => void
  markAsCompleted: (id: string) => void
  getWorkoutsForDate: (date: string) => ScheduledWorkout[]
}

export const useScheduleStore = create<ScheduleState>()(
  persist(
    (set, get) => ({
      scheduledWorkouts: [],

      scheduleWorkout: (date, planId) => {
        const id = `sched_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
        set((state) => ({
          scheduledWorkouts: [...state.scheduledWorkouts, { id, date, planId }],
        }))
      },

      removeScheduledWorkout: (id) => {
        set((state) => ({
          scheduledWorkouts: state.scheduledWorkouts.filter((sw) => sw.id !== id),
        }))
      },

      removeSchedulesByPlanId: (planId) => {
        set((state) => ({
          scheduledWorkouts: state.scheduledWorkouts.filter((sw) => sw.planId !== planId),
        }))
      },

      markAsCompleted: (id) => {
        set((state) => ({
          scheduledWorkouts: state.scheduledWorkouts.map((sw) => 
            sw.id === id ? { ...sw, isCompleted: true } : sw
          ),
        }))
      },

      getWorkoutsForDate: (date) => {
        return get().scheduledWorkouts.filter((sw) => sw.date === date)
      },
    }),
    {
      name: 'schedule-storage',
    }
  )
)
