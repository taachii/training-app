import { useProfileStore } from '@/store/useProfileStore'
import { useLogStore } from '@/store/useLogStore'
import { computeRank, RANK_DEFINITIONS } from '@/features/ranks/wilksCalculator'

const BIG_LIFTS = [
  { id: 'barbell_bench_press', label: 'Wyciskanie' },
  { id: 'barbell_squat', label: 'Przysiad' },
  { id: 'barbell_deadlift', label: 'Martwy Ciąg' }
]

export default function RanksOverviewWidget() {
  const profile = useProfileStore(s => s.profile)
  const prs = useLogStore(s => s.personalRecords)
  
  if (!profile) return null

  const getExerciseRank = (exerciseId: string) => {
    const pr = prs[exerciseId]
    if (!pr) return RANK_DEFINITIONS[0] // Unranked
    
    const res = computeRank(
      profile.gender,
      profile.weight,
      pr.weight, 
      pr.reps
    )
    return res.definition
  }

  return (
    <div className="flex flex-col gap-3 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
      <h2 className="text-xs font-bold uppercase tracking-widest pl-1" style={{ color: 'var(--color-text-muted)' }}>
        Moje Rangi
      </h2>
      
      <div className="relative">
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <div className="px-3 py-1.5 rounded-lg font-bold text-xs shadow-lg flex items-center gap-2" style={{ background: 'var(--color-surface-600)', color: 'var(--color-text-primary)' }}>
            🚧 Praca w toku
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-2 opacity-30 pointer-events-none grayscale">
        {BIG_LIFTS.map(lift => {
          const rank = getExerciseRank(lift.id)
          
          return (
            <div 
              key={lift.id}
              className="flex flex-col items-center justify-center p-3 rounded-2xl"
              style={{ 
                background: 'var(--color-surface-800)',
                border: `1px solid color-mix(in srgb, ${rank.color} 20%, var(--color-surface-600))`
              }}
            >
              <span className="text-2xl mb-1" style={{ filter: `drop-shadow(0 0 8px ${rank.color})` }}>
                {rank.emoji}
              </span>
              <span className="text-[10px] font-medium text-center uppercase mb-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                {lift.label}
              </span>
              <span className="text-xs font-bold" style={{ color: rank.color }}>
                {rank.label}
              </span>
            </div>
          )
        })}
        </div>
      </div>
    </div>
  )
}
