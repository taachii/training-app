import { useEffect, useRef, useState, useCallback, useLayoutEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { X, ChevronLeft, ChevronRight, Zap, Clock, Trophy, Check, Plus, Minus, ChevronDown, ChevronUp, Link, Timer, Shuffle } from 'lucide-react'

import { useSessionStore } from '@/store/useSessionStore'
import { useWorkoutStore } from '@/store/useWorkoutStore'
import { XP_REWARDS } from '@/lib/xpSystem'
import XpSummaryAnimation from '@/components/workouts/XpSummaryAnimation'
import ExercisePicker from '@/components/workouts/ExercisePicker'
import { useLogStore } from '@/store/useLogStore'
import { useProfileStore } from '@/store/useProfileStore'
import { useScheduleStore } from '@/store/useScheduleStore'
import { MUSCLE_GROUP_META } from '@/lib/muscleGroups'
import type { SessionExercise } from '@/types/session'
import type { WorkoutLog } from '@/types/workout'
import type { Exercise } from '@/types/exercise'

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${String(s).padStart(2, '0')}s`
  return `${s}s`
}

// ─────────────────────────────────────────────
// SET CIRCLES
// ─────────────────────────────────────────────

interface SetCirclesProps {
  totalSets: number
  currentSetIndex: number   // 0-indexed, which set is "active"
  loggedSets: SessionExercise['loggedSets']
  status: SessionExercise['status']
}

function SetCircles({ totalSets, currentSetIndex, loggedSets, status }: SetCirclesProps) {
  return (
    <div className="flex items-center justify-center gap-2 flex-wrap">
      {Array.from({ length: totalSets }, (_, i) => {
        const logged = loggedSets[i]
        const isActive = status === 'active' && i === currentSetIndex
        const isDone = !!logged
        const isSuccess = logged?.isSuccess
        const isSkipped = status === 'skipped'

        let bg = 'transparent'
        let border = 'rgba(255,255,255,0.2)'
        let shadow = 'none'

        if (isSkipped) {
          bg = 'rgba(255,255,255,0.08)'
          border = 'rgba(255,255,255,0.1)'
        } else if (isDone && isSuccess) {
          bg = '#22c55e'
          border = '#22c55e'
          shadow = '0 0 10px rgba(34,197,94,0.6)'
        } else if (isDone && !isSuccess) {
          bg = '#ef4444'
          border = '#ef4444'
          shadow = '0 0 10px rgba(239,68,68,0.6)'
        } else if (isActive) {
          bg = 'rgba(139,92,246,0.3)'
          border = '#8b5cf6'
          shadow = '0 0 12px rgba(139,92,246,0.5)'
        }

        return (
          <div
            key={i}
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: bg,
              border: `2px solid ${border}`,
              boxShadow: shadow,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease',
              flexShrink: 0,
            }}
          >
            {isDone && isSuccess && <Check size={14} color="#fff" strokeWidth={3} />}
            {isDone && !isSuccess && (
              <span style={{ color: '#fff', fontSize: 12, fontWeight: 700, lineHeight: 1 }}>✕</span>
            )}
            {isActive && (
              <span style={{ color: '#a78bfa', fontSize: 11, fontWeight: 700 }}>{i + 1}</span>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────
// STEPPER
// ─────────────────────────────────────────────

interface StepperProps {
  value: number
  onIncrement: () => void
  onDecrement: () => void
  suffix: string
  step?: number
  disabled?: boolean
}

function Stepper({ value, onIncrement, onDecrement, suffix, disabled }: StepperProps) {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={onDecrement}
        disabled={disabled}
        className="w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90 disabled:opacity-40"
        style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff' }}
      >
        <Minus size={16} />
      </button>
      <div className="text-center min-w-[60px]">
        <span
          className="text-2xl font-black"
          style={{ fontFamily: 'var(--font-display)', color: '#fff' }}
        >
          {value}
        </span>
        <span className="text-xs ml-1" style={{ color: 'rgba(255,255,255,0.6)' }}>{suffix}</span>
      </div>
      <button
        onClick={onIncrement}
        disabled={disabled}
        className="w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90 disabled:opacity-40"
        style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff' }}
      >
        <Plus size={16} />
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────
// EXERCISE CARD
// ─────────────────────────────────────────────

interface ExerciseCardProps {
  exercise: SessionExercise
  isCurrent: boolean
  planIndex: number    // 1-indexed display number
  totalCount: number
  onUpdateWeight: (weight: number) => void
  onUpdateReps: (delta: number) => void
  onUpdateTime: (delta: number) => void
  onUpdateSets: (delta: number) => void
  onLogSet: () => void
  onNextExercise: () => void
  isResting: boolean
  isLastInSession?: boolean
  isCustomSession?: boolean
  onAddExercise?: () => void
}


function ExerciseCard({
  exercise, isCurrent, planIndex, totalCount,
  onUpdateWeight, onUpdateReps, onUpdateTime, onUpdateSets, onLogSet, onNextExercise, isResting, isLastInSession,
  isCustomSession, onAddExercise,
}: ExerciseCardProps) {
  const muscleMeta = MUSCLE_GROUP_META[exercise.primaryMuscleGroup]
  const isSkipped = exercise.status === 'skipped'
  const isDone = exercise.status === 'completed'
  const allFailed = exercise.loggedSets.length > 0 && exercise.loggedSets.every(s => !s.isSuccess)

  const isBodyweight = exercise.exerciseCategory === 'bodyweight'
  const isPureBodyweight = isBodyweight && !['weighted_pull_up', 'weighted_chin_up', 'weighted_dip'].includes(exercise.exerciseId)

  // ── In-app timer state (only for time-based sets)
  const [exTimerActive, setExTimerActive] = useState(false)

  const [exTimerSec, setExTimerSec] = useState(0)
  const [exTimerTotal, setExTimerTotal] = useState(0)
  const [exTimerDone, setExTimerDone] = useState(false)
  const [failSeconds, setFailSeconds] = useState<number | null>(null)
  const exTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startExTimer = useCallback((targetSecs: number) => {
    if (exTimerRef.current) clearInterval(exTimerRef.current)
    setExTimerSec(targetSecs)
    setExTimerTotal(targetSecs)
    setExTimerActive(true)
    setExTimerDone(false)
    setFailSeconds(null)
    if (navigator.vibrate) navigator.vibrate(30)
    exTimerRef.current = setInterval(() => {
      setExTimerSec(prev => {
        if (prev <= 1) {
          clearInterval(exTimerRef.current!)
          setExTimerActive(false)
          setExTimerDone(true)
          if (navigator.vibrate) navigator.vibrate([100, 50, 100])
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [])

  const stopExTimer = useCallback(() => {
    if (exTimerRef.current) clearInterval(exTimerRef.current)
    setExTimerActive(false)
  }, [])

  // Reset timer state when set changes
  const prevSetIndexRef = useRef(exercise.currentSetIndex)
  if (prevSetIndexRef.current !== exercise.currentSetIndex) {
    prevSetIndexRef.current = exercise.currentSetIndex
    if (exTimerRef.current) clearInterval(exTimerRef.current)
    setExTimerActive(false)
    setExTimerDone(false)
    setFailSeconds(null)
  }

  return (
    <div
      className="flex flex-col h-full"
      style={{
        padding: '16px 16px 0',
        opacity: (isSkipped || (isDone && !isCurrent)) ? 0.7 : 1,
      }}
    >
      {/* ── Exercise header ── */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          {/* Muscle badge + Superset badge */}
          <div className="flex items-center gap-2 mb-2">
            <span
              className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-md"
              style={{ background: `${muscleMeta.color}22`, color: muscleMeta.color }}
            >
              {muscleMeta.label}
            </span>
            {exercise.supersetGroupId && (
              <span
                className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md"
                style={{ background: '#6366f122', color: '#818cf8' }}
              >
                <Link size={10} />
                Superset
              </span>
            )}
          </div>

          <h2
            className="text-xl font-black leading-tight"
            style={{
              fontFamily: 'var(--font-display)',
              color: isSkipped ? 'rgba(255,255,255,0.4)' : '#fff',
            }}
          >
            {exercise.exerciseName}
          </h2>

          <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Ćwiczenie {planIndex} z {totalCount} ·{' '}
            {exercise.targetSets.length} serie ·{' '}
            {exercise.restSeconds}s przerwa
          </p>
        </div>

        {/* Status badge */}
        {isDone && (
          <div
            className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ml-3"
            style={{ background: allFailed ? '#ef444422' : '#22c55e22', border: `2px solid ${allFailed ? '#ef4444' : '#22c55e'}` }}
          >
            {allFailed
              ? <span style={{ color: '#ef4444', fontSize: 12, fontWeight: 700 }}>✕</span>
              : <Check size={14} color="#22c55e" strokeWidth={3} />
            }
          </div>
        )}
        {isSkipped && (
          <div
            className="flex-shrink-0 px-2 py-1 rounded-lg text-xs font-semibold ml-3"
            style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}
          >
            Pominięto
          </div>
        )}
      </div>

      {/* ── Set circles ── */}
      <div className="mb-5 flex items-center justify-center gap-4">
        {isCurrent && !isDone && !isSkipped && (
          <button
            onClick={() => onUpdateSets(-1)}
            disabled={exercise.targetSets.length <= Math.max(1, exercise.currentSetIndex + (exercise.loggedSets.length > exercise.currentSetIndex ? 1 : 0))}
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 disabled:opacity-30 active:scale-90 transition-all"
            style={{ background: 'rgba(255,255,255,0.1)', color: '#fff' }}
          >
            <Minus size={16} />
          </button>
        )}

        <SetCircles
          totalSets={exercise.targetSets.length}
          currentSetIndex={exercise.currentSetIndex}
          loggedSets={exercise.loggedSets}
          status={exercise.status}
        />

        {isCurrent && !isDone && !isSkipped && (
          <button
            onClick={() => onUpdateSets(1)}
            disabled={exercise.targetSets.length >= 20}
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 disabled:opacity-30 active:scale-90 transition-all"
            style={{ background: 'rgba(255,255,255,0.1)', color: '#fff' }}
          >
            <Plus size={16} />
          </button>
        )}
      </div>

      {/* ── Input controls (only for active exercise) ── */}
      {isCurrent && !isDone && !isSkipped && (
        <>
          {/* Set label */}
          <div className="text-center mb-4">
            <span
              className="text-xs font-semibold px-3 py-1 rounded-full"
              style={{ background: 'rgba(139,92,246,0.2)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.3)' }}
            >
              Seria {exercise.currentSetIndex + 1} z {exercise.targetSets.length}
            </span>
          </div>

          {(() => {
            const currentTarget = exercise.targetSets[exercise.currentSetIndex] || exercise.targetSets[exercise.targetSets.length - 1]
            const isTimeBased = currentTarget?.type === 'time'

            if (isTimeBased) {
              const targetSecs = exercise.inputTimeSeconds
              const timerProgress = exTimerTotal > 0 ? exTimerSec / exTimerTotal : 0
              const timerRadius = 60
              const timerCirc = 2 * Math.PI * timerRadius
              const timerOffset = timerCirc * (1 - timerProgress)
              const isTimerUrgent = exTimerActive && exTimerSec <= 5

              return (
                <div className="flex-1 w-full flex flex-col items-center justify-center mb-2 relative">
                  {/* Target time stepper (only when timer not active) */}
                  {!exTimerActive && !exTimerDone && (
                    <div className="flex flex-col items-center gap-1 w-full relative z-10">
                      <p className="text-[10px] uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>Cel</p>
                      <Stepper
                        value={targetSecs}
                        onIncrement={() => onUpdateTime(5)}
                        onDecrement={() => onUpdateTime(-5)}
                        suffix="s"
                        disabled={isResting}
                      />
                      <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>Plan: {currentTarget.timeSeconds} s</p>
                      
                      {/* Timer controls */}
                      <button
                        onClick={() => startExTimer(targetSecs)}
                        disabled={isResting}
                        className="w-full py-4 mt-6 rounded-2xl font-black text-base transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                        style={{
                          background: 'linear-gradient(135deg, #0d9488, #14b8a6)',
                          color: '#fff',
                          boxShadow: '0 4px 20px rgba(20,184,166,0.4)',
                          fontFamily: 'var(--font-display)',
                          fontSize: '15px',
                        }}
                      >
                        <Timer size={18} />
                        Start serii {exercise.currentSetIndex + 1}
                      </button>
                    </div>
                  )}

                  {/* Countdown ring */}
                  {(exTimerActive || exTimerDone) && (
                    <div className="relative flex-1 w-full flex flex-col items-center justify-center">
                      <div 
                        className="transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] relative flex items-center justify-center" 
                        style={{ 
                          width: 180, height: 180,
                          transform: exTimerDone ? 'translateY(-30px) scale(0.9)' : 'translateY(0) scale(1)'
                        }}
                      >
                        <svg width="180" height="180" viewBox="0 0 180 180" aria-hidden="true">
                          <circle cx="90" cy="90" r={timerRadius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="7" />
                          <circle
                            cx="90" cy="90" r={timerRadius}
                            fill="none"
                            stroke={exTimerDone ? '#22c55e' : isTimerUrgent ? '#ef4444' : '#2dd4bf'}
                            strokeWidth="7"
                            strokeLinecap="round"
                            strokeDasharray={timerCirc}
                            strokeDashoffset={timerOffset}
                            transform="rotate(-90 90 90)"
                            style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s ease' }}
                          />
                        </svg>
                        <div className="absolute flex flex-col items-center">
                          {exTimerDone ? (
                            <span className="text-4xl text-green-500 animate-in zoom-in duration-300">✓</span>
                          ) : (
                            <>
                              <span className="font-black text-3xl" style={{ fontFamily: 'var(--font-display)', color: isTimerUrgent ? '#f87171' : '#fff', lineHeight: 1 }}>
                                {formatTime(exTimerSec)}
                              </span>
                              <span className="text-[10px] mt-0.5 uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.5)' }}>czas</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Reset timera (Active) */}
                      <div 
                        className="absolute top-[calc(50%+100px)] left-0 right-0 flex justify-center transition-all duration-500"
                        style={{
                          opacity: exTimerActive && !exTimerDone ? 1 : 0,
                          transform: exTimerActive && !exTimerDone ? 'translateY(0)' : 'translateY(-10px)',
                          pointerEvents: exTimerActive && !exTimerDone ? 'auto' : 'none'
                        }}
                      >
                        <button
                          onClick={stopExTimer}
                          className="text-xs font-medium py-2 px-4 rounded-lg active:scale-95 transition-all"
                          style={{ color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.05)' }}
                        >
                          Reset timera
                        </button>
                      </div>

                      {/* Buttons (Done & failSeconds === null) */}
                      <div 
                        className="absolute top-[calc(50%+65px)] left-0 right-0 w-full flex flex-col gap-3 transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] px-4"
                        style={{
                          opacity: exTimerDone && failSeconds === null ? 1 : 0,
                          transform: exTimerDone && failSeconds === null ? 'translateY(0)' : 'translateY(20px)',
                          pointerEvents: exTimerDone && failSeconds === null ? 'auto' : 'none'
                        }}
                      >
                        <p className="text-center text-sm font-semibold" style={{ color: '#2dd4bf' }}>Czas upłynął</p>
                        <div className="flex gap-3">
                          <button
                            onClick={() => { onLogSet(); setExTimerDone(false); }}
                            className="flex-1 py-3 rounded-2xl font-black text-sm transition-all active:scale-95"
                            style={{ background: 'linear-gradient(135deg, #16a34a, #22c55e)', color: '#fff', boxShadow: '0 4px 14px rgba(34,197,94,0.35)' }}
                          >
                            Sukces
                          </button>
                          <button
                            onClick={() => setFailSeconds(0)}
                            className="flex-1 py-3 rounded-2xl font-black text-sm transition-all active:scale-95"
                            style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}
                          >
                            Porażka
                          </button>
                        </div>
                      </div>

                      {/* Fail Stepper (Done & failSeconds !== null) */}
                      <div 
                        className="absolute top-[calc(50%+65px)] left-0 right-0 w-full flex flex-col gap-4 transition-all duration-500 ease-out px-4"
                        style={{
                          opacity: exTimerDone && failSeconds !== null ? 1 : 0,
                          transform: exTimerDone && failSeconds !== null ? 'translateY(0)' : 'translateY(20px)',
                          pointerEvents: exTimerDone && failSeconds !== null ? 'auto' : 'none'
                        }}
                      >
                        <p className="text-center text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.7)' }}>Ile sekund dałeś radę?</p>
                        <div className="flex justify-center">
                          <Stepper
                            value={failSeconds === 0 ? Math.max(1, Math.floor(targetSecs / 2)) : failSeconds}
                            onIncrement={() => setFailSeconds(prev => Math.min(targetSecs - 1, (prev ?? 0) + 1))}
                            onDecrement={() => setFailSeconds(prev => Math.max(1, (prev ?? 1) - 1))}
                            suffix="s"
                          />
                        </div>
                        <button
                          onClick={() => {
                            const actualSecs = failSeconds === 0 ? Math.max(1, Math.floor(targetSecs / 2)) : failSeconds
                            onUpdateTime((actualSecs ?? 0) - targetSecs)
                            onLogSet()
                            setExTimerDone(false)
                            setFailSeconds(null)
                          }}
                          className="w-full py-4 rounded-2xl font-black text-base transition-all active:scale-95"
                          style={{ background: '#fff', color: '#000', fontFamily: 'var(--font-display)' }}
                        >
                          Zapisz wynik
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            }

            return (
              <>
                {/* Weight stepper */}
                {!isPureBodyweight && (
                  <div className="flex flex-col items-center gap-1 mb-4">
                    <p className="text-[10px] uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      Ciężar
                    </p>
                    <div className="relative flex items-center">
                      <input
                        type="number"
                        min={0}
                        max={999}
                        step={0.25}
                        value={exercise.inputWeight === 0 ? '' : exercise.inputWeight}
                        onChange={(e) => {
                          const val = e.target.value
                          if (val === '') {
                            onUpdateWeight(0)
                            return
                          }
                          onUpdateWeight(parseFloat(val) || 0)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.currentTarget.blur()
                          }
                        }}
                        disabled={isResting}
                        className="h-10 w-28 rounded-xl text-center text-xl font-bold outline-none disabled:opacity-50"
                        style={{
                          background: 'rgba(255,255,255,0.08)',
                          color: '#fff',
                          border: '1px solid rgba(255,255,255,0.1)',
                          paddingRight: '22px',
                        }}
                        placeholder="0"
                      />
                      <span
                        className="absolute right-3 text-[11px] font-semibold pointer-events-none"
                        style={{ color: 'rgba(255,255,255,0.4)' }}
                      >
                        kg
                      </span>
                    </div>
                    <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      Plan: {currentTarget.weight} kg
                    </p>
                  </div>
                )}

                {/* Reps stepper */}
                <div className="flex flex-col items-center gap-1 mb-5">
                  <p className="text-[10px] uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    Powtórzenia
                  </p>
                  <Stepper
                    value={exercise.inputReps}
                    onIncrement={() => onUpdateReps(1)}
                    onDecrement={() => onUpdateReps(-1)}
                    suffix="powt."
                    disabled={isResting}
                  />
                  <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    Plan: {currentTarget.reps} powt.
                  </p>
                </div>
              </>
            )
          })()}

          {/* Log set button — only for reps-based exercises */}
          {(() => {
            const currentTarget = exercise.targetSets[exercise.currentSetIndex] || exercise.targetSets[exercise.targetSets.length - 1]
            if (currentTarget?.type === 'time') return null
            return (
              <button
                onClick={onLogSet}
                disabled={isResting}
                className="w-full py-4 rounded-2xl font-black text-base transition-all active:scale-[0.98] disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg, #4338ca, #7c3aed)',
                  color: '#fff',
                  boxShadow: '0 4px 20px rgba(99,102,241,0.4)',
                  fontFamily: 'var(--font-display)',
                  fontSize: '15px',
                  letterSpacing: '0.02em',
                }}
                aria-label="Zakończ serię"
              >
                ✓ Zakończ serię {exercise.currentSetIndex + 1}
              </button>
            )
          })()}
        </>
      )}

      {/* Completed exercise — show logged results */}
      {(isDone || isSkipped) && exercise.loggedSets.length > 0 && (
        <div className="flex flex-col gap-2">
          {exercise.loggedSets.map((s) => (
            <div
              key={s.setNumber}
              className="flex items-center justify-between px-3 py-2 rounded-xl"
              style={{
                background: s.isSuccess ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                border: `1px solid ${s.isSuccess ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
              }}
            >
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>Seria {s.setNumber}</span>
              <span style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>
                {s.timeSeconds !== undefined ? `${s.timeSeconds}s` : `${!isPureBodyweight && (s.weight ?? 0) > 0 ? `${s.weight} kg × ` : ''}${s.reps} powt.`}
              </span>
              <span style={{ color: s.isSuccess ? '#22c55e' : '#ef4444', fontSize: 11, fontWeight: 600 }}>
                {s.isSuccess ? '✓ OK' : '✕ FAIL'}
              </span>
            </div>
          ))}

          {exercise.xpEarned > 0 && (
            <div className="flex items-center justify-center gap-1.5 mt-1">
              <Zap size={12} style={{ color: '#818cf8' }} />
              <span className="text-xs font-semibold" style={{ color: '#818cf8' }}>
                +{exercise.xpEarned} XP
              </span>
              {exercise.isPersonalRecord && (
                <span className="text-xs font-semibold" style={{ color: '#fbbf24' }}>
                  🏆 PR!
                </span>
              )}
            </div>
          )}

          {/* Add "Następne ćwiczenie" button if this is the active session current exercise and it's done */}
          {isCurrent && isDone && (
            <div className="flex flex-col gap-3 mt-4">
              {isCustomSession && isLastInSession && (
                <button
                  onClick={onAddExercise}
                  className="w-full py-4 rounded-2xl font-black text-base transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  style={{
                    background: 'linear-gradient(135deg, #059669, #10b981)',
                    color: '#fff',
                    boxShadow: '0 4px 20px rgba(16,185,129,0.3)',
                    fontFamily: 'var(--font-display)',
                    fontSize: '15px',
                  }}
                >
                  <Plus size={18} />
                  Dodaj kolejne ćwiczenie
                </button>
              )}
              <button
                onClick={onNextExercise}
                className="w-full py-4 rounded-2xl font-black text-base transition-all active:scale-[0.98]"
                style={{
                  background: 'linear-gradient(135deg, #4338ca, #7c3aed)',
                  color: '#fff',
                  boxShadow: '0 4px 20px rgba(99,102,241,0.4)',
                  fontFamily: 'var(--font-display)',
                  fontSize: '15px',
                  letterSpacing: '0.02em',
                }}
              >
                {isLastInSession ? 'Zakończ trening →' : 'Następne ćwiczenie →'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// REST TIMER OVERLAY
// ─────────────────────────────────────────────

interface RestTimerProps {
  seconds: number
  totalSeconds: number
  onAdjust: (delta: number) => void
  onSkip: () => void
  exerciseName?: string
  setInfo?: string
  nextInfo?: string
}

function RestTimer({ seconds, totalSeconds, onAdjust, onSkip, exerciseName, setInfo, nextInfo }: RestTimerProps) {
  const progress = totalSeconds > 0 ? seconds / totalSeconds : 0
  const radius = 72
  const circ = 2 * Math.PI * radius
  const offset = circ * (1 - progress)
  const isUrgent = seconds <= 10 && seconds > 0

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6">
      {/* Context info — what was just done */}
      {exerciseName && (
        <div className="text-center">
          <p className="text-sm font-bold" style={{ color: '#fff' }}>{exerciseName}</p>
          {setInfo && <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>{setInfo}</p>}
        </div>
      )}

      {/* SVG countdown ring */}
      <div className="relative flex items-center justify-center" style={{ width: 180, height: 180 }}>
        <svg width="180" height="180" viewBox="0 0 180 180" aria-hidden="true">
          <circle cx="90" cy="90" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
          <circle
            cx="90" cy="90" r={radius}
            fill="none"
            stroke={isUrgent ? '#ef4444' : '#8b5cf6'}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            transform="rotate(-90 90 90)"
            style={{
              transition: 'stroke-dashoffset 1s linear, stroke 0.3s ease',
              filter: `drop-shadow(0 0 12px ${isUrgent ? '#ef4444' : '#8b5cf6'})`,
            }}
          />
        </svg>
        <div
          className="absolute flex flex-col items-center"
          style={{ pointerEvents: 'none' }}
        >
          <span
            className="font-black text-4xl"
            style={{
              fontFamily: 'var(--font-display)',
              color: isUrgent ? '#f87171' : '#fff',
              transition: 'color 0.3s ease',
              lineHeight: 1,
            }}
          >
            {formatTime(seconds)}
          </span>
          <span className="text-xs mt-1 uppercase tracking-widest font-semibold" style={{ color: 'rgba(255,255,255,0.5)' }}>
            przerwa
          </span>
        </div>
      </div>

      {/* Next step info */}
      {nextInfo && (
        <div
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Następnie:</span>
          <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.8)' }}>{nextInfo}</span>
        </div>
      )}

      {/* Adjust buttons */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => onAdjust(-30)}
          className="px-4 py-2 rounded-xl text-sm font-semibold transition-all active:scale-90"
          style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)' }}
        >
          −30s
        </button>
        <button
          onClick={() => onAdjust(30)}
          className="px-4 py-2 rounded-xl text-sm font-semibold transition-all active:scale-90"
          style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)' }}
        >
          +30s
        </button>
      </div>

      {/* Skip rest */}
      <button
        onClick={onSkip}
        className="text-sm font-medium transition-all"
        style={{ color: 'rgba(255,255,255,0.5)' }}
      >
        Pomiń przerwę →
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────
// DONE SCREEN
// ─────────────────────────────────────────────

interface DoneScreenProps {
  planName: string
  log: WorkoutLog | null
  initialTotalXp: number
  onClose: (applySuggestions: boolean, customName?: string) => void
}

function DoneScreen({ planName, log, initialTotalXp, onClose }: DoneScreenProps) {
  const [applySuggestions, setApplySuggestions] = useState(true)
  const [suggestionsExpanded, setSuggestionsExpanded] = useState(false)
  const [customName, setCustomName] = useState('')
  const exercisesDB = useWorkoutStore((s) => s.exercises)

  if (!log) return null
  const isCustom = log.workoutPlanId === 'custom'

  const hasSuggestions = log.exercises.some(ex => !ex.skipped && (ex.suggestedNextWeight !== undefined || ex.suggestedNextReps !== undefined))
  const completedCount = log.exercises.filter(ex => !ex.skipped).length
  const skippedCount = log.exercises.filter(ex => ex.skipped).length

  return (
    <div
      className="absolute inset-0 z-50 overflow-y-auto"
      style={{ background: 'linear-gradient(180deg, #0f0a28 0%, #1a0a3e 100%)' }}
    >
      <div className="flex flex-col items-center justify-center min-h-full px-6 py-8 gap-6 max-w-md mx-auto w-full">
      <div className="text-center w-full">
        <h1 className="text-2xl font-black mb-1" style={{ fontFamily: 'var(--font-display)', color: '#fff' }}>
          Trening ukończony!
        </h1>
        {isCustom ? (
          <input
            type="text"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            className="text-sm mb-6 bg-transparent outline-none text-center transition-colors focus:border-indigo-400"
            style={{
              color: '#fff',
              borderBottom: '1px solid rgba(255,255,255,0.2)',
              width: '80%',
              paddingBottom: 4,
            }}
            placeholder="Nazwij swój trening..."
            maxLength={40}
          />
        ) : (
          <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.5)' }}>{planName}</p>
        )}
        
        <XpSummaryAnimation 
          initialTotalXp={initialTotalXp} 
          sessionEarnedXp={log.totalXpEarned} 
        />
      </div>

      {/* Stats */}
      <div className="w-full grid grid-cols-2 gap-3 mt-4">
        {[
          { label: 'Czas', value: formatDuration(log.durationSeconds), icon: '⏱️' },
          { label: 'Ukończone', value: `${completedCount}/${log.exercises.length}`, icon: '✅' },
        ].map(({ label, value, icon }) => (
          <div
            key={label}
            className="flex flex-col items-center gap-1 py-3 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <span className="text-xl">{icon}</span>
            <span className="text-sm font-black" style={{ color: '#fff', fontFamily: 'var(--font-display)' }}>
              {value}
            </span>
            <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</span>
          </div>
        ))}
      </div>

      {skippedCount > 0 && (
        <p className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.4)' }}>
          💡 {skippedCount} {skippedCount === 1 ? 'ćwiczenie pominięte' : 'ćwiczenia pominięte'}
        </p>
      )}

      {hasSuggestions && (
        <div className="w-full mt-2 flex flex-col p-4 rounded-2xl transition-all" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="applySuggestions"
              checked={applySuggestions}
              onChange={(e) => setApplySuggestions(e.target.checked)}
              className="w-5 h-5 mt-0.5 accent-indigo-500 rounded flex-shrink-0 cursor-pointer"
            />
            <div className="flex-1 flex flex-col gap-2">
              <label htmlFor="applySuggestions" className="text-sm font-medium leading-snug cursor-pointer block" style={{ color: '#fff' }}>
                Zaktualizuj plan o nowo wyliczone wartości
              </label>

              <div className="flex justify-end">
                <button
                  onClick={() => setSuggestionsExpanded(!suggestionsExpanded)}
                  className="flex items-center gap-1.5 text-xs font-bold transition-all py-1.5 px-3 rounded-lg active:scale-95"
                  style={{ color: '#c4b5fd', background: 'rgba(139, 92, 246, 0.15)' }}
                >
                  {suggestionsExpanded ? 'Ukryj szczegóły' : 'Pokaż szczegóły'}
                  {suggestionsExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </div>
            </div>
          </div>

          {suggestionsExpanded && (
            <div className="mt-4 flex flex-col gap-2 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              {log.exercises.map(ex => {
                if (ex.skipped || (ex.suggestedNextWeight === undefined && ex.suggestedNextReps === undefined)) return null
                const def = exercisesDB.find(d => d.id === ex.exerciseId)
                const name = def?.name ?? 'Nieznane ćwiczenie'

                const isRepsProgression = ex.suggestedNextReps !== undefined

                let oldVal = ''
                let newVal = ''
                let diffText = ''
                let isOverload = false

                if (isRepsProgression) {
                  const firstSetReps = ex.actualSets?.[0]?.reps ?? 0
                  oldVal = `${firstSetReps} powt.`
                  newVal = `${ex.suggestedNextReps} powt.`
                  const diff = ex.suggestedNextReps! - firstSetReps
                  diffText = diff > 0 ? `+${diff}` : `${diff}`
                  isOverload = diff > 0
                } else {
                  const firstSetWeight = ex.actualSets?.[0]?.weight ?? 0
                  oldVal = `${firstSetWeight}kg`
                  newVal = `${ex.suggestedNextWeight}kg`
                  const diff = ex.suggestedNextWeight! - firstSetWeight
                  diffText = diff > 0 ? `+${diff}kg` : `${diff}kg`
                  isOverload = diff > 0
                }

                return (
                  <div key={ex.exerciseId} className="flex flex-col gap-1.5 p-2.5 rounded-xl" style={{ background: 'rgba(0,0,0,0.2)' }}>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-white truncate max-w-[65%]">{name}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md" style={{
                        background: isOverload ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        color: isOverload ? '#4ade80' : '#f87171'
                      }}>
                        {isOverload ? 'OVERLOAD' : 'DELOAD'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'line-through' }}>{oldVal}</span>
                      <ChevronRight size={12} style={{ color: 'rgba(255,255,255,0.2)' }} />
                      <span className="font-bold text-white">{newVal}</span>
                      <span className="font-black ml-1" style={{ color: isOverload ? '#4ade80' : '#f87171' }}>({diffText})</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      <button
        onClick={() => onClose(applySuggestions, isCustom && customName.trim() ? customName.trim() : undefined)}
        className="w-full py-4 rounded-2xl font-bold text-base transition-all active:scale-95"
        style={{
          background: 'linear-gradient(135deg, #4338ca, #7c3aed)',
          color: '#fff',
          boxShadow: '0 4px 20px rgba(99,102,241,0.4)',
        }}
      >
        Zamknij
      </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// VERTICAL CARD CAROUSEL
// ─────────────────────────────────────────────

interface CarouselProps {
  exercises: SessionExercise[]
  viewIndex: number
  isResting: boolean
  onUpdateWeight: (weight: number) => void
  onUpdateReps: (delta: number) => void
  onUpdateTime: (delta: number) => void
  onUpdateSets: (delta: number) => void
  onLogSet: () => void
  onNextExercise: () => void
  onSwipePrev: () => void
  onSwipeNext: () => void
  isCustomSession?: boolean
  onAddExercise?: () => void
}

function Carousel({
  exercises, viewIndex,
  isResting, onUpdateWeight, onUpdateReps, onUpdateTime, onUpdateSets, onLogSet, onNextExercise,
  onSwipePrev, onSwipeNext, isCustomSession, onAddExercise
}: CarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerH, setContainerH] = useState(0)
  const touchStartX = useRef<number | null>(null)

  // Measure real pixel height — bypasses flex chain inheritance issues
  useLayoutEffect(() => {
    if (!containerRef.current) return
    const obs = new ResizeObserver((entries) => {
      const h = entries[0]?.contentRect.height ?? 0
      if (h > 0) setContainerH(h)
    })
    obs.observe(containerRef.current)
    // Initial measurement
    setContainerH(containerRef.current.getBoundingClientRect().height)
    return () => obs.disconnect()
  }, [])

  const hasPendingExercises = exercises.some(e => e.status === 'pending' || e.status === 'active')
  const isLastInSession = !hasPendingExercises

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const delta = e.changedTouches[0].clientX - touchStartX.current
    touchStartX.current = null
    if (delta > 70) onSwipePrev()
    if (delta < -70) onSwipeNext()
  }

  return (
    <div
      ref={containerRef}
      style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {exercises.map((ex, i) => {
        const offset = i - viewIndex
        const isVisible = Math.abs(offset) <= 2

        return (
          <div
            key={ex.exerciseId + i}
            style={{
              position: 'absolute',
              top: 0, left: 0, right: 0,
              // Use measured px height for correct translateY/X%; fall back to bottom:0
              ...(containerH > 0 ? { height: containerH } : { bottom: 0 }),
              transform: `translateX(${offset * 105}%)`,
              transition: 'transform 0.42s cubic-bezier(0.32,0.72,0,1)',
              opacity: isVisible ? (offset === 0 ? 1 : 0.3) : 0,
              pointerEvents: offset === 0 ? 'auto' : 'none',
              zIndex: offset === 0 ? 2 : 1,
              display: 'flex',
              flexDirection: 'column',
              padding: '0 16px 16px',
              boxSizing: 'border-box',
            }}
            aria-hidden={offset !== 0}
          >
            <div
              style={{
                flex: 1,
                borderRadius: 24,
                overflowY: 'auto',
                background: offset === 0
                  ? 'linear-gradient(160deg, rgba(67,56,202,0.25) 0%, rgba(15,10,40,0.6) 100%)'
                  : 'rgba(255,255,255,0.04)',
                border: `1px solid ${offset === 0 ? 'rgba(139,92,246,0.35)' : 'rgba(255,255,255,0.08)'}`,
                backdropFilter: 'blur(12px)',
              }}
            >
              <ExerciseCard
                exercise={ex}
                isCurrent={offset === 0}
                planIndex={i + 1}
                totalCount={exercises.length}
                onUpdateWeight={onUpdateWeight}
                onUpdateReps={onUpdateReps}
                onUpdateTime={onUpdateTime}
                onUpdateSets={onUpdateSets}
                onLogSet={onLogSet}
                onNextExercise={onNextExercise}
                isResting={isResting}
                isLastInSession={isLastInSession}
                isCustomSession={isCustomSession}
                onAddExercise={onAddExercise}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────
// SESSION PAGE
// ─────────────────────────────────────────────

export default function SessionPage() {
  const navigate = useNavigate()
  const { planId } = useParams<{ planId?: string }>()
  const location = useLocation()
  const isCustomRoute = location.pathname === '/session/custom'

  const { session, startSession, startCustomSession, addExerciseToSession, logCurrentSet, updateCurrentInput, updateTotalSets,
    advanceToNextExercise, setViewIndex,
    finishSession, clearSession, endRest, markSessionDoneEarly } = useSessionStore()

  const [showExercisePicker, setShowExercisePicker] = useState(false)

  const isDone = session?.phase === 'done' || session?.phase === 'done_early'
  const [finalLog, setFinalLog] = useState<WorkoutLog | null>(null)

  const { plans, exercises } = useWorkoutStore()
  const { addLog, updateProgressionAfterSession, updatePersonalRecord, personalRecords } = useLogStore()
  const { addXP } = useProfileStore()

  useEffect(() => {
    if (isDone && !finalLog && session) {
      const isEarly = session.phase === 'done_early'
      const log = finishSession(isEarly)
      setFinalLog(log)
    }
  }, [isDone, finalLog, session, finishSession])

  // ── Elapsed timer ──
  const [elapsedSec, setElapsedSec] = useState(0)
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Sync elapsedSec with persisted session.startTime when session becomes available
  useEffect(() => {
    if (session?.startTime) {
      const diff = Math.floor((Date.now() - new Date(session.startTime).getTime()) / 1000)
      setElapsedSec(diff >= 0 ? diff : 0)
    }
  }, [session?.id, session?.startTime])

  const [showConfirmEarly, setShowConfirmEarly] = useState(false)

  // ── Rest timer ──
  const [restSec, setRestSec] = useState(0)
  const [restTotal, setRestTotal] = useState(0)
  const [restActive, setRestActive] = useState(false)
  const restRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Sync rest timer from localStorage on mount
  useEffect(() => {
    const expiresStr = localStorage.getItem('restExpiresAt')
    const totalStr = localStorage.getItem('restTotal')
    if (expiresStr && totalStr) {
      const expires = parseInt(expiresStr, 10)
      const now = Date.now()
      if (expires > now) {
        const remaining = Math.ceil((expires - now) / 1000)
        setRestSec(remaining)
        setRestTotal(parseInt(totalStr, 10))
        setRestActive(true)
      } else {
        localStorage.removeItem('restExpiresAt')
        localStorage.removeItem('restTotal')
      }
    }
  }, [])

  // ── Start session from URL param ──
  // NOTE: plans.length is in deps because Zustand persist rehydrates
  // asynchronously. Without it, this effect fires before plans are loaded.
  useEffect(() => {
    // Custom session route
    if (isCustomRoute) {
      if (!session?.isCustom) {
        startCustomSession()
      }
      return
    }

    if (!planId) return
    if (plans.length === 0) return  // wait for persist rehydration

    const plan = plans.find((p) => p.id === planId)
    if (!plan) return

    // Already running the same session — do not restart
    if (session && session.workoutPlanId === planId) return

    if (plan && exercises.length > 0) {
      startSession(plan, exercises)
      setElapsedSec(0)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId, plans.length, isCustomRoute])

  // ── Elapsed clock ──
  useEffect(() => {
    if (isDone) {
      if (elapsedRef.current) clearInterval(elapsedRef.current)
      return
    }
    elapsedRef.current = setInterval(() => setElapsedSec((s) => s + 1), 1000)
    return () => { if (elapsedRef.current) clearInterval(elapsedRef.current) }
  }, [isDone])

  // ── Rest timer tick ──
  useEffect(() => {
    if (!restActive || restSec <= 0) return

    restRef.current = setInterval(() => {
      setRestSec((s) => {
        if (s <= 1) {
          if (restRef.current) clearInterval(restRef.current)
          setRestActive(false)
          localStorage.removeItem('restExpiresAt')
          localStorage.removeItem('restTotal')
          endRest()
          return 0
        }
        return s - 1
      })
    }, 1000)

    return () => { if (restRef.current) clearInterval(restRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restActive])

  // ── Handlers ──
  const startRestTimer = useCallback((seconds: number) => {
    if (restRef.current) clearInterval(restRef.current)
    const activeSec = Math.max(1, seconds)
    localStorage.setItem('restExpiresAt', (Date.now() + activeSec * 1000).toString())
    localStorage.setItem('restTotal', activeSec.toString())
    setRestSec(activeSec)
    setRestTotal(activeSec)
    setRestActive(true)
  }, [])

  const handleLogSet = useCallback((index: number) => {
    if (!session) return
    const ex = session.exercises[index]
    const prevPR = personalRecords[ex.exerciseId]?.oneRepMax

    const result = logCurrentSet(index, ex.inputWeight, ex.inputReps, ex.inputTimeSeconds, prevPR)

    // Award XP immediately
    if (result.xpAwarded > 0) {
      addXP(result.xpAwarded)
    }

    // Update PR
    if (result.isPersonalRecord) {
      const epleyRM = ex.inputWeight * (1 + ex.inputReps / 30)
      updatePersonalRecord({
        exerciseId: ex.exerciseId,
        oneRepMax: epleyRM,
        weight: ex.inputWeight,
        reps: ex.inputReps,
        date: new Date().toISOString().slice(0, 10),
      })
    }

    // Only start rest timer for non-last sets; last set goes straight to summary
    if (result.nextPhase === 'resting') {
      startRestTimer(ex.restSeconds)
    }
  }, [session, logCurrentSet, addXP, updatePersonalRecord, personalRecords, startRestTimer])

  const handleUpdateWeight = useCallback((val: number) => {
    if (!session) return
    updateCurrentInput(session.viewIndex, val, undefined, undefined)
  }, [session, updateCurrentInput])

  const handleUpdateReps = useCallback((delta: number) => {
    if (!session) return
    const ex = session.exercises[session.viewIndex]
    const current = ex.inputReps
    const next = Math.max(1, current + delta)
    updateCurrentInput(session.viewIndex, undefined, next, undefined)
  }, [session, updateCurrentInput])

  const handleUpdateTime = useCallback((delta: number) => {
    if (!session) return
    const ex = session.exercises[session.viewIndex]
    const current = ex.inputTimeSeconds || 60
    const next = Math.max(5, current + delta)
    updateCurrentInput(session.viewIndex, undefined, undefined, next)
  }, [session, updateCurrentInput])

  const handleUpdateSets = useCallback((delta: number) => {
    if (!session) return
    updateTotalSets(session.viewIndex, delta)
  }, [session, updateTotalSets])

  const handleSkipRest = useCallback(() => {
    if (restRef.current) clearInterval(restRef.current)
    localStorage.removeItem('restExpiresAt')
    localStorage.removeItem('restTotal')
    setRestActive(false)
    setRestSec(0)
    endRest()
  }, [endRest])

  const handleAdjustRest = useCallback((delta: number) => {
    setRestSec((s) => {
      const newSec = Math.max(0, s + delta)
      if (newSec === 0) {
        localStorage.removeItem('restExpiresAt')
        localStorage.removeItem('restTotal')
      } else {
        localStorage.setItem('restExpiresAt', (Date.now() + newSec * 1000).toString())
      }
      return newSec
    })
  }, [])

  const handleFinishEarly = useCallback(() => {
    if (!session) return
    setShowConfirmEarly(true)
  }, [session])

  const handleDone = useCallback((applySuggestions: boolean, customName?: string) => {
    if (!session || !finalLog) return
    const logToSave = customName ? { ...finalLog, planName: customName } : finalLog
    
    addLog(logToSave)
    logToSave.exercises.forEach((ex) => {
      if (!ex.skipped) updateProgressionAfterSession(ex)
    })

    if (applySuggestions) {
      const workoutStore = useWorkoutStore.getState()
      const plan = workoutStore.plans.find(p => p.id === session.workoutPlanId)
      if (plan) {
        const updatedExercises = plan.exercises.map(pe => {
          const logged = finalLog.exercises.find(le => le.exerciseId === pe.exerciseId)
          if (logged && !logged.skipped) {
            const nextPe = { ...pe, targetSets: pe.targetSets.map(ts => ({ ...ts })) }
            if (logged.suggestedNextWeight !== undefined) {
               nextPe.targetSets.forEach(ts => { if (ts.type === 'reps') ts.weight = logged.suggestedNextWeight })
            }
            if (logged.suggestedNextReps !== undefined) {
               nextPe.targetSets.forEach(ts => { if (ts.type === 'reps') ts.reps = logged.suggestedNextReps })
            }
            return nextPe
          }
          return pe
        })
        workoutStore.updatePlan(plan.id, { exercises: updatedExercises })
      }
    }

    // Mark scheduled workout as completed
    const scheduleStore = useScheduleStore.getState()
    const todayStr = finalLog.date
    // Find the first uncompleted scheduled workout for this plan on this date
    const matchedSchedule = scheduleStore.scheduledWorkouts.find(
      sw => sw.date === todayStr && sw.planId === finalLog.workoutPlanId && !sw.isCompleted
    )
    if (matchedSchedule) {
      scheduleStore.markAsCompleted(matchedSchedule.id)
    }

    if (finalLog.fullCompletion) {
      addXP(XP_REWARDS.FULL_SESSION_BONUS)
    }
    clearSession()
    localStorage.removeItem('restExpiresAt')
    localStorage.removeItem('restTotal')
    navigate('/')
  }, [session, finalLog, addLog, updateProgressionAfterSession, addXP, clearSession, navigate])

  // ── Render guard ──
  // Backward compatibility: clear invalid/old session schema
  if (session && session.exercises.some(ex => !ex.targetSets)) {
    setTimeout(() => {
      clearSession()
    }, 0)
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-4" style={{ background: '#0f0a28' }}>
        <p style={{ color: 'rgba(255,255,255,0.6)' }}>Sesja wygasła (stara wersja formatu). Wróć do strony głównej.</p>
        <button onClick={() => navigate('/')} style={{ color: '#818cf8' }} className="text-sm">
          ← Wróć do strony głównej
        </button>
      </div>
    )
  }

  if (!session) {
    return (
      <div
        className="min-h-dvh flex flex-col items-center justify-center gap-4"
        style={{ background: '#0f0a28' }}
      >
        <p style={{ color: 'rgba(255,255,255,0.6)' }}>Brak aktywnej sesji</p>
        <button
          onClick={() => navigate('/')}
          style={{ color: '#818cf8' }}
          className="text-sm"
        >
          ← Wróć do strony głównej
        </button>
      </div>
    )
  }

  const completedCount = session.exercises.filter((e) => e.status === 'completed').length

  const isResting = restActive && restSec > 0   // single source of truth

  return (
    <div
      className="relative flex flex-col h-dvh select-none"
      style={{
        background: 'linear-gradient(180deg, #0f0a28 0%, #12082a 100%)',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {/* Done screen overlay */}
      {isDone && (
        <DoneScreen
          planName={session.planName}
          log={finalLog}
          initialTotalXp={session.initialTotalXp}
          onClose={handleDone}
        />
      )}

      {/* Confirm Finish Early overlay */}
      {showConfirmEarly && !isDone && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center px-6 animate-fade-in"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
        >
          <div
            className="w-full max-w-sm rounded-3xl p-6 flex flex-col gap-5 text-center"
            style={{ background: 'var(--color-surface-800)', border: '1px solid var(--color-surface-600)' }}
          >
            <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(239, 68, 68, 0.15)' }}>
              <span className="text-xl">⚠️</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                Zakończyć wcześniej?
              </h3>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Czy na pewno chcesz przerwać trening? Niezrobione ćwiczenia zostaną pominięte.
              </p>
            </div>
            <div className="flex gap-3 mt-2">
              <button
                onClick={() => setShowConfirmEarly(false)}
                className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all active:scale-95"
                style={{ background: 'var(--color-surface-600)', color: 'var(--color-text-primary)' }}
              >
                Anuluj
              </button>
              <button
                onClick={() => {
                  setShowConfirmEarly(false)
                  markSessionDoneEarly()
                }}
                className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all active:scale-95"
                style={{ background: '#ef4444', color: '#fff' }}
              >
                Zakończ
              </button>
            </div>
          </div>
        </div>
      )}

      {isResting && restSec > 0 ? (
        <RestTimer
          seconds={restSec}
          totalSeconds={restTotal}
          onAdjust={handleAdjustRest}
          onSkip={handleSkipRest}
          exerciseName={session.exercises[session.currentExerciseIndex]?.exerciseName}
          setInfo={(() => {
            const ex = session.exercises[session.currentExerciseIndex]
            if (!ex) return undefined
            return `Seria ${ex.loggedSets.length} z ${ex.targetSets.length} zrobiona`
          })()}
          nextInfo={(() => {
            const ex = session.exercises[session.currentExerciseIndex]
            if (!ex) return undefined
            const isLastSetOfEx = ex.loggedSets.length >= ex.targetSets.length
            if (!isLastSetOfEx) {
              return `Seria ${ex.loggedSets.length + 1} — ${ex.exerciseName}`
            }
            // Find next pending exercise
            const nextEx = session.exercises.find(
              (e, i) => i > session.currentExerciseIndex && (e.status === 'pending' || e.status === 'active')
            )
            return nextEx ? nextEx.exerciseName : 'Ostatnia seria!'
          })()}
        />
      ) : (
        <>
          {/* ── TOP BAR ── */}
          <div className="flex items-center px-4 pt-4 pb-3 gap-3 z-10 flex-shrink-0">
            <button
              onClick={() => navigate('/')}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90"
              style={{ background: 'rgba(255,255,255,0.08)' }}
              aria-label="Zamknij sesję"
            >
              <X size={18} color="#fff" />
            </button>

            {/* Plan info */}
            <div className="flex-1 min-w-0">
              <p
                className="font-bold text-sm truncate"
                style={{ fontFamily: 'var(--font-display)', color: '#fff' }}
              >
                {session.planName}
              </p>
              <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
                {session.viewIndex + 1}/{session.exercises.length} ćwiczeń
              </p>
            </div>

            {/* Stats chips */}
            <div className="flex items-center gap-2">
              {session.isCustom && (
                <button
                  onClick={() => setShowExercisePicker(true)}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90"
                  style={{ background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.3)' }}
                  aria-label="Dodaj ćwiczenie"
                >
                  <Plus size={16} style={{ color: '#34d399' }} />
                </button>
              )}
              {session.totalXpThisSession > 0 && (
                <div
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full"
                  style={{ background: 'rgba(129,140,248,0.2)', border: '1px solid rgba(129,140,248,0.3)' }}
                >
                  <Zap size={11} style={{ color: '#818cf8' }} />
                  <span className="text-[11px] font-bold" style={{ color: '#818cf8' }}>
                    {session.totalXpThisSession}
                  </span>
                </div>
              )}
              <div
                className="flex items-center gap-1 px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
              >
                <Clock size={11} style={{ color: 'rgba(255,255,255,0.6)' }} />
                <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  {formatDuration(elapsedSec)}
                </span>
              </div>
            </div>
          </div>

          {/* ── NAVIGATION & PROGRESS DOTS ── */}
          <div className="flex items-center justify-between px-6 pb-3 flex-shrink-0">
            <button
              onClick={() => setViewIndex(Math.max(0, session.viewIndex - 1))}
              disabled={session.viewIndex === 0}
              className="w-10 h-10 flex items-center justify-center rounded-full transition-all active:scale-90 disabled:opacity-30 disabled:active:scale-100"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
              aria-label="Poprzednie ćwiczenie"
            >
              <ChevronLeft size={20} color="#fff" />
            </button>

            <div className="flex items-center justify-center gap-1.5">
              {session.exercises.map((ex, i) => {
                const isView = i === session.viewIndex
                let bg = 'rgba(255,255,255,0.2)'
                if (ex.status === 'completed') bg = ex.success ? '#22c55e' : '#ef4444'
                else if (ex.status === 'skipped') bg = 'rgba(255,255,255,0.15)'
                else if (i === session.currentExerciseIndex) bg = '#818cf8'

                return (
                  <div
                    key={i}
                    style={{
                      width: isView ? 20 : 6,
                      height: 6,
                      borderRadius: 3,
                      background: bg,
                      transition: 'all 0.3s ease',
                      opacity: isView ? 1 : 0.7,
                    }}
                  />
                )
              })}
            </div>

            <button
              onClick={() => setViewIndex(Math.min(session.exercises.length - 1, session.viewIndex + 1))}
              disabled={session.viewIndex === session.exercises.length - 1}
              className="w-10 h-10 flex items-center justify-center rounded-full transition-all active:scale-90 disabled:opacity-30 disabled:active:scale-100"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
              aria-label="Następne ćwiczenie"
            >
              <ChevronRight size={20} color="#fff" />
            </button>
          </div>

          {/* Custom mode: empty state */}
          {session.isCustom && session.exercises.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-5 px-8">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(5,150,105,0.1))', border: '1px solid rgba(16,185,129,0.3)' }}
              >
                <Shuffle size={36} style={{ color: '#34d399' }} />
              </div>
              <div className="text-center">
                <p className="font-bold text-lg text-white" style={{ fontFamily: 'var(--font-display)' }}>Trening własny</p>
                <p className="text-sm mt-2" style={{ color: 'rgba(255,255,255,0.5)' }}>Dodaj pierwsze ćwiczenie, żeby zacząć</p>
              </div>
              <button
                onClick={() => setShowExercisePicker(true)}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all active:scale-95"
                style={{ background: 'linear-gradient(135deg, #059669, #10b981)', color: '#fff', boxShadow: '0 4px 20px rgba(16,185,129,0.35)' }}
              >
                <Plus size={18} />
                Dodaj ćwiczenie
              </button>
            </div>
          ) : (
            <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
              {/* ── CAROUSEL ── */}
              <Carousel
                exercises={session.exercises}
                viewIndex={session.viewIndex}
                isResting={isResting && restSec > 0}
                onUpdateWeight={handleUpdateWeight}
                onUpdateReps={handleUpdateReps}
                onUpdateTime={handleUpdateTime}
                onUpdateSets={handleUpdateSets}
                onLogSet={() => handleLogSet(session.viewIndex)}
                onNextExercise={() => advanceToNextExercise(session.viewIndex)}
                onSwipePrev={() => {
                  if (session.viewIndex > 0) setViewIndex(session.viewIndex - 1)
                }}
                onSwipeNext={() => {
                  if (session.viewIndex < session.exercises.length - 1) setViewIndex(session.viewIndex + 1)
                }}
                isCustomSession={session.isCustom}
                onAddExercise={() => setShowExercisePicker(true)}
              />
            </div>
          )}

          {/* ── BOTTOM BAR ── */}
          {!isResting && !isDone && (
            <div
              className="flex-shrink-0 flex items-center justify-between px-4 py-3"
              style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
            >
              <button
                onClick={handleFinishEarly}
                className="text-sm font-medium transition-all"
                style={{ color: 'rgba(255,255,255,0.35)' }}
              >
                Zakończ wcześniej
              </button>

              <div className="flex items-center gap-1">
                <Trophy size={13} style={{ color: '#fbbf24' }} />
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  {completedCount}/{session.exercises.length}
                </span>
              </div>
            </div>
          )}
        </>
      )}

      {/* Exercise picker modal (custom session) */}
      {session.isCustom && (
        <ExercisePicker
          isOpen={showExercisePicker}
          onClose={() => setShowExercisePicker(false)}
          onSelect={(ex: Exercise) => {
            addExerciseToSession(ex)
            setShowExercisePicker(false)
          }}
          existingIds={session.exercises.map(e => e.exerciseId)}
        />
      )}
    </div>
  )
}
