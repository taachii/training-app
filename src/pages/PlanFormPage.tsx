import { useState, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save, Plus, Dumbbell } from 'lucide-react'
import type { PlanExercise, WorkoutPlan } from '@/types/workout'
import type { Exercise } from '@/types/exercise'
import { useWorkoutStore } from '@/store/useWorkoutStore'
import ExercisePicker from '@/components/workouts/ExercisePicker'
import PlanExerciseRow, { type PlanExerciseRowData } from '@/components/workouts/PlanExerciseRow'
import { PLAN_ICONS } from '@/lib/muscleGroups'

// ─────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────

function makeId() {
  return `plan_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

function exerciseToPlanItem(ex: Exercise, order: number): PlanExercise {
  return {
    exerciseId: ex.id,
    order,
    sets: ex.defaultSets,
    reps: ex.defaultReps,
    weight: ex.defaultWeight ?? 0,
    restSeconds: ex.defaultRestSeconds,
  }
}

// ─────────────────────────────────────────────
// PLAN FORM PAGE
// ─────────────────────────────────────────────

export default function PlanFormPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id?: string }>()
  const isEdit = Boolean(id)

  const { plans, exercises, addPlan, updatePlan } = useWorkoutStore()
  const existingPlan = id ? plans.find((p) => p.id === id) : undefined

  // ── Local form state ──────────────────────────────────────────────────

  const [name, setName] = useState(existingPlan?.name ?? '')
  const [icon, setIcon] = useState(existingPlan?.icon ?? '💪')
  const [pickerOpen, setPickerOpen] = useState(false)

  // Enrich exercises with resolved Exercise object for display
  const [rows, setRows] = useState<PlanExerciseRowData[]>(() => {
    const planExercises = existingPlan?.exercises ?? []
    return planExercises.map((pe) => {
      const ex = exercises.find((e) => e.id === pe.exerciseId)!
      return { ...pe, exercise: ex }
    })
  })

  // ── Derived data ──────────────────────────────────────────────────────

  const existingIds = useMemo(() => rows.map((r) => r.exerciseId), [rows])

  const canSave = name.trim().length > 0 && rows.length > 0

  // ── Row operations ────────────────────────────────────────────────────

  const addExercise = (ex: Exercise) => {
    const newRow: PlanExerciseRowData = {
      ...exerciseToPlanItem(ex, rows.length),
      exercise: ex,
    }
    setRows((prev) => [...prev, newRow])
  }

  const updateRow = (index: number, updated: PlanExerciseRowData) => {
    setRows((prev) => prev.map((r, i) => (i === index ? updated : r)))
  }

  const deleteRow = (index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index).map((r, i) => ({ ...r, order: i })))
  }

  const moveRow = (index: number, direction: -1 | 1) => {
    const next = index + direction
    if (next < 0 || next >= rows.length) return
    setRows((prev) => {
      const arr = [...prev]
      ;[arr[index], arr[next]] = [arr[next], arr[index]]
      return arr.map((r, i) => ({ ...r, order: i }))
    })
  }

  // ── Save ──────────────────────────────────────────────────────────────

  const handleSave = () => {
    if (!canSave) return

    const planExercises: PlanExercise[] = rows.map(({ exercise: _ex, ...pe }, i) => ({
      ...pe,
      order: i,
    }))

    if (isEdit && id) {
      updatePlan(id, { name: name.trim(), icon, exercises: planExercises })
    } else {
      const plan: WorkoutPlan = {
        id: makeId(),
        name: name.trim(),
        icon,
        exercises: planExercises,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      addPlan(plan)
    }

    navigate('/plans')
  }

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────

  return (
    <div
      className="flex flex-col min-h-dvh"
      style={{ background: 'var(--color-surface-900)' }}
    >
      {/* ── TOP BAR ── */}
      <header
        className="sticky top-0 z-30 flex items-center gap-3 px-4 py-3"
        style={{
          background: 'color-mix(in srgb, var(--color-surface-900) 85%, transparent)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--color-surface-700)',
        }}
      >
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 flex items-center justify-center rounded-xl transition-all active:scale-90"
          style={{ background: 'var(--color-surface-700)' }}
          aria-label="Cofnij"
        >
          <ArrowLeft size={18} style={{ color: 'var(--color-text-secondary)' }} />
        </button>

        <h1
          className="flex-1 text-lg font-bold"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}
        >
          {isEdit ? 'Edytuj plan' : 'Nowy plan'}
        </h1>

        <button
          onClick={handleSave}
          disabled={!canSave}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all active:scale-95 disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg, #4338ca, #7c3aed)', color: '#fff' }}
          aria-label="Zapisz plan"
        >
          <Save size={15} />
          Zapisz
        </button>
      </header>

      {/* ── FORM BODY ── */}
      <div className="flex flex-col gap-5 px-4 py-5 flex-1">

        {/* ── Name + Icon ── */}
        <div
          className="rounded-2xl p-4 flex flex-col gap-4 animate-fade-in-up"
          style={{ background: 'var(--color-surface-800)', border: '1px solid var(--color-surface-600)' }}
        >
          {/* Name input */}
          <div>
            <label
              htmlFor="plan-name"
              className="text-xs font-semibold uppercase tracking-wide mb-2 block"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Nazwa planu
            </label>
            <input
              id="plan-name"
              placeholder="np. Górna partia A, Nogi, Full Body…"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl px-4 py-3 text-base font-semibold outline-none transition-all"
              style={{
                background: 'var(--color-surface-700)',
                border: '1px solid var(--color-surface-500)',
                color: 'var(--color-text-primary)',
              }}
              maxLength={40}
            />
          </div>

          {/* Icon picker */}
          <div>
            <p
              className="text-xs font-semibold uppercase tracking-wide mb-2"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Ikona
            </p>
            <div className="flex gap-2 flex-wrap">
              {PLAN_ICONS.map((em) => (
                <button
                  key={em}
                  onClick={() => setIcon(em)}
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all active:scale-90"
                  style={{
                    background: icon === em
                      ? 'color-mix(in srgb, #6366f1 25%, transparent)'
                      : 'var(--color-surface-700)',
                    border: `1px solid ${icon === em ? '#6366f1' : 'var(--color-surface-500)'}`,
                  }}
                  aria-label={`Ikona ${em}`}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Exercise list ── */}
        <div className="flex flex-col gap-3 animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
          <div className="flex items-center justify-between">
            <h2
              className="text-sm font-semibold uppercase tracking-wide"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Ćwiczenia ({rows.length})
            </h2>
          </div>

          {/* Empty state */}
          {rows.length === 0 && (
            <div
              className="rounded-2xl p-8 flex flex-col items-center gap-3"
              style={{
                background: 'var(--color-surface-800)',
                border: '1px dashed var(--color-surface-500)',
              }}
            >
              <Dumbbell size={28} style={{ color: 'var(--color-text-muted)' }} />
              <p className="text-sm text-center" style={{ color: 'var(--color-text-muted)' }}>
                Dodaj co najmniej jedno ćwiczenie
              </p>
            </div>
          )}

          {/* Exercise rows */}
          {rows.map((row, i) => (
            <div key={row.exerciseId + i} className="animate-fade-in-up" style={{ animationDelay: `${i * 0.03}s` }}>
              <PlanExerciseRow
                data={row}
                index={i}
                total={rows.length}
                onChange={(updated) => updateRow(i, updated)}
                onDelete={() => deleteRow(i)}
                onMoveUp={() => moveRow(i, -1)}
                onMoveDown={() => moveRow(i, 1)}
              />
            </div>
          ))}

          {/* Add exercise button */}
          <button
            onClick={() => setPickerOpen(true)}
            className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl text-sm font-semibold transition-all active:scale-[0.98]"
            style={{
              background: 'color-mix(in srgb, #6366f1 10%, transparent)',
              border: '1px dashed color-mix(in srgb, #6366f1 40%, transparent)',
              color: '#818cf8',
            }}
            aria-label="Dodaj ćwiczenie"
          >
            <Plus size={18} />
            Dodaj ćwiczenie
          </button>
        </div>

        {/* Bottom note about progression */}
        {rows.length > 0 && (
          <div
            className="rounded-2xl p-4 animate-fade-in-up"
            style={{
              background: 'color-mix(in srgb, #6366f1 8%, transparent)',
              border: '1px solid color-mix(in srgb, #6366f1 20%, transparent)',
              animationDelay: '0.1s',
            }}
          >
            <p className="text-xs leading-relaxed" style={{ color: '#a5b4fc' }}>
              💡 <strong>Ciężary to sugestie startowe.</strong> W trakcie sesji możesz edytować każde powtórzenie i ciężar inline — algorytm progresji uczy się z Twoich rzeczywistych wyników.
            </p>
          </div>
        )}
      </div>

      {/* ── EXERCISE PICKER ── */}
      <ExercisePicker
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={addExercise}
        existingIds={existingIds}
      />
    </div>
  )
}
