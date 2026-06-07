import { X, Clock, Dumbbell, Trophy, Trash2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import type { WorkoutLog } from '@/types/workout'
import { createPortal } from 'react-dom'
import { useWorkoutStore } from '@/store/useWorkoutStore'
import { useLogStore } from '@/store/useLogStore'

interface LogDetailsModalProps {
  log: WorkoutLog | null
  onClose: () => void
}

export default function LogDetailsModal({ log, onClose }: LogDetailsModalProps) {
  const { exercises } = useWorkoutStore()
  const { removeLog } = useLogStore()

  useEffect(() => {
    if (log) {
      setShowConfirm(false)
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = 'unset' }
    }
  }, [log])

  const [showConfirm, setShowConfirm] = useState(false)

  if (!log) return null

  const handleDelete = () => {
    setShowConfirm(true)
  }

  const confirmDelete = () => {
    removeLog(log.id)
    onClose()
  }

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m}m ${s}s`
  }

  const d = new Date(log.date)
  const displayDate = d.toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })



  return createPortal(
    <>
      <div 
        className="fixed inset-0 z-50 transition-opacity" 
        style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }} 
        onClick={onClose} 
      />
      <div 
        className="fixed inset-0 z-50 p-6 animate-fade-in-up flex flex-col gap-6 overflow-y-auto"
        style={{ background: 'var(--color-surface-900)' }}
      >
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}>
              {log.planName}
            </h2>
            <p className="text-sm mt-1 capitalize" style={{ color: 'var(--color-text-muted)' }}>
              {displayDate}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleDelete}
              className="w-10 h-10 flex items-center justify-center rounded-full transition-all active:scale-90 flex-shrink-0"
              style={{ background: 'color-mix(in srgb, #ef4444 15%, transparent)' }}
            >
              <Trash2 size={18} color="#f87171" />
            </button>
            <button 
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-full transition-all active:scale-90 flex-shrink-0"
              style={{ background: 'var(--color-surface-800)' }}
            >
              <X size={20} color="var(--color-text-secondary)" />
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-2xl flex flex-col gap-1" style={{ background: 'var(--color-surface-800)', border: '1px solid var(--color-surface-700)' }}>
            <div className="flex items-center gap-2 mb-1" style={{ color: 'var(--color-text-muted)' }}>
              <Clock size={16} />
              <span className="text-xs font-bold uppercase tracking-wider">Czas</span>
            </div>
            <span className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{formatTime(log.durationSeconds)}</span>
          </div>
          <div className="p-4 rounded-2xl flex flex-col gap-1" style={{ background: 'var(--color-surface-800)', border: '1px solid var(--color-surface-700)' }}>
            <div className="flex items-center gap-2 mb-1" style={{ color: 'var(--color-text-muted)' }}>
              <Trophy size={16} color="#fbbf24" />
              <span className="text-xs font-bold uppercase tracking-wider">Zdobyte XP</span>
            </div>
            <span className="text-xl font-bold" style={{ color: '#fbbf24' }}>+{log.totalXpEarned}</span>
          </div>
        </div>

        {/* Exercises List */}
        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Wykonane ćwiczenia</h3>
          {log.exercises.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Brak zapisanych ćwiczeń.</p>
          ) : (
            log.exercises.map((ex, i) => {
              const def = exercises.find(e => e.id === ex.exerciseId)
              const isBodyweight = def?.category === 'bodyweight'
              const isPureBodyweight = isBodyweight && !['weighted_pull_up', 'weighted_chin_up', 'weighted_dip'].includes(ex.exerciseId)
              
              const hasSupersetWithPrev = i > 0 && !!ex.supersetGroupId && ex.supersetGroupId === log.exercises[i - 1]?.supersetGroupId
              const hasSupersetWithNext = i < log.exercises.length - 1 && !!ex.supersetGroupId && ex.supersetGroupId === log.exercises[i + 1]?.supersetGroupId

              return (
                <div key={i} className="rounded-2xl overflow-hidden relative" style={{ 
                  background: 'var(--color-surface-800)', 
                  border: '1px solid var(--color-surface-700)',
                  borderTopWidth: hasSupersetWithPrev ? '0px' : '1px',
                  borderTopLeftRadius: hasSupersetWithPrev ? '0' : '1rem',
                  borderTopRightRadius: hasSupersetWithPrev ? '0' : '1rem',
                  borderBottomLeftRadius: hasSupersetWithNext ? '0' : '1rem',
                  borderBottomRightRadius: hasSupersetWithNext ? '0' : '1rem',
                  marginTop: hasSupersetWithPrev ? '-16px' : '0'
                }}>
                  {/* Superset indicator bar */}
                  {(hasSupersetWithPrev || hasSupersetWithNext) && (
                    <div 
                      className="absolute left-0 top-0 bottom-0 w-1.5 z-10"
                      style={{ background: '#818cf8' }}
                    />
                  )}
                  <div className="p-4 border-b border-white/5 flex items-center gap-3 relative z-0">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--color-surface-700)' }}>
                    <Dumbbell size={18} color="var(--color-text-primary)" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-sm" style={{ color: 'var(--color-text-primary)' }}>
                      {def?.name || ex.exerciseId}
                    </h4>
                  </div>
                  {ex.skipped && (
                    <span className="text-xs px-2 py-1 rounded-lg font-bold" style={{ background: 'rgba(239,68,68,0.2)', color: '#f87171' }}>
                      POMINIĘTE
                    </span>
                  )}
                </div>
                {!ex.skipped && ex.actualSets.length > 0 && (
                  <div className="p-4 bg-black/20 overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead>
                        <tr style={{ color: 'var(--color-text-muted)' }}>
                          <th className="pb-2 font-medium">Seria</th>
                          <th className="pb-2 font-medium">Ciężar</th>
                          <th className="pb-2 font-medium">Powt.</th>
                          <th className="pb-2 font-medium text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ex.actualSets.map((set, j) => (
                          <tr key={j} style={{ borderTop: '1px solid var(--color-surface-700)' }}>
                            <td className="py-2 text-xs font-bold" style={{ color: 'var(--color-text-secondary)' }}>{set.setNumber}</td>
                            <td className="py-2" style={{ color: 'var(--color-text-primary)' }}>
                              {set.timeSeconds !== undefined || isPureBodyweight ? '-' : `${set.weight ?? 0} kg`}
                            </td>
                            <td className="py-2" style={{ color: 'var(--color-text-primary)' }}>
                              {set.timeSeconds !== undefined ? `${set.timeSeconds}s` : set.reps}
                            </td>
                            <td className="py-2 text-right">
                              {set.completed ? (
                                <span style={{ color: set.isSuccess ? '#10b981' : '#f59e0b', fontWeight: 'bold' }}>✓</span>
                              ) : (
                                <span style={{ color: '#ef4444', fontWeight: 'bold' }}>✗</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              )
            })
          )}
        </div>
      </div>

      {/* Delete confirmation dialog */}
      {showConfirm && (
        <>
          <div
            className="fixed inset-0 z-[60] animate-fade-in"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
            onClick={() => setShowConfirm(false)}
          />
          <div
            className="fixed z-[60] left-4 right-4 bottom-24 rounded-3xl p-6 flex flex-col gap-4 animate-fade-in-up"
            style={{ background: 'var(--color-surface-800)', border: '1px solid var(--color-surface-500)' }}
          >
            <div className="text-center">
              <p className="text-lg font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>
                Usunąć wpis?
              </p>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Ta operacja jest nieodwracalna.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all active:scale-95"
                style={{ background: 'var(--color-surface-700)', color: 'var(--color-text-primary)' }}
              >
                Anuluj
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all active:scale-95"
                style={{ background: '#dc2626', color: '#fff' }}
              >
                Usuń
              </button>
            </div>
          </div>
        </>
      )}
    </>,
    document.body
  )
}
