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
// XP REWARDS
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
  const nextLvlXp = xpForNextLevel(level)
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
 */
export function computeExerciseXP(params: {
  isSuccessfulProgression: boolean
  isPersonalRecord: boolean
}): { total: number; breakdown: Record<string, number> } {
  const base = XP_REWARDS.BASE_COMPLETION
  const progression = params.isSuccessfulProgression ? XP_REWARDS.SUCCESSFUL_PROGRESSION : 0
  const prBonus = params.isPersonalRecord ? XP_REWARDS.PERSONAL_RECORD : 0

  const total = base + progression + prBonus

  return {
    total,
    breakdown: {
      base: base,
      progression: progression,
      pr: prBonus,
    },
  }
}

// ─────────────────────────────────────────────

// ─────────────────────────────────────────────
// LEVEL BADGE METADATA
// ─────────────────────────────────────────────

export type LevelTier =
  | 'kanapowicz'   // 1–5
  | 'suchoklates'  // 6–10
  | 'pilatesiarz'  // 11–15
  | 'pozeracz'     // 16–20
  | 'spoceniec'    // 21–25
  | 'gymbro'       // 26–30
  | 'sztangolamacz'// 31–35
  | 'kark'         // 36–40
  | 'testosteron'  // 41–49
  | 'gigachad'     // 50

export interface LevelMeta {
  tier: LevelTier
  label: string
  icon: string       // emoji for fallback
  color: string      // glow color
  ringColor: string  // SVG stroke color
}

export const LEVEL_TIERS: Array<{ minLevel: number; meta: LevelMeta }> = [
  { minLevel: 50, meta: { tier: 'gigachad',      label: 'Gigachad',        icon: '🗿', color: '#ffd700', ringColor: '#fbbf24' } }, // Gold
  { minLevel: 41, meta: { tier: 'testosteron',   label: 'Mr. Testosteron', icon: '💉', color: '#ef4444', ringColor: '#f87171' } }, // Red
  { minLevel: 36, meta: { tier: 'kark',          label: 'Kark',            icon: '🦍', color: '#f97316', ringColor: '#fb923c' } }, // Orange
  { minLevel: 31, meta: { tier: 'sztangolamacz', label: 'Sztangołamacz',   icon: '💥', color: '#22c55e', ringColor: '#4ade80' } }, // Green
  { minLevel: 26, meta: { tier: 'gymbro',        label: 'Gym Bro',         icon: '🤜', color: '#8b5cf6', ringColor: '#a78bfa' } }, // Violet
  { minLevel: 21, meta: { tier: 'spoceniec',     label: 'Spoceniec',       icon: '💦', color: '#3b82f6', ringColor: '#60a5fa' } }, // Blue
  { minLevel: 16, meta: { tier: 'pozeracz',      label: 'Pożeracz Ryżu',   icon: '🍚', color: '#d97706', ringColor: '#fbbf24' } }, // Amber
  { minLevel: 11, meta: { tier: 'pilatesiarz',   label: 'Pilatesiarz',     icon: '🧘', color: '#ec4899', ringColor: '#f472b6' } }, // Pink
  { minLevel: 6,  meta: { tier: 'suchoklates',   label: 'Suchoklates',     icon: '🦴', color: '#14b8a6', ringColor: '#2dd4bf' } }, // Teal
  { minLevel: 1,  meta: { tier: 'kanapowicz',    label: 'Kanapowicz',      icon: '🛋️', color: '#94a3b8', ringColor: '#cbd5e1' } }, // Slate
]

export function getLevelMeta(level: number): LevelMeta {
  for (const { minLevel, meta } of LEVEL_TIERS) {
    if (level >= minLevel) return meta
  }
  return LEVEL_TIERS[LEVEL_TIERS.length - 1].meta
}
