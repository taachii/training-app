import { useState } from 'react'
import { Trash2, ChevronUp, ChevronDown, Clock, Minus, Plus } from 'lucide-react'
import type { Exercise } from '@/types/exercise'
import type { PlanExercise } from '@/types/workout'
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
  onChange: (updated: PlanExerciseRowData) => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}

export default function PlanExerciseRow({
  data,
  index,
  total,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
}: PlanExerciseRowProps) {
  const [expanded, setExpanded] = useState(true)
  const { exercise } = data
  const primaryMeta = MUSCLE_GROUP_META[exercise.primaryMuscleGroup]
  const isBodyweight = exercise.category === 'bodyweight'

  const update = (patch: Partial<PlanExercise>) =>
    onChange({ ...data, ...patch })

  const summaryLabel = isBodyweight
    ? `${data.sets}×${data.reps}`
    : `${data.sets}×${data.reps} @ ${data.weight}kg`

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all"
      style={{ background: 'var(--color-surface-700)', border: '1px solid var(--color-surface-600)' }}
    >
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
          {/* Steppers row */}
          <div className="flex items-start justify-around pt-4">
            <Stepper
              label="Serie"
              value={data.sets}
              onChange={(v) => update({ sets: v })}
              min={1}
              max={20}
            />
            <Stepper
              label="Powt."
              value={data.reps}
              onChange={(v) => update({ reps: v })}
              min={1}
              max={100}
            />
            {!isBodyweight && (
              <Stepper
                label="Ciężar"
                unit="kg"
                value={data.weight}
                onChange={(v) => update({ weight: v })}
                min={0}
                max={500}
                step={2.5}
                decimals={1}
              />
            )}
          </div>

          {/* Rest selector */}
          <RestSelector value={data.restSeconds} onChange={(v) => update({ restSeconds: v })} />

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
