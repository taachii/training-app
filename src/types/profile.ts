// ─────────────────────────────────────────────
// USER PROFILE
// ─────────────────────────────────────────────

export type Gender = 'male' | 'female'

export interface WeightEntry {
  /** ISO date string YYYY-MM-DD */
  date: string
  /** Body weight in kg */
  weight: number
}

export interface UserProfile {
  id: string
  name: string
  avatarUrl?: string

  /** Biological sex — required for Wilks coefficient selection */
  gender: Gender

  /** Current body weight in kg (always mirrors last entry in weightHistory) */
  weight: number

  /** Full history of body-weight measurements for charts & Wilks accuracy */
  weightHistory: WeightEntry[]

  /** Height in cm — used for BMI, future TDEE calculator */
  height: number

  createdAt: string
  updatedAt: string
}
