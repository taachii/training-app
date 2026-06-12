import type { MuscleGroup, ExerciseCategory } from '@/types/exercise'

// ─────────────────────────────────────────────
// MUSCLE GROUP METADATA
// ─────────────────────────────────────────────

interface MuscleGroupMeta {
  /** Polish display name */
  label: string
  /** Short badge label */
  shortLabel: string
  /** Hex color for charts and badges */
  color: string
}

export const MUSCLE_GROUP_META: Record<MuscleGroup, MuscleGroupMeta> = {
  chest:        { label: 'Klatka piersiowa',    shortLabel: 'Klatka',      color: '#f87171' },
  lats:         { label: 'Najszerszy grzbietu', shortLabel: 'Najszerszy',  color: '#60a5fa' },
  upper_back:   { label: 'Plecy górne',          shortLabel: 'Plecy',       color: '#3b82f6' },
  lower_back:   { label: 'Dół pleców',           shortLabel: 'Dół pleców',  color: '#2563eb' },
  traps:        { label: 'Czworoboczny',         shortLabel: 'Czworo.',     color: '#818cf8' },
  shoulders:    { label: 'Barki',                shortLabel: 'Barki',       color: '#a78bfa' },
  front_delts:  { label: 'Barki (przód)',        shortLabel: 'Barki P.',    color: '#c4b5fd' },
  side_delts:   { label: 'Barki (bok)',          shortLabel: 'Barki B.',    color: '#ddd6fe' },
  rear_delts:   { label: 'Barki (tył)',          shortLabel: 'Barki T.',    color: '#ede9fe' },
  biceps:       { label: 'Biceps',               shortLabel: 'Biceps',      color: '#22d3ee' },
  triceps:      { label: 'Triceps',              shortLabel: 'Triceps',     color: '#06b6d4' },
  forearms:     { label: 'Przedramiona',         shortLabel: 'Przedr.',     color: '#0891b2' },
  core:         { label: 'Brzuch / Core',        shortLabel: 'Core',        color: '#fbbf24' },
  quadriceps:   { label: 'Czworogłowy uda',      shortLabel: 'Quady',       color: '#34d399' },
  hamstrings:   { label: 'Dwugłowy uda',         shortLabel: 'Hamstringi',  color: '#10b981' },
  glutes:       { label: 'Pośladki',             shortLabel: 'Pośladki',    color: '#059669' },
  calves:       { label: 'Łydki',                shortLabel: 'Łydki',       color: '#047857' },
  hip_flexors:  { label: 'Zginacze biodra',      shortLabel: 'Biodra',      color: '#6ee7b7' },
  adductors:    { label: 'Przywodziciele',       shortLabel: 'Przyw.',      color: '#a7f3d0' },
  abductors:    { label: 'Odwodziciele',         shortLabel: 'Odwodz.',     color: '#d1fae5' },
  neck:         { label: 'Szyja',                shortLabel: 'Szyja',       color: '#9ca3af' },
}

// ─────────────────────────────────────────────
// EXERCISE CATEGORY METADATA
// ─────────────────────────────────────────────

interface CategoryMeta {
  label: string
}

export const CATEGORY_META: Record<ExerciseCategory, CategoryMeta> = {
  barbell:             { label: 'Sztanga' },
  dumbbell:            { label: 'Hantle' },
  cable:               { label: 'Kable' },
  machine:             { label: 'Maszyny' },
  bodyweight:          { label: 'Własna waga' },
  weighted_bodyweight: { label: 'Z obciążeniem' },
}

export type MainSegment = 'weights' | 'machines' | 'calisthenics'

export const SEGMENT_META: Record<MainSegment, { label: string; categories: ExerciseCategory[] }> = {
  weights: { label: 'Ciężary', categories: ['barbell', 'dumbbell', 'cable'] },
  machines: { label: 'Maszyny', categories: ['machine'] },
  calisthenics: { label: 'Kalistenika', categories: ['bodyweight', 'weighted_bodyweight'] },
}

export const SEGMENT_ORDER: MainSegment[] = ['weights', 'machines', 'calisthenics']

/** Ordered list of all categories for filter UI */
export const CATEGORY_ORDER: ExerciseCategory[] = [
  'barbell', 'dumbbell', 'cable', 'machine', 'bodyweight', 'weighted_bodyweight',
]

// ─────────────────────────────────────────────
// REST TIME PRESETS
// ─────────────────────────────────────────────

export const REST_PRESETS = [
  { label: '30s',  value: 30  },
  { label: '45s',  value: 45  },
  { label: '60s',  value: 60  },
  { label: '90s',  value: 90  },
  { label: '2 min', value: 120 },
  { label: '3 min', value: 180 },
  { label: '4 min', value: 240 },
  { label: '5 min', value: 300 },
]

/** Format seconds into "Xm Ys" display string */
export function formatRest(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return s === 0 ? `${m} min` : `${m}m ${s}s`
}

// ─────────────────────────────────────────────
// PLAN ICON PRESETS
// ─────────────────────────────────────────────

export const PLAN_ICONS = ['💪', '🏋️', '🦵', '🔝', '🦾', '⚡', '🏅', '🔥', '💥', '🎯', '⚔️', '🚀']
