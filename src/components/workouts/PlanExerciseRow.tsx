import { useState } from 'react'
import { Trash2, ChevronUp, ChevronDown, Clock, Minus, Plus, Settings2, Link } from 'lucide-react'
import type { Exercise } from '@/types/exercise'
import type { PlanExercise, TargetSet } from '@/types/workout'
import { MUSCLE_GROUP_META, CATEGORY_META, REST_PRESETS, formatRest } from '@/lib/muscleGroups'

// ─────────────────────────────────────────────
// NUMERIC STEPPER
// ─────────────────────────────────────────────

interface StepperProps {
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  step?: number
  label?: string
  unit?: string
  decimals?: number
}

function Stepper({ value, onChange, min = 0, max = 999, step = 1, label, unit, decimals = 0 }: StepperProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      {label && (
        <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
          {label}
        </p>
      )}
      <div className="flex items-center gap-0">
        <button
          onClick={() => onChange(Math.max(min, Math.round((value - step) * 10) / 10))}
          className="w-8 h-8 flex items-center justify-center rounded-l-xl transition-all active:scale-90"
          style={{ background: 'var(--color-surface-600)' }}
          aria-label={`Zmniejsz ${label}`}
        >
          <Minus size={12} style={{ color: 'var(--color-text-secondary)' }} />
        </button>
        <div
          className="h-8 px-2 flex items-center justify-center min-w-[2.75rem] text-sm font-bold"
          style={{ background: 'var(--color-surface-700)', color: 'var(--color-text-primary)' }}
        >
          {decimals > 0 ? value.toFixed(decimals) : value}
          {unit && <span className="ml-0.5 text-xs font-normal" style={{ color: 'var(--color-text-muted)' }}>{unit}</span>}
        </div>
        <button
          onClick={() => onChange(Math.min(max, Math.round((value + step) * 10) / 10))}
          className="w-8 h-8 flex items-center justify-center rounded-r-xl transition-all active:scale-90"
          style={{ background: 'var(--color-surface-600)' }}
          aria-label={`Zwiększ ${label}`}
        >
          <Plus size={12} style={{ color: 'var(--color-text-secondary)' }} />
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// REST SELECTOR
// ─────────────────────────────────────────────

interface RestSelectorProps {
  value: number
  onChange: (v: number) => void
}

function RestSelector({ value, onChange }: RestSelectorProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
        Przerwa
      </p>
      <div className="flex gap-1.5 flex-wrap">
        {REST_PRESETS.map((preset) => (
          <button
            key={preset.value}
            onClick={() => onChange(preset.value)}
            className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
            style={{
              background: value === preset.value
                ? 'color-mix(in srgb, #6366f1 25%, transparent)'
                : 'var(--color-surface-600)',
              border: `1px solid ${value === preset.value ? '#6366f1' : 'transparent'}`,
              color: value === preset.value ? '#818cf8' : 'var(--color-text-secondary)',
            }}
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// PLAN EXERCISE ROW
// ─────────────────────────────────────────────

export interface PlanExerciseRowData extends PlanExercise {
  /** Resolved exercise object */
  exercise: Exercise
}

interface PlanExerciseRowProps {
  data: PlanExerciseRowData
  index: number
  total: number
  hasSupersetWithPrev: boolean
  hasSupersetWithNext?: boolean
  onChange: (updated: PlanExerciseRowData) => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onToggleSuperset: () => void
}

export default function PlanExerciseRow({
  data,
  index,
  total,
  hasSupersetWithPrev,
  hasSupersetWithNext,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
  onToggleSuperset,
}: PlanExerciseRowProps) {
  const [expanded, setExpanded] = useState(false)
  const { exercise, isAdvanced } = data
  const primaryMeta = MUSCLE_GROUP_META[exercise.primaryMuscleGroup]
  const isBodyweight = exercise.category === 'bodyweight'
  const isCardio = exercise.category === 'cardio'
  const isTimeBasedExercise = isCardio || exercise.type === 'time'
  
  const targetSets = data.targetSets || Array.from({ length: (data as any).sets || 3 }).map(() => ({
    type: isTimeBasedExercise ? 'time' : 'reps',
    reps: (data as any).reps || 0,
    weight: (data as any).weight || 0,
    timeSeconds: (data as any).timeSeconds || 60
  })) as TargetSet[]
  
  const setsCount = targetSets.length
  const firstSet = targetSets[0] || { type: isTimeBasedExercise ? 'time' : 'reps', reps: 0, weight: 0, timeSeconds: 60 }
  
  const isPureBodyweight = isBodyweight && !['weighted_pull_up', 'weighted_chin_up', 'weighted_dip'].includes(exercise.id)

  const defaultProgType = isPureBodyweight ? 'reps' : 'weight'
  const progType = data.progressionType ?? defaultProgType
  const defaultProgStep = progType === 'reps' ? 1 : 2.5
  const progStep = data.progressionStep ?? defaultProgStep

  const update = (patch: Partial<PlanExercise>) =>
    onChange({ ...data, ...patch })

  const updateSet = (setIndex: number, patch: Partial<TargetSet>) => {
    const newSets = [...targetSets]
    newSets[setIndex] = { ...newSets[setIndex], ...patch }
    update({ targetSets: newSets })
  }

  // Helpers for Simple Mode
  // Helpers for Simple Mode
  
  const handleGlobalSetsChange = (v: number) => {
    if (v < setsCount) {
      update({ targetSets: targetSets.slice(0, v) })
    } else if (v > setsCount) {
      const diff = v - setsCount
      const lastSet = targetSets[setsCount - 1] || firstSet
      const newSets = Array.from({ length: diff }).map(() => ({ ...lastSet }))
      update({ targetSets: [...targetSets, ...newSets] })
    }
  }

  const handleGlobalRepsChange = (v: number) => {
    update({ targetSets: targetSets.map(s => ({ ...s, reps: v })) })
  }

  const handleGlobalWeightChange = (v: number) => {
    update({ targetSets: targetSets.map(s => ({ ...s, weight: v })) })
  }

  const handleGlobalTimeChange = (v: number) => {
    update({ targetSets: targetSets.map(s => ({ ...s, timeSeconds: v })) })
  }

  const isVaried = targetSets.some(s => s.reps !== firstSet.reps || s.weight !== firstSet.weight || s.timeSeconds !== firstSet.timeSeconds)

  let summaryLabel = ''
  if (isTimeBasedExercise) {
    summaryLabel = isVaried ? `${setsCount} serii (zmienne)` : `${setsCount}× ${firstSet.timeSeconds}s`
  } else {
    summaryLabel = isPureBodyweight
      ? (isVaried ? `${setsCount} serii (zmienne)` : `${setsCount}×${firstSet.reps}`)
      : (isVaried ? `${setsCount} serii (zmienne)` : `${setsCount}×${firstSet.reps} @ ${firstSet.weight}kg`)
  }

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all relative"
      style={{ 
        background: 'var(--color-surface-700)', 
        border: '1px solid var(--color-surface-600)',
        borderTopWidth: hasSupersetWithPrev ? '0px' : '1px',
        borderTopLeftRadius: hasSupersetWithPrev ? '0' : '1rem',
        borderTopRightRadius: hasSupersetWithPrev ? '0' : '1rem',
        borderBottomLeftRadius: hasSupersetWithNext ? '0' : '1rem',
        borderBottomRightRadius: hasSupersetWithNext ? '0' : '1rem',
        marginTop: hasSupersetWithPrev ? '-12px' : '0'
      }}
    >
      {/* Superset indicator bar */}
      {(hasSupersetWithPrev || hasSupersetWithNext) && (
        <div 
          className="absolute left-0 top-0 bottom-0 w-1.5"
          style={{ background: '#818cf8' }}
        />
      )}

      {/* Row header */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="flex items-center gap-3 w-full px-4 py-3 text-left"
      >
        {/* Position badge */}
        <div
          className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
          style={{ background: 'var(--color-surface-600)', color: 'var(--color-text-muted)' }}
        >
          {index + 1}
        </div>

        {/* Category icon + name */}
        <span className="text-base flex-shrink-0">{CATEGORY_META[exercise.category].icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
            {exercise.name}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-md font-medium"
              style={{ background: primaryMeta.color + '22', color: primaryMeta.color }}
            >
              {primaryMeta.shortLabel}
            </span>
            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {summaryLabel}
            </span>
            <span className="flex items-center gap-0.5 text-xs" style={{ color: 'var(--color-text-muted)' }}>
              <Clock size={10} />
              {formatRest(data.restSeconds)}
            </span>
          </div>
        </div>

        {/* Expand chevron */}
        <span style={{ color: 'var(--color-text-muted)', flexShrink: 0 }}>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>

      {/* Expanded controls */}
      {expanded && (
        <div className="px-4 pb-4 flex flex-col gap-4" style={{ borderTop: '1px solid var(--color-surface-600)' }}>
          
          {/* Advanced toggle */}
          <div className="flex justify-end pt-3">
             <button 
                onClick={() => update({ isAdvanced: !isAdvanced })}
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
                style={{ 
                  background: isAdvanced ? 'color-mix(in srgb, #6366f1 20%, transparent)' : 'var(--color-surface-600)',
                  color: isAdvanced ? '#818cf8' : 'var(--color-text-muted)'
                }}
             >
                <Settings2 size={14} />
                {isAdvanced ? 'Tryb zaawansowany' : 'Tryb prosty'}
             </button>
          </div>

          {!isAdvanced ? (
            /* Simple Steppers row */
            <div className="flex items-start justify-around">
              <Stepper
                label="Serie"
                value={setsCount}
                onChange={handleGlobalSetsChange}
                min={1}
                max={20}
              />
              {isTimeBasedExercise ? (
                <Stepper
                  label="Czas (s)"
                  value={firstSet.timeSeconds ?? 60}
                  onChange={handleGlobalTimeChange}
                  min={5}
                  max={3600}
                  step={5}
                />
              ) : (
                <>
                  <Stepper
                    label="Powt."
                    value={firstSet.reps ?? 0}
                    onChange={handleGlobalRepsChange}
                    min={1}
                    max={100}
                  />
                  {!isPureBodyweight && (
                    <div className="flex flex-col items-center gap-1">
                      <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
                        Ciężar
                      </p>
                      <div className="relative flex items-center">
                        <input
                          type="number"
                          min={0}
                          max={999}
                          step={0.25}
                          value={firstSet.weight === 0 ? '' : firstSet.weight}
                          onChange={(e) => {
                            const val = e.target.value
                            handleGlobalWeightChange(val === '' ? 0 : (parseFloat(val) || 0))
                          }}
                          className="h-8 w-20 rounded-xl text-center text-sm font-bold outline-none"
                          style={{ background: 'var(--color-surface-700)', color: 'var(--color-text-primary)', paddingRight: '18px' }}
                          placeholder="0"
                        />
                        <span className="absolute right-2.5 text-[10px] font-semibold pointer-events-none" style={{ color: 'var(--color-text-muted)' }}>
                          kg
                        </span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            /* Advanced Mode: List of Sets */
            <div className="flex flex-col gap-2">
               {targetSets.map((set, sIdx) => (
                  <div key={sIdx} className="flex items-center gap-3 p-2 rounded-xl" style={{ background: 'var(--color-surface-600)' }}>
                     <div className="w-6 h-6 flex items-center justify-center rounded-md bg-surface-700 text-xs font-bold text-text-muted">
                        {sIdx + 1}
                     </div>
                     
                     <div className="flex-1 flex gap-2 items-center">
                        <div className="text-xs font-semibold px-1 w-[80px] text-center text-indigo-400">
                          {isTimeBasedExercise ? 'Czas' : 'Powt.'}
                        </div>

                        {isTimeBasedExercise ? (
                          <div className="flex items-center gap-1 bg-surface-700 px-2 rounded-lg h-8">
                             <input 
                               type="number" 
                               value={set.timeSeconds ?? 0}
                               onChange={(e) => updateSet(sIdx, { timeSeconds: parseInt(e.target.value) || 0 })}
                               className="w-12 bg-transparent text-center text-sm font-bold outline-none"
                             />
                             <span className="text-[10px] text-text-muted">s</span>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-1 bg-surface-700 px-2 rounded-lg h-8">
                               <input 
                                 type="number" 
                                 value={set.reps ?? 0}
                                 onChange={(e) => updateSet(sIdx, { reps: parseInt(e.target.value) || 0 })}
                                 className="w-10 bg-transparent text-center text-sm font-bold outline-none"
                               />
                               <span className="text-[10px] text-text-muted">x</span>
                            </div>
                            {!isPureBodyweight && (
                              <div className="flex items-center gap-1 bg-surface-700 px-2 rounded-lg h-8">
                                 <input 
                                   type="number" 
                                   value={set.weight === 0 ? '' : set.weight}
                                   onChange={(e) => updateSet(sIdx, { weight: parseFloat(e.target.value) || 0 })}
                                   className="w-12 bg-transparent text-center text-sm font-bold outline-none"
                                   placeholder="0"
                                 />
                                 <span className="text-[10px] text-text-muted">kg</span>
                              </div>
                            )}
                          </>
                        )}
                     </div>

                     <button 
                       onClick={() => update({ targetSets: targetSets.filter((_, i) => i !== sIdx) })}
                       disabled={targetSets.length === 1}
                       className="w-8 h-8 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-400/10 disabled:opacity-30"
                     >
                       <Trash2 size={14} />
                     </button>
                  </div>
               ))}
               <button 
                 onClick={() => update({ targetSets: [...targetSets, { ...targetSets[targetSets.length - 1] }] })}
                 className="mt-2 py-2 w-full flex items-center justify-center gap-2 text-xs font-bold rounded-xl border border-dashed border-surface-500 text-text-secondary hover:bg-surface-600 transition-all"
               >
                 <Plus size={14} /> Dodaj serię
               </button>
            </div>
          )}

          {/* Rest selector */}
          <RestSelector value={data.restSeconds} onChange={(v) => update({ restSeconds: v })} />

          {/* Progression Overload UI */}
          <div className="flex flex-col gap-1.5 pt-3" style={{ borderTop: '1px solid var(--color-surface-600)' }}>
            <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
              Progresja
            </p>
            <div className="flex items-center gap-4">
              <select
                value={progType}
                onChange={(e) => update({ progressionType: e.target.value as any })}
                className="h-8 px-2 rounded-xl text-sm font-medium outline-none cursor-pointer"
                style={{ background: 'var(--color-surface-700)', color: 'var(--color-text-primary)' }}
              >
                <option value="weight">Ciężar</option>
                <option value="reps">Powtórzenia</option>
                <option value="none">Brak</option>
              </select>
              
              {progType !== 'none' && (
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Krok:</span>
                  <input
                    type="number"
                    min={0.1}
                    step={progType === 'reps' ? 1 : 0.25}
                    value={progStep}
                    onChange={(e) => update({ progressionStep: parseFloat(e.target.value) || 0 })}
                    className="h-8 w-16 rounded-xl text-center text-sm font-bold outline-none"
                    style={{ background: 'var(--color-surface-700)', color: 'var(--color-text-primary)' }}
                  />
                  <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                    {progType === 'weight' ? 'kg' : 'powt.'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 pt-1">
            {/* Reorder */}
            <button
              onClick={onMoveUp}
              disabled={index === 0}
              className="flex items-center justify-center w-9 h-9 rounded-xl transition-all active:scale-90 disabled:opacity-30"
              style={{ background: 'var(--color-surface-600)' }}
              aria-label="Przenieś wyżej"
            >
              <ChevronUp size={16} style={{ color: 'var(--color-text-secondary)' }} />
            </button>
            <button
              onClick={onMoveDown}
              disabled={index === total - 1}
              className="flex items-center justify-center w-9 h-9 rounded-xl transition-all active:scale-90 disabled:opacity-30"
              style={{ background: 'var(--color-surface-600)' }}
              aria-label="Przenieś niżej"
            >
              <ChevronDown size={16} style={{ color: 'var(--color-text-secondary)' }} />
            </button>

            {/* Superset Toggle */}
            {index > 0 && (
              <button
                onClick={onToggleSuperset}
                className="flex items-center gap-1.5 px-3 h-9 rounded-xl text-xs font-semibold transition-all active:scale-90"
                style={{ 
                  background: hasSupersetWithPrev ? 'color-mix(in srgb, #6366f1 15%, transparent)' : 'var(--color-surface-600)',
                  color: hasSupersetWithPrev ? '#818cf8' : 'var(--color-text-secondary)',
                  border: `1px solid ${hasSupersetWithPrev ? 'color-mix(in srgb, #6366f1 30%, transparent)' : 'transparent'}`
                }}
              >
                <Link size={13} />
                {hasSupersetWithPrev ? 'W superserii' : 'Złącz z poprzednim'}
              </button>
            )}

            <div className="flex-1" />

            {/* Delete */}
            <button
              onClick={onDelete}
              className="flex items-center gap-1.5 px-3 h-9 rounded-xl text-xs font-semibold transition-all active:scale-90"
              style={{
                background: 'color-mix(in srgb, #ef4444 12%, transparent)',
                border: '1px solid color-mix(in srgb, #ef4444 25%, transparent)',
                color: '#f87171',
              }}
              aria-label="Usuń ćwiczenie"
            >
              <Trash2 size={13} />
              Usuń
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
