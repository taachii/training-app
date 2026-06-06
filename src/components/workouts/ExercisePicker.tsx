import { useState, useMemo, useRef, useEffect } from 'react'
import { Search, X, ChevronRight, Plus } from 'lucide-react'
import type { Exercise, ExerciseCategory, MuscleGroup } from '@/types/exercise'
import { useWorkoutStore } from '@/store/useWorkoutStore'
import { MUSCLE_GROUP_META, CATEGORY_META, CATEGORY_ORDER } from '@/lib/muscleGroups'

// ─────────────────────────────────────────────
// CUSTOM EXERCISE FORM (panel 2)
// ─────────────────────────────────────────────

interface CustomFormProps {
  onSave: (exercise: Exercise) => void
  onBack: () => void
}

const MUSCLE_OPTIONS = Object.entries(MUSCLE_GROUP_META) as [MuscleGroup, { label: string; shortLabel: string; color: string }][]

function CustomExerciseForm({ onSave, onBack }: CustomFormProps) {
  const addCustomExercise = useWorkoutStore((s) => s.addCustomExercise)
  const [name, setName] = useState('')
  const [category, setCategory] = useState<ExerciseCategory>('barbell')
  const [primary, setPrimary] = useState<MuscleGroup>('chest')
  const [secondary, setSecondary] = useState<MuscleGroup[]>([])

  const toggleSecondary = (mg: MuscleGroup) => {
    setSecondary((prev) =>
      prev.includes(mg) ? prev.filter((m) => m !== mg) : [...prev, mg],
    )
  }

  const handleSave = () => {
    if (!name.trim()) return
    const exercise: Exercise = {
      id: `custom_${Date.now()}`,
      name: name.trim(),
      isCustom: true,
      category,
      primaryMuscleGroup: primary,
      secondaryMuscleGroups: secondary,
      useWilksRank: category === 'barbell',
      defaultSets: 3,
      defaultReps: 10,
      defaultWeight: category === 'bodyweight' ? undefined : 20,
      defaultRestSeconds: 90,
    }
    addCustomExercise(exercise)
    onSave(exercise)
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-2">
      {/* Back header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm"
          style={{ color: '#818cf8' }}
        >
          ← Powrót
        </button>
        <span className="font-semibold text-sm flex-1" style={{ color: 'var(--color-text-primary)' }}>
          Nowe ćwiczenie
        </span>
        <button
          onClick={handleSave}
          disabled={!name.trim()}
          className="text-sm font-semibold px-3 py-1.5 rounded-xl transition-all active:scale-95 disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg, #4338ca, #7c3aed)', color: '#fff' }}
        >
          Zapisz
        </button>
      </div>

      {/* Name */}
      <input
        autoFocus
        placeholder="Nazwa ćwiczenia…"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full rounded-xl px-4 py-3 text-sm outline-none"
        style={{
          background: 'var(--color-surface-700)',
          border: '1px solid var(--color-surface-500)',
          color: 'var(--color-text-primary)',
        }}
      />

      {/* Category */}
      <div>
        <p className="text-xs mb-2 font-medium" style={{ color: 'var(--color-text-muted)' }}>SPRZĘT</p>
        <div className="grid grid-cols-3 gap-2">
          {CATEGORY_ORDER.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className="flex flex-col items-center gap-1 py-2 rounded-xl text-xs font-medium transition-all active:scale-95"
              style={{
                background: category === cat
                  ? 'color-mix(in srgb, #6366f1 25%, transparent)'
                  : 'var(--color-surface-700)',
                border: `1px solid ${category === cat ? '#6366f1' : 'var(--color-surface-500)'}`,
                color: category === cat ? '#818cf8' : 'var(--color-text-secondary)',
              }}
            >
              <span>{CATEGORY_META[cat].icon}</span>
              <span>{CATEGORY_META[cat].label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Primary muscle */}
      <div>
        <p className="text-xs mb-2 font-medium" style={{ color: 'var(--color-text-muted)' }}>GŁÓWNA PARTIA</p>
        <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
          {MUSCLE_OPTIONS.map(([mg, meta]) => (
            <button
              key={mg}
              onClick={() => setPrimary(mg)}
              className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
              style={{
                background: primary === mg ? meta.color + '33' : 'var(--color-surface-700)',
                border: `1px solid ${primary === mg ? meta.color : 'var(--color-surface-500)'}`,
                color: primary === mg ? meta.color : 'var(--color-text-secondary)',
              }}
            >
              {meta.shortLabel}
            </button>
          ))}
        </div>
      </div>

      {/* Secondary muscles */}
      <div>
        <p className="text-xs mb-2 font-medium" style={{ color: 'var(--color-text-muted)' }}>PARTIE POMOCNICZE</p>
        <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
          {MUSCLE_OPTIONS.filter(([mg]) => mg !== primary).map(([mg, meta]) => (
            <button
              key={mg}
              onClick={() => toggleSecondary(mg)}
              className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
              style={{
                background: secondary.includes(mg) ? meta.color + '22' : 'var(--color-surface-700)',
                border: `1px solid ${secondary.includes(mg) ? meta.color + '88' : 'var(--color-surface-500)'}`,
                color: secondary.includes(mg) ? meta.color : 'var(--color-text-muted)',
              }}
            >
              {meta.shortLabel}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// MAIN PICKER
// ─────────────────────────────────────────────

interface ExercisePickerProps {
  isOpen: boolean
  onClose: () => void
  /** Called when the user picks an exercise */
  onSelect: (exercise: Exercise) => void
  /** IDs already in the plan — grayed out but still selectable */
  existingIds?: string[]
}

export default function ExercisePicker({
  isOpen,
  onClose,
  onSelect,
  existingIds = [],
}: ExercisePickerProps) {
  const exercises = useWorkoutStore((s) => s.exercises)
  const [query, setQuery] = useState('')
  const [catFilter, setCatFilter] = useState<ExerciseCategory | 'all'>('all')
  const [mode, setMode] = useState<'list' | 'create'>('list')
  const searchRef = useRef<HTMLInputElement>(null)

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setCatFilter('all')
      setMode('list')
    }
  }, [isOpen])

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return exercises.filter((ex) => {
      const matchesCat = catFilter === 'all' || ex.category === catFilter
      const matchesQuery = ex.name.toLowerCase().includes(q)
      return matchesCat && matchesQuery
    })
  }, [exercises, query, catFilter])

  const handleSelect = (exercise: Exercise) => {
    onSelect(exercise)
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 animate-fade-in"
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />

      {/* Bottom sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-3xl"
        style={{
          background: 'var(--color-surface-800)',
          border: '1px solid var(--color-surface-600)',
          maxHeight: '85dvh',
          animation: 'slideUp 0.3s cubic-bezier(0.32, 0.72, 0, 1) forwards',
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--color-surface-500)' }} />
        </div>

        {/* Header */}
        <div className="flex flex-shrink-0 items-center justify-between px-4 py-3">
          <h2
            className="text-lg font-bold"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}
          >
            {mode === 'create' ? 'Własne ćwiczenie' : 'Wybierz ćwiczenie'}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full"
            style={{ background: 'var(--color-surface-600)' }}
          >
            <X size={16} style={{ color: 'var(--color-text-secondary)' }} />
          </button>
        </div>

        {mode === 'create' ? (
          <div className="overflow-y-auto flex-1 pb-8">
            <CustomExerciseForm
              onSave={handleSelect}
              onBack={() => setMode('list')}
            />
          </div>
        ) : (
          <>
            {/* Search */}
            <div className="flex-shrink-0 px-4 pb-2">
              <div
                className="flex items-center gap-2 rounded-xl px-3 py-2.5"
                style={{
                  background: 'var(--color-surface-700)',
                  border: '1px solid var(--color-surface-500)',
                }}
              >
                <Search size={16} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
                <input
                  ref={searchRef}
                  placeholder="Szukaj ćwiczenia…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1 bg-transparent text-sm outline-none"
                  style={{ color: 'var(--color-text-primary)' }}
                />
                {query && (
                  <button onClick={() => setQuery('')}>
                    <X size={14} style={{ color: 'var(--color-text-muted)' }} />
                  </button>
                )}
              </div>
            </div>

            {/* Category filter pills */}
            <div className="flex-shrink-0 flex gap-2 px-4 pb-3 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
              <button
                onClick={() => setCatFilter('all')}
                className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                style={{
                  background: catFilter === 'all'
                    ? 'color-mix(in srgb, #6366f1 25%, transparent)'
                    : 'var(--color-surface-700)',
                  border: `1px solid ${catFilter === 'all' ? '#6366f1' : 'var(--color-surface-500)'}`,
                  color: catFilter === 'all' ? '#818cf8' : 'var(--color-text-secondary)',
                }}
              >
                Wszystkie
              </button>
              {CATEGORY_ORDER.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCatFilter(cat)}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                  style={{
                    background: catFilter === cat
                      ? 'color-mix(in srgb, #6366f1 25%, transparent)'
                      : 'var(--color-surface-700)',
                    border: `1px solid ${catFilter === cat ? '#6366f1' : 'var(--color-surface-500)'}`,
                    color: catFilter === cat ? '#818cf8' : 'var(--color-text-secondary)',
                  }}
                >
                  <span>{CATEGORY_META[cat].icon}</span>
                  {CATEGORY_META[cat].label}
                </button>
              ))}
            </div>

            {/* Exercise list */}
            <div className="overflow-y-auto flex-1 px-4 pb-4 flex flex-col gap-1.5">
              {/* Create custom CTA */}
              <button
                onClick={() => setMode('create')}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl w-full transition-all active:scale-[0.98] mb-1"
                style={{
                  background: 'color-mix(in srgb, #6366f1 12%, transparent)',
                  border: '1px dashed color-mix(in srgb, #6366f1 50%, transparent)',
                }}
              >
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'color-mix(in srgb, #6366f1 25%, transparent)' }}
                >
                  <Plus size={16} style={{ color: '#818cf8' }} />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold" style={{ color: '#818cf8' }}>
                    Dodaj własne ćwiczenie
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    Twórz ćwiczenia spoza biblioteki
                  </p>
                </div>
                <ChevronRight size={16} style={{ color: '#818cf8' }} />
              </button>

              {filtered.length === 0 ? (
                <p className="text-center text-sm py-8" style={{ color: 'var(--color-text-muted)' }}>
                  Brak wyników dla „{query}"
                </p>
              ) : (
                filtered.map((ex) => {
                  const primaryMeta = MUSCLE_GROUP_META[ex.primaryMuscleGroup]
                  const alreadyAdded = existingIds.includes(ex.id)
                  return (
                    <button
                      key={ex.id}
                      onClick={() => handleSelect(ex)}
                      className="flex items-center gap-3 px-4 py-3 rounded-2xl w-full text-left transition-all active:scale-[0.98]"
                      style={{
                        background: 'var(--color-surface-700)',
                        border: '1px solid var(--color-surface-600)',
                        opacity: alreadyAdded ? 0.5 : 1,
                      }}
                    >
                      {/* Category icon */}
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
                        style={{ background: 'var(--color-surface-600)' }}
                      >
                        {CATEGORY_META[ex.category].icon}
                      </div>

                      {/* Name + muscle */}
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm font-semibold truncate"
                          style={{ color: 'var(--color-text-primary)' }}
                        >
                          {ex.name}
                          {ex.isCustom && (
                            <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-md" style={{ background: 'color-mix(in srgb, #6366f1 20%, transparent)', color: '#818cf8' }}>
                              własne
                            </span>
                          )}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span
                            className="text-xs px-1.5 py-0.5 rounded-md font-medium"
                            style={{
                              background: primaryMeta.color + '22',
                              color: primaryMeta.color,
                            }}
                          >
                            {primaryMeta.shortLabel}
                          </span>
                          {alreadyAdded && (
                            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                              • już dodane
                            </span>
                          )}
                        </div>
                      </div>

                      <ChevronRight size={16} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
                    </button>
                  )
                })
              )}
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0.8; }
          to   { transform: translateY(0);    opacity: 1;   }
        }
      `}</style>
    </>
  )
}
