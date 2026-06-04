import { Dumbbell, TrendingUp, Trophy, Zap } from 'lucide-react'
import { useProfileStore } from '@/store/useProfileStore'

const FEATURE_CARDS = [
  { icon: Dumbbell,   label: 'Plany treningowe',  description: 'Blueprinty i ćwiczenia', color: '#6366f1' },
  { icon: TrendingUp, label: 'Progresja',          description: '+2.5 kg per sukces',     color: '#10b981' },
  { icon: Trophy,     label: 'System rang',        description: 'Bronze → Damascus',       color: '#fbbf24' },
  { icon: Zap,        label: 'Aktywna sesja',      description: 'Timer i kolejka ćwiczeń', color: '#8b5cf6' },
]

export default function HomePage() {
  const profile = useProfileStore((s) => s.profile)
  const name = profile?.name ?? 'Atleta'

  return (
    <div className="flex flex-col px-4 pt-8 pb-4 gap-6">
      {/* Header */}
      <div className="flex flex-col gap-1 animate-fade-in-up">
        {/* Ambient glow */}
        <div
          className="absolute top-0 left-0 right-0 h-64 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 120% 60% at 50% 0%, color-mix(in srgb, #6366f1 18%, transparent), transparent)',
          }}
        />
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          {new Date().toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
        <h1
          className="text-3xl font-bold leading-tight"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}
        >
          Cześć, {name}! 👋
        </h1>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Czas na trening?
        </p>
      </div>

      {/* Quick Start CTA */}
      <div
        className="relative overflow-hidden rounded-2xl p-5 animate-fade-in-up"
        style={{
          background: 'linear-gradient(135deg, #4338ca, #7c3aed)',
          boxShadow: '0 8px 32px color-mix(in srgb, #6366f1 35%, transparent)',
          animationDelay: '0.05s',
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

      {/* Feature grid */}
      <div className="grid grid-cols-2 gap-3">
        {FEATURE_CARDS.map(({ icon: Icon, label, description, color }, i) => (
          <div
            key={label}
            className="rounded-2xl p-4 flex flex-col gap-3 animate-fade-in-up"
            style={{
              background: 'var(--color-surface-800)',
              border: '1px solid var(--color-surface-600)',
              animationDelay: `${0.1 + i * 0.05}s`,
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

      {/* Coming soon indicator */}
      <div
        className="rounded-2xl p-4 text-center animate-fade-in-up"
        style={{
          background: 'var(--color-surface-800)',
          border: '1px solid var(--color-surface-600)',
          animationDelay: '0.3s',
        }}
      >
        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          🚀 KROK 2 ukończony — budujemy dalej!
        </p>
      </div>
    </div>
  )
}
