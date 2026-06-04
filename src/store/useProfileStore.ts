import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserProfile, WeightEntry } from '@/types/profile'

interface ProfileState {
  profile: UserProfile | null
  setProfile: (profile: UserProfile) => void
  updateWeight: (weightKg: number) => void
  updateProfile: (partial: Partial<Omit<UserProfile, 'id' | 'createdAt'>>) => void
  clearProfile: () => void
}

const DEFAULT_PROFILE: UserProfile = {
  id: 'local-user',
  name: 'Atleta',
  gender: 'male',
  weight: 80,
  weightHistory: [],
  height: 175,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      profile: null,

      setProfile: (profile) =>
        set({ profile: { ...profile, updatedAt: new Date().toISOString() } }),

      updateWeight: (weightKg) =>
        set((state) => {
          if (!state.profile) return state
          const entry: WeightEntry = {
            date: new Date().toISOString().slice(0, 10),
            weight: weightKg,
          }
          return {
            profile: {
              ...state.profile,
              weight: weightKg,
              weightHistory: [...state.profile.weightHistory, entry],
              updatedAt: new Date().toISOString(),
            },
          }
        }),

      updateProfile: (partial) =>
        set((state) => {
          const base = state.profile ?? DEFAULT_PROFILE
          return {
            profile: { ...base, ...partial, updatedAt: new Date().toISOString() },
          }
        }),

      clearProfile: () => set({ profile: null }),
    }),
    { name: 'training-app-profile' },
  ),
)
