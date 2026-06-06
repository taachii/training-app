import { useProfileStore, useLevelProgress, useXpForNextLevel } from '@/store/useProfileStore'
import { getLevelMeta, MAX_LEVEL } from '@/lib/xpSystem'
import { User, Weight, Ruler, ChevronRight, Zap, TrendingUp } from 'lucide-react'
import LevelBadge from '@/components/ui/LevelBadge'

const GENDER_LABELS = { male: 'Mężczyzna', female: 'Kobieta' }

// ─────────────────────────────────────────────
// LEVEL PROGRESS DETAIL
// ─────────────────────────────────────────────

function LevelProgressCard({ level, xp }: { level: number; xp: number }) {
  const lvlProgress = useLevelProgress()
  const xpForNext = useXpForNextLevel()
  const meta = getLevelMeta(level)
  const isMax = level >= MAX_LEVEL

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: 'var(--color-surface-800)', border: '1px solid var(--color-surface-600)' }}
    >
      <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--color-surface-600)' }}>
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
            Postęp Poziomu
          </p>
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-lg"
            style={{
              background: `color-mix(in srgb, ${meta.color} 15%, transparent)`,
              color: meta.ringColor,
            }}
          >
            {meta.label}
          </span>
        </div>
      </div>

      <div className="px-4 py-4 flex flex-col gap-3">
        {/* XP bar */}
        <div>
          <div className="flex justify-between text-xs mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
            <span>Lv.{level}</span>
            <span>{isMax ? 'MAX' : `Lv.${level + 1}`}</span>
          </div>
          <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--color-surface-600)' }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.min(100, lvlProgress * 100)}%`,
                background: `linear-gradient(90deg, ${meta.color}, ${meta.ringColor})`,
                boxShadow: `0 0 10px color-mix(in srgb, ${meta.color} 60%, transparent)`,
              }}
            />
          </div>
          <div className="flex justify-end text-xs mt-1" style={{ color: meta.ringColor }}>
            {!isMax && <span>do Lv.{level + 1}: {xpForNext - xp} XP</span>}
          </div>
        </div>

        {/* Hard cap note */}
        {isMax && (
          <div
            className="rounded-xl px-3 py-2 text-center"
            style={{ background: 'color-mix(in srgb, #fbbf24 10%, transparent)', border: '1px solid color-mix(in srgb, #fbbf24 20%, transparent)' }}
          >
            <p className="text-xs font-semibold" style={{ color: '#fbbf24' }}>
              ⭐ Poziom Maksymalny — Prestige dostępne wkrótce!
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// PROFILE PAGE
// ─────────────────────────────────────────────

export default function ProfilePage() {
  const profile = useProfileStore((s) => s.profile)

  const name    = profile?.name ?? '—'
  const gender  = profile?.gender
  const weight  = profile?.weight
  const height  = profile?.height
  const level   = profile?.level ?? 1
  const xp      = profile?.xp ?? 0
  const totalXp = profile?.totalXp ?? 0
  const xpForNext = useXpForNextLevel()
  const meta    = getLevelMeta(level)

  const physicalRows = [
    { label: 'Płeć',   value: gender ? GENDER_LABELS[gender] : '—', Icon: User   },
    { label: 'Waga',   value: weight  ? `${weight} kg`         : '—', Icon: Weight },
    { label: 'Wzrost', value: height  ? `${height} cm`         : '—', Icon: Ruler  },
  ]

  return (
    <div className="flex flex-col px-4 pt-8 pb-4 gap-5 relative">
      {/* Ambient glow */}
      <div
        className="absolute top-0 left-0 right-0 h-48 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 100% 50% at 50% 0%, color-mix(in srgb, ${meta.color} 15%, transparent), transparent)`,
        }}
      />

      {/* ── AVATAR + LEVEL BADGE ── */}
      <div className="relative flex flex-col items-center gap-4 animate-fade-in-up">
        {/* Large circular badge */}
        <LevelBadge
          level={level}
          currentLevelXp={xp}
          nextLevelXp={xpForNext}
          size="lg"
          showXP
        />

        {/* Name */}
        <div className="text-center">
          <h1
            className="text-xl font-bold"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}
          >
            {name}
          </h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            Profil treningowy
          </p>
        </div>

        {/* Quick stats row */}
        <div className="flex gap-3 w-full">
          {[
            { label: 'Poziom',   value: level,             Icon: Zap,        color: meta.ringColor },
            { label: 'Total XP', value: totalXp.toLocaleString(), Icon: TrendingUp, color: '#34d399' },
          ].map(({ label, value, Icon, color }) => (
            <div
              key={label}
              className="flex-1 flex flex-col items-center gap-1 py-3 rounded-2xl"
              style={{ background: 'var(--color-surface-800)', border: '1px solid var(--color-surface-600)' }}
            >
              <Icon size={14} style={{ color }} />
              <span className="text-base font-bold" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)' }}>
                {value}
              </span>
              <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── LEVEL PROGRESS ── */}
      <div className="animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
        <LevelProgressCard level={level} xp={xp} />
      </div>

      {/* ── PHYSICAL DATA ── */}
      <div
        className="rounded-2xl overflow-hidden animate-fade-in-up"
        style={{
          background: 'var(--color-surface-800)',
          border: '1px solid var(--color-surface-600)',
          animationDelay: '0.2s',
        }}
      >
        <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--color-surface-600)' }}>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
            Dane fizyczne (Wilks)
          </p>
        </div>
        {physicalRows.map(({ label, value, Icon }, i) => (
          <div
            key={label}
            className="flex items-center gap-3 px-4 py-3.5"
            style={{ borderBottom: i < physicalRows.length - 1 ? '1px solid var(--color-surface-600)' : 'none' }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'color-mix(in srgb, #6366f1 15%, transparent)' }}
            >
              <Icon size={15} style={{ color: '#818cf8' }} />
            </div>
            <span className="flex-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              {label}
            </span>
            <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
              {value}
            </span>
            <ChevronRight size={14} style={{ color: 'var(--color-text-muted)' }} />
          </div>
        ))}
      </div>
    </div>
  )
}
