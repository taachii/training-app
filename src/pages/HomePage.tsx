import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, User, Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { useProfileStore, useLevelProgress, useXpForNextLevel } from '@/store/useProfileStore'
import { useSessionStore } from '@/store/useSessionStore'
import { useScheduleStore } from '@/store/useScheduleStore'
import { useWorkoutStore } from '@/store/useWorkoutStore'
import LevelBadge from '@/components/ui/LevelBadge'
import { getLevelMeta } from '@/lib/xpSystem'
import WeeklyCalendarWidget from '@/components/home/WeeklyCalendarWidget'

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
  const { scheduledWorkouts } = useScheduleStore()
  const { plans } = useWorkoutStore()

  const [elapsedSec, setElapsedSec] = useState(0)

  const todayDateStr = [
    new Date().getFullYear(),
    String(new Date().getMonth() + 1).padStart(2, '0'),
    String(new Date().getDate()).padStart(2, '0')
  ].join('-')

  const uncompletedToday = scheduledWorkouts.filter(w => w.date === todayDateStr && !w.isCompleted)
  const [selectedPlanIndex, setSelectedPlanIndex] = useState(0)

  const activeScheduled = uncompletedToday[selectedPlanIndex] || uncompletedToday[0] || null
  const scheduledPlan = activeScheduled ? plans.find(p => p.id === activeScheduled.planId) : null

  const upcomingWorkouts = scheduledWorkouts
    .filter(w => w.date > todayDateStr && !w.isCompleted)
    .sort((a, b) => a.date.localeCompare(b.date))

  const nextScheduled = upcomingWorkouts.length > 0 ? upcomingWorkouts[0] : null
  const nextScheduledPlan = nextScheduled ? plans.find(p => p.id === nextScheduled.planId) : null

  const hasActiveSession = session && session.phase !== 'done' && session.phase !== 'done_early'
  const activePlan = hasActiveSession && session?.workoutPlanId ? plans.find(p => p.id === session.workoutPlanId) : null

  // Format YYYY-MM-DD to readable short string
  const formatShortDate = (ds: string) => {
    const d = new Date(ds)
    return d.toLocaleDateString('pl-PL', { weekday: 'short', day: 'numeric', month: 'short' })
  }

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
            {name}
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
      <div
        role="button"
        tabIndex={0}
        onClick={() => {
          if (hasActiveSession) navigate(`/session/start/${session.workoutPlanId}`)
          else if (scheduledPlan) navigate(`/session/start/${scheduledPlan.id}`)
          else navigate('/plans')
        }}
        className="w-full relative overflow-hidden rounded-2xl p-5 flex flex-col items-start animate-fade-in-up text-left transition-all duration-200 active:scale-[0.98]"
        style={{
          background: scheduledPlan && !hasActiveSession
            ? 'linear-gradient(135deg, #059669, #10b981)' // Green for scheduled 
            : 'linear-gradient(135deg, #4338ca, #7c3aed)',
          boxShadow: scheduledPlan && !hasActiveSession
            ? '0 8px 32px color-mix(in srgb, #10b981 35%, transparent)'
            : '0 8px 32px color-mix(in srgb, #6366f1 35%, transparent)',
          animationDelay: '0.08s',
        }}
      >
        <div
          className="absolute -top-6 -right-6 w-28 h-28 rounded-full opacity-20"
          style={{ background: '#fff' }}
        />
        <div className="relative z-10 w-full flex items-center justify-between mb-1">
          <p className="text-xs font-semibold uppercase tracking-widest opacity-80" style={{ color: 'rgba(255,255,255,0.7)' }}>
            {hasActiveSession ? 'Trening w toku' : scheduledPlan ? (uncompletedToday.length > 1 ? `Zaplanowano na dzisiaj (${selectedPlanIndex + 1}/${uncompletedToday.length})` : 'Zaplanowano na dzisiaj') : 'Brak aktywnej sesji'}
          </p>
        </div>
        <div className="relative z-10 w-full flex flex-col gap-1">
          <div className="flex items-center gap-3 w-full min-w-0">
            {!hasActiveSession && uncompletedToday.length > 1 && scheduledPlan ? (
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <button
                  onClick={(e) => { e.stopPropagation(); setSelectedPlanIndex(prev => (prev > 0 ? prev - 1 : uncompletedToday.length - 1)) }}
                  className="w-8 h-8 flex items-center justify-center rounded-full transition-all active:scale-90"
                  style={{ background: 'rgba(255,255,255,0.2)' }}
                >
                  <ChevronLeft size={16} color="#fff" />
                </button>
                <p className="text-xl font-bold text-white truncate flex-1 text-center">
                  {scheduledPlan.name}
                </p>
                <button
                  onClick={(e) => { e.stopPropagation(); setSelectedPlanIndex(prev => (prev < uncompletedToday.length - 1 ? prev + 1 : 0)) }}
                  className="w-8 h-8 flex items-center justify-center rounded-full transition-all active:scale-90"
                  style={{ background: 'rgba(255,255,255,0.2)' }}
                >
                  <ChevronRight size={16} color="#fff" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 min-w-0">
                <p className="text-xl font-bold text-white truncate">
                  {hasActiveSession ? (activePlan?.name ?? 'Trening') : scheduledPlan ? scheduledPlan.name : 'Rozpocznij trening'}
                </p>
                {hasActiveSession && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg flex-shrink-0" style={{ background: 'rgba(0,0,0,0.2)' }}>
                    <Clock size={14} color="#c4b5fd" />
                    <span className="text-sm font-bold text-white tracking-widest">{formatTime(elapsedSec)}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {!hasActiveSession && nextScheduled && nextScheduledPlan && (
            <div className="flex items-center gap-1.5 mt-0.5 opacity-90">
              <Calendar size={12} color={scheduledPlan ? "#d1fae5" : "#c4b5fd"} />
              <span className="text-xs font-medium" style={{ color: scheduledPlan ? "#d1fae5" : "#c4b5fd" }}>
                Następny: {formatShortDate(nextScheduled.date)} ({nextScheduledPlan.name})
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── CALENDAR WIDGET ── */}
      <WeeklyCalendarWidget />

    </div>
  )
}
