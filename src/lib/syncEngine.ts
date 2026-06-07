import { useEffect } from 'react'
import { supabase } from './supabase'
import { useProfileStore } from '@/store/useProfileStore'
import { useWorkoutStore } from '@/store/useWorkoutStore'
import { useLogStore } from '@/store/useLogStore'
import { totalXpForLevel } from '@/lib/xpSystem'
import type { WorkoutPlan, WorkoutLog } from '@/types/workout'
import type { PersonalRecord } from '@/types/ranks'
import type { ProgressionState } from '@/types/progression'

let isPulling = false

export function useSyncEngine() {
  useEffect(() => {
    // 1. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await pullData(session.user.id)
      } else if (event === 'SIGNED_OUT') {
        // Clear local state when user signs out
        useProfileStore.setState({ profile: null })
        useWorkoutStore.setState({ plans: [], exercises: useWorkoutStore.getState().exercises.filter(e => !e.isCustom) })
        useLogStore.setState({ logs: [], personalRecords: {}, progressionStates: {} })
      }
    })

    // 2. Setup Zustand subscribers for push (debounced or on-change)
    const unsubProfile = useProfileStore.subscribe((state) => {
      if (isPulling || !state.profile) return
      // Only push if there's a difference. We can do a basic check or just push.
      pushProfile(state.profile)
    })

    const unsubWorkout = useWorkoutStore.subscribe((state, prevState) => {
      if (isPulling) return
      if (state.plans !== prevState.plans) {
        pushWorkoutPlans(state.plans)
      }
    })

    const unsubLogs = useLogStore.subscribe((state, prevState) => {
      if (isPulling) return
      if (state.logs !== prevState.logs) {
        pushWorkoutLogs(state.logs)
      }
      if (state.personalRecords !== prevState.personalRecords) {
        pushPersonalRecords(state.personalRecords)
      }
      if (state.progressionStates !== prevState.progressionStates) {
        pushProgressionStates(state.progressionStates)
      }
    })

    // Initial pull if already logged in on mount
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        pullData(data.user.id)
      }
    })

    return () => {
      subscription.unsubscribe()
      unsubProfile()
      unsubWorkout()
      unsubLogs()
    }
  }, [])
}

// ─────────────────────────────────────────────────────────────────
// PULL
// ─────────────────────────────────────────────────────────────────

async function pullData(userId: string) {
  isPulling = true
  try {
    const [
      { data: profileData },
      { data: plansData },
      { data: logsData },
      { data: prsData },
      { data: progData }
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('workout_plans').select('*').eq('user_id', userId),
      supabase.from('workout_logs').select('*').eq('user_id', userId),
      supabase.from('personal_records').select('*').eq('user_id', userId),
      supabase.from('progression_states').select('*').eq('user_id', userId)
    ])

    if (profileData) {
      const lvl = profileData.level || 1
      const currentXp = profileData.xp || 0
      useProfileStore.getState().updateProfile({
        name: profileData.nickname,
        xp: currentXp,
        level: lvl,
        totalXp: totalXpForLevel(lvl) + currentXp,
      })
    }

    if (plansData) {
      const plans = plansData.map(p => p.data_json as WorkoutPlan)
      useWorkoutStore.setState({ plans })
    }

    if (logsData) {
      const logs = logsData.map(l => l.data_json as WorkoutLog)
      useLogStore.setState({ logs })
    }

    if (prsData) {
      const prs: Record<string, PersonalRecord> = {}
      prsData.forEach(pr => {
        prs[pr.exercise_id] = { exerciseId: pr.exercise_id, weight: pr.weight, reps: pr.reps, oneRepMax: pr.one_rep_max, date: pr.achieved_at }
      })
      useLogStore.setState({ personalRecords: prs })
    }

    if (progData) {
      const progs: Record<string, ProgressionState> = {}
      progData.forEach(p => {
        progs[p.exercise_id] = { exerciseId: p.exercise_id, currentWeight: p.current_weight, consecutiveFails: p.consecutive_fails, lastUpdated: p.last_updated }
      })
      useLogStore.setState({ progressionStates: progs })
    }

  } catch (err) {
    console.error('Failed to pull data from Supabase', err)
  } finally {
    isPulling = false
  }
}

// ─────────────────────────────────────────────────────────────────
// PUSH
// ─────────────────────────────────────────────────────────────────

async function pushProfile(profile: any) {
  const { data: authData } = await supabase.auth.getUser()
  if (!authData.user) return

  await supabase.from('profiles').upsert({
    id: authData.user.id,
    nickname: profile.name,
    xp: profile.xp,
    level: profile.level,
    gender: profile.gender,
    weight: profile.weight,
    height: profile.height,
    updated_at: new Date().toISOString()
  })
}

async function pushWorkoutPlans(plans: WorkoutPlan[]) {
  const { data: authData } = await supabase.auth.getUser()
  if (!authData.user) return

  const payloads = plans.map(p => ({
    id: p.id,
    user_id: authData.user.id,
    name: p.name,
    data_json: p,
    updated_at: p.updatedAt || new Date().toISOString()
  }))

  // Upsert all plans
  if (payloads.length > 0) {
    await supabase.from('workout_plans').upsert(payloads)
  }
}

async function pushWorkoutLogs(logs: WorkoutLog[]) {
  const { data: authData } = await supabase.auth.getUser()
  if (!authData.user) return

  const payloads = logs.map(l => ({
    id: l.id,
    user_id: authData.user.id,
    date: l.date,
    duration_seconds: l.durationSeconds,
    data_json: l
  }))

  if (payloads.length > 0) {
    await supabase.from('workout_logs').upsert(payloads)
  }
}

async function pushPersonalRecords(prs: Record<string, PersonalRecord>) {
  const { data: authData } = await supabase.auth.getUser()
  if (!authData.user) return

  const payloads = Object.entries(prs).map(([exerciseId, data]) => ({
    exercise_id: exerciseId,
    user_id: authData.user.id,
    weight: data.weight,
    reps: data.reps,
    one_rep_max: data.oneRepMax,
    achieved_at: data.date
  }))

  if (payloads.length > 0) {
    await supabase.from('personal_records').upsert(payloads)
  }
}

async function pushProgressionStates(states: Record<string, ProgressionState>) {
  const { data: authData } = await supabase.auth.getUser()
  if (!authData.user) return

  const payloads = Object.entries(states).map(([exerciseId, data]) => ({
    exercise_id: exerciseId,
    user_id: authData.user.id,
    current_weight: data.currentWeight,
    consecutive_fails: data.consecutiveFails,
    last_updated: data.lastUpdated || new Date().toISOString()
  }))

  if (payloads.length > 0) {
    await supabase.from('progression_states').upsert(payloads)
  }
}
