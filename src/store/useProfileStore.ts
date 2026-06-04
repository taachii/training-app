import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserProfile, WeightEntry } from '@/types/profile'
import {
  levelFromTotalXp,
  totalXpForLevel,
  MAX_LEVEL,
  MAX_TOTAL_XP,
  computeNewStreak,
} from '@/lib/xpSystem'

// ─────────────────────────────────────────────
// DEFAULTS
// ─────────────────────────────────────────────

function makeDefaultProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    id: 'local-user',
    name: 'Atleta',
    gender: 'male',
    weight: 80,
    weightHistory: [],
    height: 175,
    totalXp: 0,
    level: 1,
    xp: 0,
    workoutStreak: 0,
    lastWorkoutDate: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }
}

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

export interface XPGainResult {
  /** Final XP awarded (after streak multiplier) */
  xpGained: number
  /** Whether the player crossed a level threshold */
  leveledUp: boolean
  /** New level after XP addition */
  newLevel: number
  /** Old level before XP addition */
  oldLevel: number
  /** Whether we hit the hard Level 50 cap */
  cappedAtMax: boolean
}

interface ProfileState {
  profile: UserProfile | null

  // ── Profile management ────────────────────────────────────────────────
  setProfile: (profile: UserProfile) => void
  updateProfile: (partial: Partial<Omit<UserProfile, 'id' | 'createdAt'>>) => void
  updateWeight: (weightKg: number) => void
  clearProfile: () => void

  // ── XP & Levelling ───────────────────────────────────────────────────
  /**
   * Add XP to the profile.
   * The caller passes the RAW amount (before streak multiplier).
   * If streakMultiplier is provided, it will be applied internally.
   * Returns an XPGainResult describing what happened.
   */
  addXP: (rawAmount: number, streakMultiplier?: number) => XPGainResult

  // ── Workout streak ───────────────────────────────────────────────────
  /**
   * Call this at the START of each workout session (not end).
   * Updates workoutStreak and lastWorkoutDate.
   * Returns { wasReset } so the UI can show a streak-lost message.
   */
  recordWorkout: () => { wasReset: boolean; newStreak: number }
}

// ─────────────────────────────────────────────
// STORE
// ─────────────────────────────────────────────

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      profile: null,

      // ── Profile management ────────────────────────────────────────────

      setProfile: (profile) =>
        set({ profile: { ...profile, updatedAt: new Date().toISOString() } }),

      updateProfile: (partial) =>
        set((s) => {
          const base = s.profile ?? makeDefaultProfile()
          return {
            profile: { ...base, ...partial, updatedAt: new Date().toISOString() },
          }
        }),

      updateWeight: (weightKg) =>
        set((s) => {
          if (!s.profile) return s
          const entry: WeightEntry = {
            date: new Date().toISOString().slice(0, 10),
            weight: weightKg,
          }
          return {
            profile: {
              ...s.profile,
              weight: weightKg,
              weightHistory: [...s.profile.weightHistory, entry],
              updatedAt: new Date().toISOString(),
            },
          }
        }),

      clearProfile: () => set({ profile: null }),

      // ── XP & Levelling ───────────────────────────────────────────────

      addXP: (rawAmount, streakMultiplier = 1) => {
        const profile = get().profile
        if (!profile) {
          return { xpGained: 0, leveledUp: false, newLevel: 1, oldLevel: 1, cappedAtMax: false }
        }

        const oldLevel = profile.level
        const finalXp  = Math.floor(rawAmount * streakMultiplier)

        // Clamp to hard cap
        const newTotalXp = Math.min(profile.totalXp + finalXp, MAX_TOTAL_XP)
        const cappedAtMax = newTotalXp === MAX_TOTAL_XP && profile.level === MAX_LEVEL

        const { level: newLevel, currentLevelXp } = levelFromTotalXp(newTotalXp)

        set((s) => {
          if (!s.profile) return s
          return {
            profile: {
              ...s.profile,
              totalXp: newTotalXp,
              level:   Math.min(newLevel, MAX_LEVEL),
              xp:      currentLevelXp,
              updatedAt: new Date().toISOString(),
            },
          }
        })

        return {
          xpGained:    finalXp,
          leveledUp:   newLevel > oldLevel,
          newLevel:    Math.min(newLevel, MAX_LEVEL),
          oldLevel,
          cappedAtMax,
        }
      },

      // ── Workout streak ───────────────────────────────────────────────

      recordWorkout: () => {
        const profile = get().profile ?? makeDefaultProfile()
        const today = new Date()
        const todayStr = today.toISOString().slice(0, 10)

        const { newStreak, wasReset } = computeNewStreak(
          profile.workoutStreak,
          profile.lastWorkoutDate,
          today,
        )

        set((s) => {
          const base = s.profile ?? makeDefaultProfile()
          return {
            profile: {
              ...base,
              workoutStreak:   newStreak,
              lastWorkoutDate: todayStr,
              updatedAt:       today.toISOString(),
            },
          }
        })

        return { wasReset, newStreak }
      },
    }),
    { name: 'training-app-profile' },
  ),
)

// ─────────────────────────────────────────────
// SELECTORS
// ─────────────────────────────────────────────

/** Total XP needed to reach the next level from the current one */
export function useXpForNextLevel(): number {
  return useProfileStore((s) => {
    const level = s.profile?.level ?? 1
    if (level >= MAX_LEVEL) return MAX_TOTAL_XP
    return totalXpForLevel(level + 1) - totalXpForLevel(level)
  })
}

/** Progress fraction 0–1 within the current level */
export function useLevelProgress(): number {
  return useProfileStore((s) => {
    if (!s.profile) return 0
    const { totalXp, level } = s.profile
    if (level >= MAX_LEVEL) return 1
    const levelStart = totalXpForLevel(level)
    const levelEnd   = totalXpForLevel(level + 1)
    return Math.min(1, (totalXp - levelStart) / (levelEnd - levelStart))
  })
}
