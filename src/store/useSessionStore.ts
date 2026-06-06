/**
 * useSessionStore — Active workout session state machine
 *
 * Architecture:
 *  - This store manages WHAT is happening (exercise state, logged sets, XP)
 *  - The SessionPage component manages TIMERS (countdown, elapsed)
 *  - XP is awarded immediately when an exercise is completed
 *  - Progression state is updated when the full session is finalized
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { WorkoutPlan, LoggedSet, WorkoutLog, LoggedExercise } from '@/types/workout'
import type { Exercise } from '@/types/exercise'
import type { ActiveSession, SessionExercise, SessionPhase } from '@/types/session'
import { calculateEpley1RM } from '@/features/ranks/wilksCalculator'
import { computeExerciseXP, XP_REWARDS } from '@/lib/xpSystem'
import { useLogStore, calculateProgressionSuggestion } from '@/store/useLogStore'

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function genId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

/**
 * Determine whether a single set meets plan targets.
 * Success = weight >= planned AND reps >= planned.
 */
function computeSetSuccess(
  weight: number,
  reps: number,
  plannedWeight: number,
  plannedReps: number,
): boolean {
  // Bodyweight exercises (plannedWeight = 0) — only check reps
  if (plannedWeight === 0) return reps >= plannedReps
  return weight >= plannedWeight && reps >= plannedReps
}

/**
 * Build a SessionExercise from plan + exercise metadata.
 * Suggested weight comes from progression state if available.
 */
function buildSessionExercise(
  planEx: WorkoutPlan['exercises'][number],
  exercise: Exercise,
  suggestedWeight: number,
): SessionExercise {
  return {
    ...planEx,
    exerciseName:      exercise.name,
    exerciseCategory:  exercise.category,
    primaryMuscleGroup: exercise.primaryMuscleGroup,
    useWilksRank:      exercise.useWilksRank,
    exerciseNotes:     exercise.notes,
    status:            'pending',
    currentSetIndex:   0,
    inputWeight:       suggestedWeight > 0 ? suggestedWeight : (planEx.weight ?? 0),
    inputReps:         planEx.reps,
    loggedSets:        [],
    xpEarned:          0,
    isPersonalRecord:  false,
  }
}

// ─────────────────────────────────────────────
// LOG-SET RESULT
// ─────────────────────────────────────────────

export interface LogSetResult {
  /** Whether the set met plan targets */
  isSetSuccess: boolean
  /** True when this was the LAST set of the exercise */
  isLastSetOfExercise: boolean
  /** Rest duration to apply (from plan) */
  restSeconds: number
  /** XP awarded (only non-zero when exercise is completed = last set) */
  xpAwarded: number
  /** Whether a PR was set (only meaningful when isLastSetOfExercise) */
  isPersonalRecord: boolean
}

// ─────────────────────────────────────────────
// STORE INTERFACE
// ─────────────────────────────────────────────

interface SessionState {
  session: ActiveSession | null

  /**
   * Start a new session from a plan.
   * progressionWeights maps exerciseId → suggested weight from progression store.
   */
  startSession: (
    plan: WorkoutPlan,
    exercises: Exercise[],
  ) => void

  /**
   * Log the current set with the actual weight and reps.
   * Returns metadata needed by the component to start the rest timer.
   */
  logCurrentSet: (exerciseIndex: number, weight: number, reps: number, previousPR?: number) => LogSetResult

  /**
   * Mark the session as done early to show the completion screen.
   */
  markSessionDoneEarly: () => void

  /**
   * Update the inline-editable inputs for a specific exercise (before logging).
   */
  updateCurrentInput: (exerciseIndex: number, weight?: number, reps?: number) => void

  /**
   * Update the total number of sets for a specific exercise.
   */
  updateTotalSets: (exerciseIndex: number, delta: number) => void

  /**
   * Called by the component when the rest timer expires OR user taps "Pomiń przerwę".
   * Advances currentExerciseIndex to the next exercise.
   */
  advanceToNextExercise: (fromIndex: number) => void

  /**
   * Adjust the carousel view index (swiping back to peek at previous exercises).
   */
  setViewIndex: (index: number) => void

  /**
   * Finish the session. If isEarly=true, all remaining 'pending' exercises
   * are marked 'skipped'. Returns the finalized WorkoutLog.
   */
  finishSession: (
    isEarly: boolean,
  ) => WorkoutLog

  /**
   * Called when rest timer expires (non-last-set) or user skips rest for a non-last set.
   * Transitions session phase back to 'working' so next-set inputs re-appear.
   */
  endRest: () => void

  /** Clear session after it's done */
  clearSession: () => void
}

// ─────────────────────────────────────────────
// STORE
// ─────────────────────────────────────────────

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
  session: null,

  // ── startSession ───────────────────────────────────────────────────────

  startSession: (plan, exercises) => {
    const exMap = new Map(exercises.map((e) => [e.id, e]))

    const sessionExercises: SessionExercise[] = plan.exercises
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((pe) => {
        const ex = exMap.get(pe.exerciseId)
        if (!ex) return null

        const built = buildSessionExercise(pe, ex, pe.weight)
        return built
      })
      .filter(Boolean) as SessionExercise[]

    if (sessionExercises.length === 0) return

    // Activate the first exercise
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
      startTime:            new Date().toISOString(),
    }

    set({ session })
  },

  // ── logCurrentSet ──────────────────────────────────────────────────────

  logCurrentSet: (exerciseIndex, weight, reps, previousPR) => {
    const { session } = get()
    if (!session) {
      return { isSetSuccess: false, isLastSetOfExercise: false, restSeconds: 90, xpAwarded: 0, isPersonalRecord: false }
    }

    const exercises = [...session.exercises]
    const idx = exerciseIndex
    const ex = { ...exercises[idx] }

    const isSetSuccess = computeSetSuccess(weight, reps, ex.weight, ex.reps)

    const newSet: LoggedSet = {
      setNumber:   ex.currentSetIndex + 1,
      weight,
      reps,
      completed:   true,
      isSuccess:   isSetSuccess,
      completedAt: new Date().toISOString(),
    }

    const loggedSets = [...ex.loggedSets, newSet]
    const isLastSetOfExercise = ex.currentSetIndex === ex.sets - 1

    let xpAwarded = 0
    let isPersonalRecord = false

    if (isLastSetOfExercise) {
      // ── Exercise complete — compute success and award XP ──────────────
      const allSuccess = loggedSets.every((s) => s.isSuccess)
      ex.success = allSuccess

      // Check for PR via Epley 1RM
      const epley1RM = calculateEpley1RM(weight, reps)
      const prevBest  = previousPR ?? 0
      isPersonalRecord = epley1RM > prevBest && ex.useWilksRank

      // XP computation
      const raw = computeExerciseXP({
        isSuccessfulProgression: allSuccess,
        isPersonalRecord,
      })

      xpAwarded = raw.total
      ex.xpEarned = xpAwarded
      ex.isPersonalRecord = isPersonalRecord
      ex.status = 'completed'
    }

    ex.loggedSets    = loggedSets
    ex.currentSetIndex = isLastSetOfExercise ? ex.currentSetIndex : ex.currentSetIndex + 1
    // Reset inputs for next set (keep same weight, reset reps to plan)
    if (!isLastSetOfExercise) {
      ex.inputReps = ex.reps
    }

    exercises[idx] = ex

    // Update phase
    const newPhase: SessionPhase = isLastSetOfExercise ? 'resting_last' : 'resting'

    set({
      session: {
        ...session,
        exercises,
        phase:               newPhase,
        totalXpThisSession:  session.totalXpThisSession + xpAwarded,
      },
    })

    return {
      isSetSuccess,
      isLastSetOfExercise,
      restSeconds: ex.restSeconds,
      xpAwarded,
      isPersonalRecord,
    }
  },

  // ── markSessionDoneEarly ───────────────────────────────────────────────

  markSessionDoneEarly: () => {
    const { session } = get()
    if (!session) return
    set({
      session: {
        ...session,
        phase: 'done_early',
        endTime: new Date().toISOString(),
      },
    })
  },

  // ── updateCurrentInput ─────────────────────────────────────────────────

  updateCurrentInput: (exerciseIndex, weight, reps) => {
    const { session } = get()
    if (!session) return

    const exercises = [...session.exercises]
    const ex = { ...exercises[exerciseIndex] }
    if (weight !== undefined) ex.inputWeight = weight
    if (reps !== undefined) ex.inputReps = reps
    exercises[exerciseIndex] = ex

    set({ session: { ...session, exercises } })
  },

  updateTotalSets: (exerciseIndex, delta) => {
    const { session } = get()
    if (!session) return

    const exercises = [...session.exercises]
    const ex = { ...exercises[exerciseIndex] }
    
    // Prevent reducing sets below what has already been logged or below 1
    const minSets = Math.max(1, ex.currentSetIndex + 1)
    ex.sets = Math.max(minSets, Math.min(20, ex.sets + delta))
    
    exercises[exerciseIndex] = ex
    set({ session: { ...session, exercises } })
  },

  // ── advanceToNextExercise ──────────────────────────────────────────────

  advanceToNextExercise: (fromIndex) => {
    const { session } = get()
    if (!session) return

    const exercises = [...session.exercises]
    
    // Find next pending exercise with wrap-around
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
      // All exercises done
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

  // ── setViewIndex ───────────────────────────────────────────────────────

  setViewIndex: (index) => {
    const { session } = get()
    if (!session) return
    const clamped = Math.max(0, Math.min(index, session.exercises.length - 1))
    set({ session: { ...session, viewIndex: clamped } })
  },

  // ── finishSession ──────────────────────────────────────────────────────

  finishSession: (isEarly) => {
    const { session } = get()
    if (!session) throw new Error('No active session')

    const endTime = new Date().toISOString()
    const startMs = new Date(session.startTime).getTime()
    const endMs   = new Date(endTime).getTime()
    const durationSeconds = Math.round((endMs - startMs) / 1000)

    // Mark all remaining pending exercises as skipped
    const exercises = session.exercises.map((ex) =>
      ex.status === 'pending' ? { ...ex, status: 'skipped' as const, xpEarned: 0 } : ex,
    )

    // Compute final XP
    const baseXP = exercises.reduce((sum, ex) => sum + (ex.xpEarned ?? 0), 0)

    const hasSkips = exercises.some((ex) => ex.status === 'skipped')
    const fullCompletion = !hasSkips

    let totalXpEarned = baseXP
    if (fullCompletion) totalXpEarned += XP_REWARDS.FULL_SESSION_BONUS

    // Build LoggedExercise array
    const progressionStates = useLogStore.getState().progressionStates
    
    const loggedExercises: LoggedExercise[] = exercises.map((ex) => {
      const logged: LoggedExercise = {
        exerciseId:     ex.exerciseId,
        plannedSets:    ex.sets,
        plannedReps:    ex.reps,
        plannedWeight:  ex.weight,
        actualSets:     ex.loggedSets,
        success:        ex.success ?? false,
        skipped:        ex.status === 'skipped',
      }

      if (!logged.skipped) {
        const fails = progressionStates[ex.exerciseId]?.consecutiveFails ?? 0
        const sugg = calculateProgressionSuggestion(logged, fails, ex.progressionType, ex.progressionStep)
        if (sugg.nextWeight !== logged.plannedWeight) logged.suggestedNextWeight = sugg.nextWeight
        if (sugg.nextReps !== logged.plannedReps) logged.suggestedNextReps = sugg.nextReps
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

  // ── endRest ────────────────────────────────────────────────────────────

  endRest: () => {
    const { session } = get()
    if (!session) return
    set({ session: { ...session, phase: 'working' } })
  },

  // ── clearSession ───────────────────────────────────────────────────────

  clearSession: () => set({ session: null }),
    }),
    { name: 'session-storage' }
  )
)
