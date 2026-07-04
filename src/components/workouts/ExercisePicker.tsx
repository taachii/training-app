import { useState, useMemo, useRef, useEffect } from 'react'
import { Search, X, ChevronRight, Plus, Dumbbell, Activity, Shield, PersonStanding, Link, ChevronDown } from 'lucide-react'
import type { Exercise, ExerciseCategory, MuscleGroup } from '@/types/exercise'
import { useWorkoutStore } from '@/store/useWorkoutStore'
import { MUSCLE_GROUP_META, CATEGORY_META, CATEGORY_ORDER, SEGMENT_META, SEGMENT_ORDER } from '@/lib/muscleGroups'
import type { MainSegment } from '@/lib/muscleGroups'

// ─────────────────────────────────────────────
// ICONS
// ─────────────────────────────────────────────

function CategoryIcon({ category, size = 16, color = "currentColor" }: { category: ExerciseCategory; size?: number; color?: string }) {
  switch (category) {
    case 'barbell': return <Dumbbell size={size} color={color} />
    case 'dumbbell': return <Dumbbell size={size} color={color} />
    case 'machine': return <Activity size={size} color={color} />
    case 'cable': return <Link size={size} color={color} />
    case 'bodyweight': return <PersonStanding size={size} color={color} />
    case 'weighted_bodyweight': return <Shield size={size} color={color} />
    default: return <Activity size={size} color={color} />
  }
}

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
              className="flex flex-col items-center justify-center text-center gap-1.5 py-3 px-1 rounded-xl text-[10px] font-medium transition-all active:scale-95"
              style={{
                background: category === cat
                  ? 'color-mix(in srgb, #6366f1 25%, transparent)'
                  : 'var(--color-surface-700)',
                border: `1px solid ${category === cat ? '#6366f1' : 'var(--color-surface-500)'}`,
                color: category === cat ? '#818cf8' : 'var(--color-text-secondary)',
              }}
            >
              <CategoryIcon category={cat} size={18} />
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
  const [segmentFilter, setSegmentFilter] = useState<MainSegment>('weights')
  const [equipmentFilter, setEquipmentFilter] = useState<ExerciseCategory | 'all'>('all')
  const [muscleFilter, setMuscleFilter] = useState<MuscleGroup | 'all'>('all')
  const [mode, setMode] = useState<'list' | 'create'>('list')
  const searchRef = useRef<HTMLInputElement>(null)

  const [openDropdown, setOpenDropdown] = useState<'segment' | 'equipment' | 'muscle' | null>(null)

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSegmentFilter('weights')
      setEquipmentFilter('all')
      setMuscleFilter('all')
      setMode('list')
      setOpenDropdown(null)
    }
  }, [isOpen])

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return exercises.filter((ex) => {
      // 1. Segment filter
      const inSegment = SEGMENT_META[segmentFilter].categories.includes(ex.category)
      if (!inSegment) return false

      // 2. Equipment subfilter
      if (equipmentFilter !== 'all' && ex.category !== equipmentFilter) return false

      // 3. Muscle filter
      if (muscleFilter !== 'all' && ex.primaryMuscleGroup !== muscleFilter) return false

      // 4. Query
      return ex.name.toLowerCase().includes(q)
    })
  }, [exercises, query, segmentFilter, equipmentFilter, muscleFilter])

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
          maxHeight: '90dvh',
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

            {/* Dropdown Filters */}
            <div className="flex-shrink-0 px-4 pb-3">
              {/* Invisible overlay to close dropdowns */}
              {openDropdown && (
                <div className="fixed inset-0 z-40" onClick={() => setOpenDropdown(null)} />
              )}

              <div className="flex gap-2 flex-wrap relative z-50">
                {/* Segment Dropdown */}
                <div className="relative flex-shrink-0">
                  <button
                    onClick={() => setOpenDropdown(p => p === 'segment' ? null : 'segment')}
                    className="flex items-center gap-1.5 pl-3 pr-2 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95"
                    style={{
                      background: 'var(--color-surface-700)',
                      border: '1px solid var(--color-surface-500)',
                      color: 'var(--color-text-primary)'
                    }}
                  >
                    {SEGMENT_META[segmentFilter].label}
                    <ChevronDown size={14} style={{ color: 'var(--color-text-muted)' }} />
                  </button>
                  
                  {openDropdown === 'segment' && (
                    <div className="absolute top-full left-0 mt-2 w-44 rounded-xl overflow-hidden z-50 shadow-xl border animate-fade-in"
                         style={{ background: 'var(--color-surface-700)', borderColor: 'var(--color-surface-500)' }}>
                      {SEGMENT_ORDER.map((seg) => (
                        <button
                          key={seg}
                          onClick={() => {
                            setSegmentFilter(seg)
                            setEquipmentFilter('all')
                            setOpenDropdown(null)
                          }}
                          className="w-full text-left px-4 py-3 text-xs font-semibold transition-colors flex items-center justify-between"
                          style={{
                            color: segmentFilter === seg ? '#818cf8' : 'var(--color-text-primary)',
                            background: segmentFilter === seg ? 'color-mix(in srgb, #6366f1 10%, transparent)' : 'transparent',
                            borderBottom: '1px solid var(--color-surface-600)'
                          }}
                        >
                          {SEGMENT_META[seg].label}
                          {segmentFilter === seg && <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#818cf8' }} />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Equipment Dropdown */}
                {SEGMENT_META[segmentFilter].categories.length > 1 && (
                  <div className="relative flex-shrink-0">
                    <button
                      onClick={() => setOpenDropdown(p => p === 'equipment' ? null : 'equipment')}
                      className="flex items-center gap-1.5 pl-3 pr-2 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95"
                      style={{
                        background: equipmentFilter !== 'all' ? 'color-mix(in srgb, #6366f1 20%, transparent)' : 'var(--color-surface-700)',
                        border: `1px solid ${equipmentFilter !== 'all' ? '#6366f1' : 'var(--color-surface-500)'}`,
                        color: equipmentFilter !== 'all' ? '#818cf8' : 'var(--color-text-primary)'
                      }}
                    >
                      {equipmentFilter === 'all' ? 'Cały sprzęt' : CATEGORY_META[equipmentFilter as ExerciseCategory].label}
                      <ChevronDown size={14} style={{ color: equipmentFilter !== 'all' ? '#818cf8' : 'var(--color-text-muted)' }} />
                    </button>
                    
                    {openDropdown === 'equipment' && (
                      <div className="absolute top-full left-0 mt-2 w-48 rounded-xl overflow-hidden z-50 shadow-xl border animate-fade-in"
                           style={{ background: 'var(--color-surface-700)', borderColor: 'var(--color-surface-500)' }}>
                        <button
                          onClick={() => {
                            setEquipmentFilter('all')
                            setOpenDropdown(null)
                          }}
                          className="w-full text-left px-4 py-3 text-xs font-semibold transition-colors flex items-center justify-between"
                          style={{
                            color: equipmentFilter === 'all' ? '#818cf8' : 'var(--color-text-primary)',
                            background: equipmentFilter === 'all' ? 'color-mix(in srgb, #6366f1 10%, transparent)' : 'transparent',
                            borderBottom: '1px solid var(--color-surface-600)'
                          }}
                        >
                          Wszystkie z segmentu
                          {equipmentFilter === 'all' && <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#818cf8' }} />}
                        </button>
                        {SEGMENT_META[segmentFilter].categories.map((cat) => (
                          <button
                            key={cat}
                            onClick={() => {
                              setEquipmentFilter(cat)
                              setOpenDropdown(null)
                            }}
                            className="w-full text-left px-4 py-3 text-xs font-semibold transition-colors flex items-center justify-between"
                            style={{
                              color: equipmentFilter === cat ? '#818cf8' : 'var(--color-text-primary)',
                              background: equipmentFilter === cat ? 'color-mix(in srgb, #6366f1 10%, transparent)' : 'transparent',
                              borderBottom: '1px solid var(--color-surface-600)'
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <CategoryIcon category={cat} size={14} />
                              {CATEGORY_META[cat].label}
                            </div>
                            {equipmentFilter === cat && <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#818cf8' }} />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Muscle Dropdown */}
                <div className="relative flex-shrink-0">
                  <button
                    onClick={() => setOpenDropdown(p => p === 'muscle' ? null : 'muscle')}
                    className="flex items-center gap-1.5 pl-3 pr-2 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95"
                    style={{
                      background: muscleFilter !== 'all' ? 'color-mix(in srgb, #6366f1 20%, transparent)' : 'var(--color-surface-700)',
                      border: `1px solid ${muscleFilter !== 'all' ? '#6366f1' : 'var(--color-surface-500)'}`,
                      color: muscleFilter !== 'all' ? '#818cf8' : 'var(--color-text-primary)'
                    }}
                  >
                    {muscleFilter === 'all' ? 'Wszystkie partie' : MUSCLE_GROUP_META[muscleFilter as MuscleGroup].shortLabel}
                    <ChevronDown size={14} style={{ color: muscleFilter !== 'all' ? '#818cf8' : 'var(--color-text-muted)' }} />
                  </button>
                  
                  {openDropdown === 'muscle' && (
                    <div className="absolute top-full right-0 sm:left-0 sm:right-auto mt-2 w-48 max-h-60 overflow-y-auto rounded-xl z-50 shadow-xl border animate-fade-in custom-scrollbar"
                         style={{ background: 'var(--color-surface-700)', borderColor: 'var(--color-surface-500)' }}>
                      <button
                        onClick={() => {
                          setMuscleFilter('all')
                          setOpenDropdown(null)
                        }}
                        className="w-full text-left px-4 py-3 text-xs font-semibold transition-colors flex items-center justify-between sticky top-0 z-10 backdrop-blur-md"
                        style={{
                          color: muscleFilter === 'all' ? '#818cf8' : 'var(--color-text-primary)',
                          background: muscleFilter === 'all' ? 'color-mix(in srgb, #6366f1 20%, transparent)' : 'rgba(30, 30, 35, 0.95)',
                          borderBottom: '1px solid var(--color-surface-600)'
                        }}
                      >
                        Wszystkie partie
                        {muscleFilter === 'all' && <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#818cf8' }} />}
                      </button>
                      {MUSCLE_OPTIONS.map(([mg, meta]) => (
                        <button
                          key={mg}
                          onClick={() => {
                            setMuscleFilter(mg)
                            setOpenDropdown(null)
                          }}
                          className="w-full text-left px-4 py-3 text-xs font-semibold transition-colors flex items-center justify-between"
                          style={{
                            color: muscleFilter === mg ? meta.color : 'var(--color-text-secondary)',
                            background: muscleFilter === mg ? meta.color + '15' : 'transparent',
                            borderBottom: '1px solid var(--color-surface-600)'
                          }}
                        >
                          {meta.label}
                          {muscleFilter === mg && <div className="w-1.5 h-1.5 rounded-full" style={{ background: meta.color }} />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
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
                  Brak wyników
                </p>
              ) : (
                filtered.map((ex) => {
                  const primaryMeta = MUSCLE_GROUP_META[ex.primaryMuscleGroup] || { label: 'Inne', shortLabel: 'Inne', color: '#9ca3af' }
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
                        style={{ background: 'var(--color-surface-600)', color: 'var(--color-text-secondary)' }}
                      >
                        <CategoryIcon category={ex.category} size={20} />
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
