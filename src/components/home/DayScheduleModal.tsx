import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { X, Plus, Trash2, Dumbbell } from 'lucide-react'
import { useScheduleStore } from '@/store/useScheduleStore'
import { useWorkoutStore } from '@/store/useWorkoutStore'

interface DayScheduleModalProps {
  isOpen: boolean
  onClose: () => void
  date: Date
}

export default function DayScheduleModal({ isOpen, onClose, date }: DayScheduleModalProps) {
  const navigate = useNavigate()
  const { scheduledWorkouts, scheduleWorkout, removeScheduledWorkout } = useScheduleStore()
  const { plans } = useWorkoutStore()
  
  const [isAdding, setIsAdding] = useState(false)

  if (!isOpen) return null

  const today = new Date()
  const isToday = 
    date.getDate() === today.getDate() && 
    date.getMonth() === today.getMonth() && 
    date.getFullYear() === today.getFullYear()

  // Format date to YYYY-MM-DD
  const dateStr = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0')
  ].join('-')

  const todaysWorkouts = scheduledWorkouts.filter(w => w.date === dateStr && !w.isCompleted)
  
  // Pretty title
  const displayDate = date.toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })

  const handleSchedule = (planId: string) => {
    scheduleWorkout(dateStr, planId)
    setIsAdding(false)
  }

  const handleStartWorkout = (planId: string) => {
    onClose()
    navigate(`/session/start/${planId}`)
  }

  return createPortal(
    <>
      <div 
        className="fixed inset-0 z-50 transition-opacity" 
        style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }} 
        onClick={onClose} 
      />
      <div 
        className="fixed inset-0 z-50 p-6 animate-fade-in-up flex flex-col gap-5 overflow-y-auto"
        style={{ background: 'var(--color-surface-900)' }}
      >
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-2xl font-bold capitalize" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}>
            {displayDate}
          </h2>
          <button 
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full transition-all active:scale-90"
            style={{ background: 'var(--color-surface-700)' }}
          >
            <X size={20} color="var(--color-text-secondary)" />
          </button>
        </div>

        {isAdding ? (
          <div className="flex flex-col gap-4 animate-fade-in-up">
            <h3 className="text-sm font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
              Wybierz plan do zaplanowania:
            </h3>
            {plans.length === 0 ? (
              <p className="text-sm text-center py-6" style={{ color: 'var(--color-text-muted)' }}>
                Brak dostępnych planów. Utwórz plan w zakładce "Plany".
              </p>
            ) : (
              plans.map(plan => (
                <button
                  key={plan.id}
                  onClick={() => handleSchedule(plan.id)}
                  className="flex items-center gap-4 p-4 rounded-xl transition-all active:scale-95 text-left"
                  style={{ background: 'var(--color-surface-800)', border: '1px solid var(--color-surface-600)' }}
                >
                  <div className="w-12 h-12 flex items-center justify-center rounded-lg shadow-inner text-2xl" style={{ background: 'var(--color-surface-700)' }}>
                    {plan.icon ?? '💪'}
                  </div>
                  <span className="flex-1 font-bold text-base" style={{ color: 'var(--color-text-primary)' }}>
                    {plan.name}
                  </span>
                  <Plus size={20} style={{ color: '#818cf8' }} />
                </button>
              ))
            )}
            <button 
              onClick={() => setIsAdding(false)}
              className="mt-4 text-base font-medium py-3 rounded-xl"
              style={{ color: 'var(--color-text-muted)', border: '1px dashed var(--color-surface-600)' }}
            >
              Anuluj
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {todaysWorkouts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 opacity-60">
                <Dumbbell size={40} color="var(--color-text-muted)" />
                <p className="text-base" style={{ color: 'var(--color-text-muted)' }}>Brak zaplanowanych treningów</p>
              </div>
            ) : (
              todaysWorkouts.map(sw => {
                const plan = plans.find(p => p.id === sw.planId)
                if (!plan) return null
                return (
                  <div 
                    key={sw.id} 
                    className="flex flex-col rounded-2xl overflow-hidden"
                    style={{ background: 'var(--color-surface-800)', border: '1px solid var(--color-surface-600)' }}
                  >
                    <div className="flex items-center justify-between p-4" style={{ borderBottom: '1px solid var(--color-surface-700)' }}>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 flex items-center justify-center rounded-lg shadow-inner text-2xl" style={{ background: 'var(--color-surface-700)' }}>
                          {plan.icon ?? '💪'}
                        </div>
                        <span className="font-bold text-base" style={{ color: 'var(--color-text-primary)' }}>
                          {plan.name}
                        </span>
                      </div>
                      <button 
                        onClick={() => removeScheduledWorkout(sw.id)}
                        className="w-10 h-10 flex items-center justify-center rounded-xl transition-all active:scale-90"
                        style={{ background: 'color-mix(in srgb, #ef4444 15%, transparent)' }}
                        aria-label="Usuń z harmonogramu"
                      >
                        <Trash2 size={16} color="#f87171" />
                      </button>
                    </div>
                    {isToday && (
                      <button
                        onClick={() => handleStartWorkout(plan.id)}
                        className="w-full py-3.5 text-sm font-bold uppercase tracking-wider transition-all active:bg-indigo-500/20"
                        style={{ color: '#818cf8', background: 'color-mix(in srgb, #6366f1 10%, transparent)' }}
                      >
                        Rozpocznij teraz
                      </button>
                    )}
                  </div>
                )
              })
            )}

            <button
              onClick={() => setIsAdding(true)}
              className="flex items-center justify-center gap-2 w-full py-4 mt-4 rounded-2xl text-base font-bold transition-all active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #4338ca, #7c3aed)',
                color: '#fff',
                boxShadow: '0 4px 20px rgba(99,102,241,0.3)',
              }}
            >
              <Plus size={18} />
              Zaplanuj trening
            </button>
          </div>
        )}
      </div>
    </>,
    document.body
  )
}
