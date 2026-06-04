import { useProfileStore } from '@/store/useProfileStore'
import { User, Weight, Ruler, ChevronRight } from 'lucide-react'

const GENDER_LABELS = { male: 'Mężczyzna', female: 'Kobieta' }

export default function ProfilePage() {
  const profile = useProfileStore((s) => s.profile)
  const name = profile?.name ?? '—'
  const gender = profile?.gender
  const weight = profile?.weight
  const height = profile?.height

  const rows = [
    { label: 'Płeć',    value: gender ? GENDER_LABELS[gender] : '—', Icon: User    },
    { label: 'Waga',    value: weight  ? `${weight} kg`              : '—', Icon: Weight },
    { label: 'Wzrost',  value: height  ? `${height} cm`              : '—', Icon: Ruler  },
  ]

  return (
    <div className="flex flex-col px-4 pt-8 pb-4 gap-6">
      {/* Avatar & name */}
      <div className="flex flex-col items-center gap-3 animate-fade-in-up">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center text-3xl shadow-lg"
          style={{
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            boxShadow: '0 0 30px color-mix(in srgb, #6366f1 30%, transparent)',
          }}
        >
          🏋️
        </div>
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
      </div>

      {/* Profile data */}
      <div
        className="rounded-2xl overflow-hidden animate-fade-in-up"
        style={{
          background: 'var(--color-surface-800)',
          border: '1px solid var(--color-surface-600)',
          animationDelay: '0.05s',
        }}
      >
        {rows.map(({ label, value, Icon }, i) => (
          <div
            key={label}
            className="flex items-center gap-3 px-4 py-3.5"
            style={{ borderBottom: i < rows.length - 1 ? '1px solid var(--color-surface-600)' : 'none' }}
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

      {/* Note */}
      <div
        className="rounded-2xl p-4 text-center animate-fade-in-up"
        style={{
          background: 'var(--color-surface-800)',
          border: '1px solid var(--color-surface-600)',
          animationDelay: '0.1s',
        }}
      >
        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          ⚙️ Edycja profilu · Dane do kalkulatora Wilksa · Wkrótce
        </p>
      </div>
    </div>
  )
}
