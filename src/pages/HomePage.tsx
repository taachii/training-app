import { Dumbbell, TrendingUp, Trophy, Zap } from 'lucide-react'
import { useProfileStore, useLevelProgress, useXpForNextLevel } from '@/store/useProfileStore'
import LevelBadge from '@/components/ui/LevelBadge'
import { getLevelMeta } from '@/lib/xpSystem'

const FEATURE_CARDS = [
  { icon: Dumbbell,   label: 'Plany treningowe',  description: 'Blueprinty i ćwiczenia', color: '#6366f1' },
  { icon: TrendingUp, label: 'Progresja',          description: '+2.5 kg per sukces',     color: '#10b981' },
  { icon: Trophy,     label: 'System rang',        description: 'Bronze → Obsidian',      color: '#fbbf24' },
  { icon: Zap,        label: 'Aktywna sesja',      description: 'Timer i kolejka ćwiczeń', color: '#8b5cf6' },
]

export default function HomePage() {
  const profile    = useProfileStore((s) => s.profile)
  const name       = profile?.name ?? 'Atleta'
  const level      = profile?.level ?? 1
  const xp         = profile?.xp ?? 0
  const streak     = profile?.workoutStreak ?? 0
  const xpForNext  = useXpForNextLevel()
  const lvlProgress = useLevelProgress()
  const levelMeta  = getLevelMeta(level)

  return (
    <div className="flex flex-col px-4 pt-8 pb-4 gap-6 relative">
      {/* Ambient glow */}
      <div
        className="absolute top-0 left-0 right-0 h-64 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 120% 60% at 50% 0%, color-mix(in srgb, #6366f1 18%, transparent), transparent)',
        }}
      />

      {/* ── HEADER ── */}
      <div className="relative flex items-center gap-4 animate-fade-in-up">
        {/* Level badge */}
        <div className="flex-shrink-0">
          <LevelBadge
            level={level}
            currentLevelXp={xp}
            nextLevelXp={xpForNext}
            size="md"
          />
        </div>

        {/* Greeting */}
        <div className="flex-1 min-w-0">
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {new Date().toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <h1
            className="text-2xl font-bold leading-tight truncate"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}
          >
            Cześć, {name}! 👋
          </h1>
          <div className="flex items-center gap-3 mt-1">
            {/* Level label */}
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-lg"
              style={{
                background: `color-mix(in srgb, ${levelMeta.color} 15%, transparent)`,
                color: levelMeta.ringColor,
                border: `1px solid color-mix(in srgb, ${levelMeta.color} 30%, transparent)`,
              }}
            >
              Lv.{level} {levelMeta.label}
            </span>
            {/* Streak */}
            {streak > 0 && (
              <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                🔥 {streak}w streak
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── XP PROGRESS BAR ── */}
      <div
        className="relative rounded-2xl px-4 py-3 animate-fade-in-up"
        style={{
          background: 'var(--color-surface-800)',
          border: '1px solid var(--color-surface-600)',
          animationDelay: '0.04s',
        }}
      >
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-semibold" style={{ color: levelMeta.ringColor }}>
            XP — Poziom {level}
          </span>
          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {xp} / {xpForNext === Infinity ? '∞' : xpForNext}
          </span>
        </div>
        {/* Track */}
        <div
          className="h-2 rounded-full overflow-hidden"
          style={{ background: 'var(--color-surface-600)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${Math.min(100, lvlProgress * 100)}%`,
              background: `linear-gradient(90deg, ${levelMeta.color}, ${levelMeta.ringColor})`,
              boxShadow: `0 0 8px color-mix(in srgb, ${levelMeta.color} 60%, transparent)`,
            }}
          />
        </div>
      </div>

      {/* ── QUICK START CTA ── */}
      <div
        className="relative overflow-hidden rounded-2xl p-5 animate-fade-in-up"
        style={{
          background: 'linear-gradient(135deg, #4338ca, #7c3aed)',
          boxShadow: '0 8px 32px color-mix(in srgb, #6366f1 35%, transparent)',
          animationDelay: '0.08s',
        }}
      >
        <div
          className="absolute -top-6 -right-6 w-28 h-28 rounded-full opacity-20"
          style={{ background: '#fff' }}
        />
        <p className="text-xs font-semibold uppercase tracking-widest mb-1 opacity-80" style={{ color: '#c4b5fd' }}>
          Dzisiejszy trening
        </p>
        <p className="text-lg font-bold text-white mb-4">Nie masz zaplanowanego treningu</p>
        <button
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 active:scale-95"
          style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', backdropFilter: 'blur(8px)' }}
          aria-label="Zaplanuj trening"
        >
          <Dumbbell size={16} />
          Zaplanuj trening
        </button>
      </div>

      {/* ── FEATURE GRID ── */}
      <div className="grid grid-cols-2 gap-3">
        {FEATURE_CARDS.map(({ icon: Icon, label, description, color }, i) => (
          <div
            key={label}
            className="rounded-2xl p-4 flex flex-col gap-3 animate-fade-in-up"
            style={{
              background: 'var(--color-surface-800)',
              border: '1px solid var(--color-surface-600)',
              animationDelay: `${0.12 + i * 0.05}s`,
            }}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: `color-mix(in srgb, ${color} 20%, transparent)` }}
            >
              <Icon size={18} style={{ color }} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                {label}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                {description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── STREAK MULTIPLIER BADGE ── */}
      {streak > 0 && (
        <div
          className="rounded-2xl p-4 flex items-center gap-4 animate-fade-in-up"
          style={{
            background: 'color-mix(in srgb, #f97316 8%, transparent)',
            border: '1px solid color-mix(in srgb, #f97316 20%, transparent)',
            animationDelay: '0.3s',
          }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
            style={{ background: 'color-mix(in srgb, #f97316 20%, transparent)' }}
          >
            🔥
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: '#fb923c' }}>
              {streak >= 4 ? '×2.0 Mnożnik XP!' : streak === 3 ? '×1.5 Mnożnik XP' : streak === 2 ? '×1.2 Mnożnik XP' : 'Streak Aktywny'}
            </p>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {streak} {streak === 1 ? 'tydzień' : streak < 5 ? 'tygodnie' : 'tygodni'} z rzędu — nie przerywaj ciągłości!
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
