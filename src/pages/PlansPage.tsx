import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Dumbbell, ChevronRight, Trash2, MoreVertical } from 'lucide-react'
import { useWorkoutStore } from '@/store/useWorkoutStore'
import { MUSCLE_GROUP_META } from '@/lib/muscleGroups'
import type { MuscleGroup } from '@/types/exercise'
import type { WorkoutPlan } from '@/types/workout'
import { useSessionStore } from '@/store/useSessionStore'

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

/** Collect unique primary muscle groups from a plan's exercises */
function getPlanMuscles(plan: WorkoutPlan, exerciseMap: Map<string, MuscleGroup>): MuscleGroup[] {
  const seen = new Set<MuscleGroup>()
  for (const pe of plan.exercises) {
    const mg = exerciseMap.get(pe.exerciseId)
    if (mg) seen.add(mg)
  }
  return [...seen].slice(0, 4)
}

// ─────────────────────────────────────────────
// PLAN CARD
// ─────────────────────────────────────────────

interface PlanCardProps {
  plan: WorkoutPlan
  muscles: MuscleGroup[]
  isActive: boolean
  onEdit: () => void
  onDelete: () => void
}

function PlanCard({ plan, muscles, isActive, onEdit, onDelete }: PlanCardProps) {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all animate-fade-in-up"
      style={{ background: 'var(--color-surface-800)', border: '1px solid var(--color-surface-600)' }}
    >
      {/* Main row */}
      <button
        onClick={() => navigate(`/plans/${plan.id}/edit`)}
        className="flex items-center gap-3 w-full px-4 py-4 text-left transition-all active:bg-surface-700"
      >
        {/* Icon */}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 shadow-lg"
          style={{
            background: 'linear-gradient(135deg, var(--color-surface-600), var(--color-surface-500))',
          }}
        >
          {plan.icon ?? '💪'}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p
            className="font-bold text-base truncate"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}
          >
            {plan.name}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            {plan.exercises.length} {plan.exercises.length === 1 ? 'ćwiczenie' : plan.exercises.length < 5 ? 'ćwiczenia' : 'ćwiczeń'}
          </p>
          {/* Muscle group badges */}
          {muscles.length > 0 && (
            <div className="flex gap-1 mt-1.5 flex-wrap">
              {muscles.map((mg) => {
                const meta = MUSCLE_GROUP_META[mg]
                return (
                  <span
                    key={mg}
                    className="text-[10px] px-1.5 py-0.5 rounded-md font-medium"
                    style={{ background: meta.color + '22', color: meta.color }}
                  >
                    {meta.shortLabel}
                  </span>
                )
              })}
            </div>
          )}
        </div>

        <ChevronRight size={16} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
      </button>

      {/* Action footer */}
      <div
        className="flex items-center gap-2 px-4 py-2"
        style={{ borderTop: '1px solid var(--color-surface-600)' }}
      >
        {/* Start workout */}
        <button
          onClick={() => navigate(`/session/start/${plan.id}`)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold transition-all active:scale-95"
          style={{
            background: 'linear-gradient(135deg, #4338ca, #7c3aed)',
            color: '#fff',
            boxShadow: '0 4px 16px color-mix(in srgb, #6366f1 30%, transparent)',
          }}
          aria-label={`${isActive ? 'Kontynuuj' : 'Rozpocznij'} ${plan.name}`}
        >
          <Dumbbell size={15} />
          {isActive ? 'Kontynuuj' : 'Rozpocznij'}
        </button>

        {/* Context menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="w-9 h-9 flex items-center justify-center rounded-xl transition-all active:scale-90"
            style={{ background: 'var(--color-surface-700)' }}
            aria-label="Opcje"
          >
            <MoreVertical size={16} style={{ color: 'var(--color-text-secondary)' }} />
          </button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
              />
              <div
                className="absolute right-0 bottom-full mb-1 z-20 rounded-xl overflow-hidden shadow-xl"
                style={{
                  background: 'var(--color-surface-700)',
                  border: '1px solid var(--color-surface-500)',
                  minWidth: '140px',
                }}
              >
                <button
                  onClick={() => { onEdit(); setMenuOpen(false) }}
                  className="flex items-center gap-2 px-4 py-3 w-full text-left text-sm transition-all"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  ✏️ Edytuj plan
                </button>
                <button
                  onClick={() => { onDelete(); setMenuOpen(false) }}
                  className="flex items-center gap-2 px-4 py-3 w-full text-left text-sm transition-all"
                  style={{ color: '#f87171', borderTop: '1px solid var(--color-surface-600)' }}
                >
                  <Trash2 size={14} />
                  Usuń plan
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// PLANS PAGE
// ─────────────────────────────────────────────

export default function PlansPage() {
  const navigate = useNavigate()
  const { plans, exercises, deletePlan } = useWorkoutStore()
  const { session } = useSessionStore()

  // Build a fast exerciseId → primaryMuscleGroup lookup
  const exerciseMap = new Map(exercises.map((e) => [e.id, e.primaryMuscleGroup]))

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const handleDelete = (id: string) => {
    setConfirmDeleteId(id)
  }

  const confirmDelete = () => {
    if (confirmDeleteId) {
      deletePlan(confirmDeleteId)
      setConfirmDeleteId(null)
    }
  }

  return (
    <div
      className="flex flex-col min-h-dvh relative"
      style={{ background: 'var(--color-surface-900)' }}
    >
      {/* Ambient glow */}
      <div
        className="absolute top-0 left-0 right-0 h-48 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 100% 60% at 50% 0%, color-mix(in srgb, #6366f1 15%, transparent), transparent)',
        }}
      />

      {/* Header */}
      <header className="relative z-10 px-4 pt-8 pb-4">
        <h1
          className="text-2xl font-bold"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}
        >
          Plany treningowe
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
          {plans.length === 0
            ? 'Stwórz swój pierwszy blueprint'
            : `${plans.length} ${plans.length === 1 ? 'plan' : plans.length < 5 ? 'plany' : 'planów'}`}
        </p>
      </header>

      {/* Content */}
      <div className="relative z-10 flex flex-col gap-3 px-4 pb-24">
        {plans.length === 0 ? (
          /* Empty state */
          <div
            className="flex flex-col items-center gap-5 py-16 animate-fade-in-up"
          >
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl shadow-xl"
              style={{
                background: 'linear-gradient(135deg, #4338ca, #7c3aed)',
                boxShadow: '0 0 40px color-mix(in srgb, #6366f1 30%, transparent)',
              }}
            >
              📋
            </div>
            <div className="text-center">
              <h2
                className="text-xl font-bold mb-2"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}
              >
                Brak planów
              </h2>
              <p className="text-sm max-w-xs" style={{ color: 'var(--color-text-secondary)' }}>
                Stwórz swój pierwszy blueprint treningowy — wybierz ćwiczenia, ustaw serie i powtórzenia.
              </p>
            </div>
            <button
              onClick={() => navigate('/plans/new')}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #4338ca, #7c3aed)',
                color: '#fff',
                boxShadow: '0 4px 20px color-mix(in srgb, #6366f1 40%, transparent)',
              }}
            >
              <Plus size={18} />
              Stwórz pierwszy plan
            </button>
          </div>
        ) : (
          plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              muscles={getPlanMuscles(plan, exerciseMap)}
              isActive={session?.workoutPlanId === plan.id}
              onEdit={() => navigate(`/plans/${plan.id}/edit`)}
              onDelete={() => handleDelete(plan.id)}
            />
          ))
        )}
      </div>

      {/* FAB */}
      {plans.length > 0 && (
        <button
          onClick={() => navigate('/plans/new')}
          className="fixed bottom-20 right-4 z-30 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-90 animate-pulse-glow"
          style={{
            background: 'linear-gradient(135deg, #4338ca, #7c3aed)',
            boxShadow: '0 4px 24px color-mix(in srgb, #6366f1 50%, transparent)',
          }}
          aria-label="Nowy plan"
        >
          <Plus size={24} color="#fff" />
        </button>
      )}

      {/* Delete confirmation dialog */}
      {confirmDeleteId && (
        <>
          <div
            className="fixed inset-0 z-50 animate-fade-in"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
            onClick={() => setConfirmDeleteId(null)}
          />
          <div
            className="fixed z-50 left-4 right-4 bottom-8 rounded-3xl p-6 flex flex-col gap-4 animate-fade-in-up"
            style={{ background: 'var(--color-surface-800)', border: '1px solid var(--color-surface-500)' }}
          >
            <div className="text-center">
              <p className="text-lg font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>
                Usunąć plan?
              </p>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Ta operacja jest nieodwracalna.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 py-3 rounded-xl text-sm font-semibold"
                style={{ background: 'var(--color-surface-700)', color: 'var(--color-text-primary)' }}
              >
                Anuluj
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-3 rounded-xl text-sm font-semibold"
                style={{ background: '#dc2626', color: '#fff' }}
              >
                Usuń
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
