/**
 * XP & Levelling System
 * ─────────────────────────────────────────────
 *
 * Formula derivation:
 *   XP needed to go from level n to n+1:  xpStep(n) = 50 * (n + 1)
 *   Total XP to reach level n:            totalXp(n) = 25 * (n² + n − 2)
 *
 * Examples:
 *   L1→L2: 100 XP   (cumulative:   100)
 *   L2→L3: 150 XP   (cumulative:   250)
 *   L3→L4: 200 XP   (cumulative:   450)
 *   L4→L5: 250 XP   (cumulative:   700)
 *   L49→L50: 2550 XP (cumulative: ~63 700)
 *
 * Hard cap: Level 50 (Prestige placeholder)
 */

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────

export const MAX_LEVEL = 50

/** Total XP needed to reach the hard cap (Level 50) */
export const MAX_TOTAL_XP = 25 * (MAX_LEVEL * MAX_LEVEL + MAX_LEVEL - 2) // 63 700

// ─────────────────────────────────────────────
// XP REWARDS  (before streak multiplier)
// ─────────────────────────────────────────────

export const XP_REWARDS = {
  /** Awarded for every logged exercise, regardless of outcome */
  BASE_COMPLETION: 25,

  /** Awarded when actual result ≥ blueprint target (weight × reps) */
  SUCCESSFUL_PROGRESSION: 25,

  /** Awarded when a new personal 1RM record is set (Epley) — big dopamine hit */
  PERSONAL_RECORD: 250,

  /** Awarded at session end if ZERO exercises were skipped */
  FULL_SESSION_BONUS: 50,
} as const

// ─────────────────────────────────────────────
// STREAK MULTIPLIER
// ─────────────────────────────────────────────

/**
 * Returns the XP multiplier based on consecutive training weeks.
 *  0–1 weeks → x1.0
 *  2 weeks   → x1.2
 *  3 weeks   → x1.5
 *  4+ weeks  → x2.0 (cap)
 */
export function getStreakMultiplier(streakWeeks: number): number {
  if (streakWeeks >= 4) return 2.0
  if (streakWeeks === 3) return 1.5
  if (streakWeeks === 2) return 1.2
  return 1.0
}

export const STREAK_TIERS = [
  { weeks: 4, multiplier: 2.0, label: '×2.0 🔥' },
  { weeks: 3, multiplier: 1.5, label: '×1.5 ⚡' },
  { weeks: 2, multiplier: 1.2, label: '×1.2 💪' },
  { weeks: 1, multiplier: 1.0, label: '×1.0'   },
  { weeks: 0, multiplier: 1.0, label: '×1.0'   },
]

// ─────────────────────────────────────────────
// LEVEL CALCULATIONS
// ─────────────────────────────────────────────

/**
 * Total XP needed to REACH a given level from scratch.
 * totalXpForLevel(1) = 0  (you start at level 1)
 * totalXpForLevel(2) = 100
 * totalXpForLevel(3) = 250
 */
export function totalXpForLevel(level: number): number {
  if (level <= 1) return 0
  if (level > MAX_LEVEL) return MAX_TOTAL_XP
  return 25 * (level * level + level - 2)
}

/**
 * XP needed to go from currentLevel to currentLevel + 1.
 * Returns Infinity when already at MAX_LEVEL.
 */
export function xpForNextLevel(currentLevel: number): number {
  if (currentLevel >= MAX_LEVEL) return Infinity
  return 50 * (currentLevel + 1)
}

/**
 * Derive level info from a cumulative total XP value.
 */
export function levelFromTotalXp(totalXp: number): {
  level: number
  currentLevelXp: number  // XP within the current level
  nextLevelXp: number     // XP needed for next level (Infinity at cap)
  progressFraction: number // 0–1 within current level
} {
  // Clamp to cap
  const clampedXp = Math.min(totalXp, MAX_TOTAL_XP)

  // Binary-search or sequential scan — 50 levels is tiny
  let level = 1
  while (level < MAX_LEVEL && clampedXp >= totalXpForLevel(level + 1)) {
    level++
  }

  const levelStartXp = totalXpForLevel(level)
  const nextLvlXp    = xpForNextLevel(level)
  const currentLevelXp = clampedXp - levelStartXp

  return {
    level,
    currentLevelXp,
    nextLevelXp: nextLvlXp,
    progressFraction: nextLvlXp === Infinity ? 1 : currentLevelXp / nextLvlXp,
  }
}

// ─────────────────────────────────────────────
// XP AWARD CALCULATION
// ─────────────────────────────────────────────

/**
 * Compute total XP to award for a single completed exercise.
 * Streak multiplier is applied to BASE + PROGRESSION only (not PR bonus —
 * PR should feel massive regardless of streak).
 */
export function computeExerciseXP(params: {
  isSuccessfulProgression: boolean
  isPersonalRecord: boolean
  streakWeeks: number
}): { total: number; breakdown: Record<string, number> } {
  const multiplier = getStreakMultiplier(params.streakWeeks)

  const base       = XP_REWARDS.BASE_COMPLETION
  const progression = params.isSuccessfulProgression ? XP_REWARDS.SUCCESSFUL_PROGRESSION : 0
  const prBonus    = params.isPersonalRecord ? XP_REWARDS.PERSONAL_RECORD : 0

  // Streak multiplier applies to base + progression, PR is always full value
  const multiplied = Math.floor((base + progression) * multiplier)
  const total = multiplied + prBonus

  return {
    total,
    breakdown: {
      base: Math.floor(base * multiplier),
      progression: Math.floor(progression * multiplier),
      pr: prBonus,
    },
  }
}

// ─────────────────────────────────────────────
// ISO WEEK KEY (for streak tracking)
// ─────────────────────────────────────────────

/**
 * Returns an ISO week key "YYYY-WNN" for a given date.
 * Used to determine whether two workouts fall in the same calendar week.
 */
export function getIsoWeekKey(date: Date): string {
  // Copy date and find Thursday of the same week (ISO week definition)
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNum = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(weekNum).padStart(2, '0')}`
}

/**
 * Determine the new streak value after recording a workout.
 * Returns { newStreak, wasReset }
 */
export function computeNewStreak(
  currentStreak: number,
  lastWorkoutDate: string | null,
  today: Date = new Date(),
): { newStreak: number; wasReset: boolean } {
  if (!lastWorkoutDate) {
    return { newStreak: 1, wasReset: false }
  }

  const last = new Date(lastWorkoutDate)
  const daysSinceLast = Math.floor(
    (today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24),
  )

  if (daysSinceLast > 7) {
    // More than 7 days gap → reset streak
    return { newStreak: 1, wasReset: true }
  }

  const lastWeek = getIsoWeekKey(last)
  const thisWeek = getIsoWeekKey(today)

  if (lastWeek === thisWeek) {
    // Same week — streak unchanged
    return { newStreak: currentStreak, wasReset: false }
  }

  // New consecutive week — increment
  return { newStreak: currentStreak + 1, wasReset: false }
}

// ─────────────────────────────────────────────
// LEVEL BADGE METADATA
// ─────────────────────────────────────────────

export type LevelTier =
  | 'recruit'    // 1–5
  | 'warrior'    // 6–10
  | 'fighter'    // 11–15
  | 'gladiator'  // 16–20
  | 'champion'   // 21–25
  | 'expert'     // 26–30
  | 'master'     // 31–35
  | 'elite'      // 36–40
  | 'legend'     // 41–49
  | 'prestige'   // 50

export interface LevelMeta {
  tier: LevelTier
  label: string
  icon: string       // emoji for fallback
  color: string      // glow color
  ringColor: string  // SVG stroke color
}

const LEVEL_TIERS: Array<{ minLevel: number; meta: LevelMeta }> = [
  { minLevel: 50, meta: { tier: 'prestige',  label: 'Prestige',  icon: '⭐', color: '#ffd700', ringColor: '#fbbf24' } },
  { minLevel: 41, meta: { tier: 'legend',    label: 'Legend',    icon: '☄️', color: '#f43f5e', ringColor: '#fb7185' } },
  { minLevel: 36, meta: { tier: 'elite',     label: 'Elite',     icon: '🔥', color: '#f97316', ringColor: '#fb923c' } },
  { minLevel: 31, meta: { tier: 'master',    label: 'Master',    icon: '⚡', color: '#8b5cf6', ringColor: '#a78bfa' } },
  { minLevel: 26, meta: { tier: 'expert',    label: 'Expert',    icon: '👑', color: '#6366f1', ringColor: '#818cf8' } },
  { minLevel: 21, meta: { tier: 'champion',  label: 'Champion',  icon: '🥇', color: '#eab308', ringColor: '#facc15' } },
  { minLevel: 16, meta: { tier: 'gladiator', label: 'Gladiator', icon: '🥈', color: '#6b7280', ringColor: '#9ca3af' } },
  { minLevel: 11, meta: { tier: 'fighter',   label: 'Fighter',   icon: '🥉', color: '#cd7f32', ringColor: '#d97706' } },
  { minLevel: 6,  meta: { tier: 'warrior',   label: 'Warrior',   icon: '⚔️', color: '#ef4444', ringColor: '#f87171' } },
  { minLevel: 1,  meta: { tier: 'recruit',   label: 'Recruit',   icon: '🛡️', color: '#6366f1', ringColor: '#818cf8' } },
]

export function getLevelMeta(level: number): LevelMeta {
  for (const { minLevel, meta } of LEVEL_TIERS) {
    if (level >= minLevel) return meta
  }
  return LEVEL_TIERS[LEVEL_TIERS.length - 1].meta
}
