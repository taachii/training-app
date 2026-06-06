import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, User } from 'lucide-react'
import { useProfileStore, useLevelProgress, useXpForNextLevel } from '@/store/useProfileStore'
import { useSessionStore } from '@/store/useSessionStore'
import LevelBadge from '@/components/ui/LevelBadge'
import { getLevelMeta } from '@/lib/xpSystem'
import WeeklyCalendarWidget from '@/components/home/WeeklyCalendarWidget'
import RanksOverviewWidget from '@/components/home/RanksOverviewWidget'

export default function HomePage() {
  const profile = useProfileStore((s) => s.profile)
  const name = profile?.name ?? 'taachii'
  const level = profile?.level ?? 1
  const xp = profile?.xp ?? 0
  const xpForNext = useXpForNextLevel()
  const lvlProgress = useLevelProgress()
  const levelMeta = getLevelMeta(level)
  const navigate = useNavigate()
  const { session } = useSessionStore()

  const [elapsedSec, setElapsedSec] = useState(0)

  useEffect(() => {
    if (!session || session.phase === 'done' || session.phase === 'done_early') return
    if (!session.startTime) return

    const tick = () => {
      const diff = Math.floor((Date.now() - new Date(session.startTime).getTime()) / 1000)
      setElapsedSec(diff >= 0 ? diff : 0)
    }

    tick() // initial set
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [session?.startTime, session?.phase])

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m}:${String(s).padStart(2, '0')}`
  }

  const hasActiveSession = session && session.phase !== 'done' && session.phase !== 'done_early'

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
          </div>
        </div>

        {/* Profile Button */}
        <button
          onClick={() => navigate('/profile')}
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-95"
          style={{ background: 'var(--color-surface-700)', border: '1px solid var(--color-surface-600)' }}
          aria-label="Profil"
        >
          <User size={20} style={{ color: 'var(--color-text-secondary)' }} />
        </button>
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
      <button
        onClick={() => hasActiveSession ? navigate(`/session/start/${session.workoutPlanId}`) : navigate('/plans')}
        className="w-full relative overflow-hidden rounded-2xl p-5 flex flex-col items-start animate-fade-in-up text-left transition-all duration-200 active:scale-[0.98]"
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
        <div className="relative z-10 w-full flex items-center justify-between mb-1">
          <p className="text-xs font-semibold uppercase tracking-widest opacity-80" style={{ color: '#c4b5fd' }}>
            {hasActiveSession ? 'Aktywna sesja' : 'Brak aktywnej sesji'}
          </p>
        </div>
        <div className="relative z-10 flex items-center gap-3 w-full">
          <p className="text-xl font-bold text-white">
            {hasActiveSession ? 'Trening w toku' : 'Rozpocznij trening'}
          </p>
          {hasActiveSession && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg" style={{ background: 'rgba(0,0,0,0.2)' }}>
              <Clock size={14} color="#c4b5fd" />
              <span className="text-sm font-bold text-white tracking-widest">{formatTime(elapsedSec)}</span>
            </div>
          )}
        </div>
      </button>

      {/* ── CALENDAR WIDGET ── */}
      <WeeklyCalendarWidget />

      {/* ── RANKS OVERVIEW ── */}
      <RanksOverviewWidget />

    </div>
  )
}
