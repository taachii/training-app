import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { WorkoutPlan, LoggedSet, WorkoutLog, LoggedExercise } from '@/types/workout'
import type { Exercise } from '@/types/exercise'
import type { ActiveSession, SessionExercise, SessionPhase } from '@/types/session'
import { calculateEpley1RM } from '@/features/ranks/wilksCalculator'
import { useProfileStore } from './useProfileStore'
import { computeExerciseXP, XP_REWARDS } from '@/lib/xpSystem'
import { useLogStore, calculateProgressionSuggestion } from '@/store/useLogStore'

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function genId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

function computeSetSuccess(
  weight: number,
  reps: number,
  plannedWeight: number,
  plannedReps: number,
): boolean {
  if (plannedWeight === 0) return reps >= plannedReps
  return weight >= plannedWeight && reps >= plannedReps
}

function buildSessionExercise(
  planEx: WorkoutPlan['exercises'][number],
  exercise: Exercise,
  suggestedWeight: number,
): SessionExercise {
  const firstSet = planEx.targetSets[0] || { type: 'reps', reps: 0, weight: 0 }
  
  const isBodyweight = exercise.category === 'bodyweight'
  const isPureBodyweight = isBodyweight && !['weighted_pull_up', 'weighted_chin_up', 'weighted_dip'].includes(exercise.id)
  
  const progressionType = planEx.progressionType ?? (isPureBodyweight ? 'reps' : 'weight')
  const progressionStep = planEx.progressionStep ?? (progressionType === 'reps' ? 1 : 2.5)
  
  return {
    ...planEx,
    progressionType,
    progressionStep,
    exerciseName:      exercise.name,
    exerciseCategory:  exercise.category,
    primaryMuscleGroup: exercise.primaryMuscleGroup,
    useWilksRank:      exercise.useWilksRank,
    exerciseNotes:     exercise.notes,
    status:            'pending',
    currentSetIndex:   0,
    inputWeight:       suggestedWeight > 0 ? suggestedWeight : (firstSet.weight ?? 0),
    inputReps:         firstSet.reps ?? 0,
    inputTimeSeconds:  firstSet.timeSeconds ?? 60,
    loggedSets:        [],
    xpEarned:          0,
    isPersonalRecord:  false,
  }
}

// ─────────────────────────────────────────────
// STORE INTERFACE
// ─────────────────────────────────────────────

export interface LogSetResult {
  isSetSuccess: boolean
  isLastSetOfExercise: boolean
  restSeconds: number
  xpAwarded: number
  isPersonalRecord: boolean
  nextPhase: SessionPhase
}

interface SessionState {
  session: ActiveSession | null

  startSession: (plan: WorkoutPlan, exercises: Exercise[]) => void
  logCurrentSet: (exerciseIndex: number, weight: number, reps: number, timeSeconds: number, previousPR?: number) => LogSetResult
  markSessionDoneEarly: () => void
  updateCurrentInput: (exerciseIndex: number, weight?: number, reps?: number, timeSeconds?: number) => void
  updateTotalSets: (exerciseIndex: number, delta: number) => void
  advanceToNextExercise: (fromIndex: number) => void
  setViewIndex: (index: number) => void
  finishSession: (isEarly: boolean) => WorkoutLog
  endRest: () => void
  clearSession: () => void
}

// ─────────────────────────────────────────────
// STORE
// ─────────────────────────────────────────────

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
  session: null,

  startSession: (plan, exercises) => {
    const exMap = new Map(exercises.map((e) => [e.id, e]))

    const sessionExercises: SessionExercise[] = plan.exercises
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((pe) => {
        const ex = exMap.get(pe.exerciseId)
        if (!ex) return null
        return buildSessionExercise(pe, ex, pe.targetSets[0]?.weight ?? 0)
      })
      .filter(Boolean) as SessionExercise[]

    if (sessionExercises.length === 0) return

    sessionExercises[0].status = 'active'

    const session: ActiveSession = {
      id:                   `session_${genId()}`,
      workoutPlanId:        plan.id,
      planName:             plan.name,
      phase:                'working',
      exercises:            sessionExercises,
      currentExerciseIndex: 0,
      viewIndex:            0,
      totalXpThisSession:   0,
      initialTotalXp:       useProfileStore.getState().profile?.totalXp ?? 0,
      startTime:            new Date().toISOString(),
    }

    set({ session })
  },

  logCurrentSet: (exerciseIndex, weight, reps, timeSeconds, previousPR) => {
    const { session } = get()
    if (!session) {
      return { isSetSuccess: false, isLastSetOfExercise: false, restSeconds: 90, xpAwarded: 0, isPersonalRecord: false, nextPhase: 'resting' }
    }

    const exercises = [...session.exercises]
    const idx = exerciseIndex
    const ex = { ...exercises[idx] }

    const target = ex.targetSets[ex.currentSetIndex] || ex.targetSets[ex.targetSets.length - 1]
    
    let isSetSuccess = false
    if (target.type === 'time') {
       isSetSuccess = timeSeconds >= (target.timeSeconds ?? 0)
    } else {
       isSetSuccess = computeSetSuccess(weight, reps, target.weight ?? 0, target.reps ?? 0)
    }

    const newSet: LoggedSet = {
      setNumber:   ex.currentSetIndex + 1,
      weight:      target.type === 'reps' ? weight : undefined,
      reps:        target.type === 'reps' ? reps : undefined,
      timeSeconds: target.type === 'time' ? timeSeconds : undefined,
      completed:   true,
      isSuccess:   isSetSuccess,
      completedAt: new Date().toISOString(),
    }

    const loggedSets = [...ex.loggedSets, newSet]
    const isLastSetOfExercise = ex.currentSetIndex >= ex.targetSets.length - 1

    let xpAwarded = 0
    let isPersonalRecord = false

    if (isLastSetOfExercise) {
      const allSuccess = loggedSets.every((s) => s.isSuccess)
      ex.success = allSuccess

      const epley1RM = target.type === 'reps' ? calculateEpley1RM(weight, reps) : 0
      const prevBest = previousPR ?? 0
      isPersonalRecord = epley1RM > prevBest && ex.useWilksRank

      const raw = computeExerciseXP({ isSuccessfulProgression: allSuccess, isPersonalRecord })
      xpAwarded = raw.total
      ex.xpEarned = xpAwarded
      ex.isPersonalRecord = isPersonalRecord
      ex.status = 'completed'
    }

    ex.loggedSets = loggedSets
    ex.currentSetIndex = isLastSetOfExercise ? ex.currentSetIndex : ex.currentSetIndex + 1
    
    // Set up inputs for the NEXT set if there is one
    if (!isLastSetOfExercise) {
       const nextTarget = ex.targetSets[ex.currentSetIndex]
       if (nextTarget) {
          ex.inputWeight = nextTarget.weight ?? 0
          ex.inputReps = nextTarget.reps ?? 0
          ex.inputTimeSeconds = nextTarget.timeSeconds ?? 0
       }
    }

    exercises[idx] = ex

    // SUPERSET LOGIC
    let nextPhase: SessionPhase = isLastSetOfExercise ? 'resting_last' : 'resting'
    let nextExerciseIdx = idx

    if (ex.supersetGroupId) {
       const targetSetCount = ex.loggedSets.length
       let foundNextInSuperset = false
       
       for (let i = idx + 1; i < exercises.length; i++) {
         const nextEx = exercises[i]
         if (nextEx.supersetGroupId === ex.supersetGroupId) {
            if (nextEx.loggedSets.length < targetSetCount && nextEx.status !== 'skipped' && nextEx.loggedSets.length < nextEx.targetSets.length) {
               foundNextInSuperset = true
               nextExerciseIdx = i
               nextPhase = 'working'
               break
            }
         } else {
            break
         }
       }
       
       if (!foundNextInSuperset) {
          // Time to rest, but point currentExerciseIndex to the first unfinished exercise in the superset group
          for (let i = 0; i < exercises.length; i++) {
             const groupEx = exercises[i]
             if (groupEx.supersetGroupId === ex.supersetGroupId) {
                if (groupEx.status !== 'completed' && groupEx.status !== 'skipped') {
                   nextExerciseIdx = i
                   break
                }
             }
          }
       }
    }

    if (nextPhase === 'working' && nextExerciseIdx !== idx) {
       exercises[nextExerciseIdx].status = 'active'
    }

    set({
      session: {
        ...session,
        exercises,
        phase: nextPhase,
        currentExerciseIndex: nextExerciseIdx,
        viewIndex: nextExerciseIdx,
        totalXpThisSession: session.totalXpThisSession + xpAwarded,
      },
    })

    return {
      isSetSuccess,
      isLastSetOfExercise,
      restSeconds: ex.restSeconds,
      xpAwarded,
      isPersonalRecord,
      nextPhase,
    }
  },

  markSessionDoneEarly: () => {
    const { session } = get()
    if (!session) return
    set({ session: { ...session, phase: 'done_early', endTime: new Date().toISOString() } })
  },

  updateCurrentInput: (exerciseIndex, weight, reps, timeSeconds) => {
    const { session } = get()
    if (!session) return

    const exercises = [...session.exercises]
    const ex = { ...exercises[exerciseIndex] }
    if (weight !== undefined) ex.inputWeight = weight
    if (reps !== undefined) ex.inputReps = reps
    if (timeSeconds !== undefined) ex.inputTimeSeconds = timeSeconds
    exercises[exerciseIndex] = ex

    set({ session: { ...session, exercises } })
  },

  updateTotalSets: (exerciseIndex, delta) => {
    const { session } = get()
    if (!session) return

    const exercises = [...session.exercises]
    const ex = { ...exercises[exerciseIndex] }
    
    const currentLen = ex.targetSets.length
    if (delta > 0) {
       const lastTarget = ex.targetSets[currentLen - 1]
       ex.targetSets = [...ex.targetSets, { ...lastTarget }]
    } else if (delta < 0 && currentLen > Math.max(1, ex.currentSetIndex + 1)) {
       ex.targetSets = ex.targetSets.slice(0, currentLen - 1)
    }
    
    exercises[exerciseIndex] = ex
    set({ session: { ...session, exercises } })
  },

  advanceToNextExercise: (fromIndex) => {
    const { session } = get()
    if (!session) return

    const exercises = [...session.exercises]
    
    let nextIdx = -1
    for (let i = 1; i <= exercises.length; i++) {
      const idxToCheck = (fromIndex + i) % exercises.length
      const status = exercises[idxToCheck].status
      if (status === 'pending' || status === 'active') {
        nextIdx = idxToCheck
        break
      }
    }

    if (nextIdx === -1) {
      set({
        session: {
          ...session,
          exercises,
          phase:   'done',
          endTime: new Date().toISOString(),
        },
      })
      return
    }

    exercises[nextIdx] = { ...exercises[nextIdx], status: 'active' }

    set({
      session: {
        ...session,
        exercises,
        currentExerciseIndex: nextIdx,
        viewIndex:            nextIdx,
        phase:                'working',
      },
    })
  },

  setViewIndex: (index) => {
    const { session } = get()
    if (!session) return
    const clamped = Math.max(0, Math.min(index, session.exercises.length - 1))
    set({ session: { ...session, viewIndex: clamped } })
  },

  finishSession: (isEarly) => {
    const { session } = get()
    if (!session) throw new Error('No active session')

    const endTime = new Date().toISOString()
    const startMs = new Date(session.startTime).getTime()
    const endMs   = new Date(endTime).getTime()
    const durationSeconds = Math.round((endMs - startMs) / 1000)

    const exercises = session.exercises.map((ex) =>
      ex.status === 'pending' ? { ...ex, status: 'skipped' as const, xpEarned: 0 } : ex,
    )

    const baseXP = exercises.reduce((sum, ex) => sum + (ex.xpEarned ?? 0), 0)
    const hasSkips = exercises.some((ex) => ex.status === 'skipped')
    const fullCompletion = !hasSkips

    let totalXpEarned = baseXP
    if (fullCompletion) totalXpEarned += XP_REWARDS.FULL_SESSION_BONUS

    const progressionStates = useLogStore.getState().progressionStates
    
    const loggedExercises: LoggedExercise[] = exercises.map((ex) => {
      const logged: LoggedExercise = {
        exerciseId:     ex.exerciseId,
        plannedSets:    ex.targetSets.length,
        actualSets:     ex.loggedSets,
        success:        ex.success ?? false,
        skipped:        ex.status === 'skipped',
        supersetGroupId: ex.supersetGroupId,
      }

      if (!logged.skipped) {
        const fails = progressionStates[ex.exerciseId]?.consecutiveFails ?? 0
        // Find the planned weight/reps from the first set
        const planWeight = ex.targetSets[0]?.weight ?? 0
        const planReps = ex.targetSets[0]?.reps ?? 0

        const sugg = calculateProgressionSuggestion(logged, fails, ex.progressionType, ex.progressionStep, planWeight, planReps)
        
        if (sugg.nextWeight !== planWeight) logged.suggestedNextWeight = sugg.nextWeight
        if (sugg.nextReps !== planReps) logged.suggestedNextReps = sugg.nextReps
      }

      return logged
    })

    const log: WorkoutLog = {
      id:              `log_${genId()}`,
      workoutPlanId:   session.workoutPlanId,
      planName:        session.planName,
      date:            new Date().toISOString().slice(0, 10),
      startTime:       session.startTime,
      endTime,
      durationSeconds,
      exercises:       loggedExercises,
      totalXpEarned,
      fullCompletion,
      endedEarly:      isEarly,
    }

    set({
      session: {
        ...session,
        exercises,
        phase:   isEarly ? 'done_early' : 'done',
        endTime,
      },
    })

    return log
  },

  endRest: () => {
    const { session } = get()
    if (!session) return
    set({ session: { ...session, phase: 'working' } })
  },

  clearSession: () => set({ session: null }),
    }),
    { name: 'session-storage' }
  )
)
