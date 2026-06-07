import { useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useLogStore } from '@/store/useLogStore'
import { Dumbbell, Clock, BarChart2, ChevronRight, CheckCircle2, ChevronLeft, Filter } from 'lucide-react'
import LogDetailsModal from '@/components/history/LogDetailsModal'

export default function HistoryPage() {
  const { logs } = useLogStore()
  const [searchParams, setSearchParams] = useSearchParams()
  
  const logIdFromUrl = searchParams.get('log')
  const selectedLog = useMemo(() => {
    if (!logIdFromUrl) return null
    return logs.find(l => l.id === logIdFromUrl) || null
  }, [logIdFromUrl, logs])

  const handleOpenLog = (id: string) => {
    setSearchParams({ log: id })
  }

  const handleCloseLog = () => {
    setSearchParams({})
  }

  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  const [selectedPlanName, setSelectedPlanName] = useState<string>('all')

  const uniquePlanNames = useMemo(() => Array.from(new Set(logs.map(l => l.planName))), [logs])

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const logDate = new Date(log.date)
      const isSameMonth = logDate.getFullYear() === currentMonth.getFullYear() && logDate.getMonth() === currentMonth.getMonth()
      const matchesPlan = selectedPlanName !== 'all' ? log.planName === selectedPlanName : true
      return isSameMonth && matchesPlan
    })
  }, [logs, currentMonth, selectedPlanName])

  const prevMonth = () => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  const nextMonth = () => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))

  const formatMonthYear = (d: Date) => {
    return d.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' })
  }

  const formatShortDate = (ds: string) => {
    const d = new Date(ds)
    return d.toLocaleDateString('pl-PL', { weekday: 'short', day: 'numeric', month: 'short' })
  }

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60)
    return `${m}m`
  }

  return (
    <div className="flex flex-col min-h-full px-4 pt-8 pb-32 gap-6 relative">
      {/* Ambient glow */}
      <div
        className="absolute top-0 left-0 right-0 h-64 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 120% 60% at 50% 0%, color-mix(in srgb, #6366f1 10%, transparent), transparent)',
        }}
      />

      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in-up relative z-10">
        <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}>
          Dziennik
        </h1>
        <button 
          onClick={() => { alert('Statystyki zostaną wdrożone jako osobny modal!') }}
          className="w-12 h-12 flex items-center justify-center rounded-full transition-all active:scale-95"
          style={{ background: 'var(--color-surface-800)', border: '1px solid var(--color-surface-600)', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}
          aria-label="Statystyki"
        >
          <BarChart2 size={20} style={{ color: '#818cf8' }} />
        </button>
      </div>

      {/* Filters & Month Navigation */}
      <div className="flex flex-col gap-4 relative z-10 animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
        <div className="flex items-center justify-between px-2">
          <button onClick={prevMonth} className="w-10 h-10 flex items-center justify-center rounded-full transition-all active:scale-90" style={{ background: 'var(--color-surface-800)' }}>
            <ChevronLeft size={20} color="var(--color-text-secondary)" />
          </button>
          <span className="font-bold uppercase tracking-wider text-sm" style={{ color: 'var(--color-text-primary)' }}>
            {formatMonthYear(currentMonth)}
          </span>
          <button onClick={nextMonth} className="w-10 h-10 flex items-center justify-center rounded-full transition-all active:scale-90" style={{ background: 'var(--color-surface-800)' }}>
            <ChevronRight size={20} color="var(--color-text-secondary)" />
          </button>
        </div>

        {uniquePlanNames.length > 0 && (
          <div className="relative">
            <select
              value={selectedPlanName}
              onChange={(e) => setSelectedPlanName(e.target.value)}
              className="w-full appearance-none rounded-xl px-4 py-3 font-semibold text-sm outline-none transition-all focus:ring-2 focus:ring-indigo-500"
              style={{ background: 'var(--color-surface-800)', color: 'var(--color-text-primary)', border: '1px solid var(--color-surface-600)' }}
            >
              <option value="all">Wszystkie treningi</option>
              {uniquePlanNames.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <Filter size={16} color="var(--color-text-muted)" />
            </div>
          </div>
        )}
      </div>

      {/* Logs Feed */}
      <div className="flex flex-col gap-4 animate-fade-in-up relative z-10" style={{ animationDelay: '0.1s' }}>
        {filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4 opacity-60">
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'var(--color-surface-800)' }}>
              <Dumbbell size={32} color="var(--color-text-muted)" />
            </div>
            <p className="text-sm text-center px-8 leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
              Brak zapisanych treningów.<br/>Twój dziennik zacznie się wypełniać po pierwszej ukończonej sesji!
            </p>
          </div>
        ) : (
          filteredLogs.map((log) => {
            const completedCount = log.exercises.filter(e => !e.skipped).length
            const totalCount = log.exercises.length

            return (
              <button
                key={log.id}
                onClick={() => handleOpenLog(log.id)}
                className="flex flex-col p-5 rounded-2xl transition-all active:scale-[0.98] text-left"
                style={{ background: 'var(--color-surface-800)', border: '1px solid var(--color-surface-600)', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--color-text-primary)' }}>
                      {formatShortDate(log.date)}
                    </span>
                    {log.fullCompletion && (
                      <CheckCircle2 size={16} color="#10b981" />
                    )}
                  </div>
                  <ChevronRight size={18} color="var(--color-text-muted)" />
                </div>
                
                <h3 className="text-xl font-bold mb-3" style={{ color: 'var(--color-text-primary)' }}>
                  {log.planName}
                </h3>

                <div className="flex items-center gap-5">
                  <div className="flex items-center gap-1.5">
                    <Clock size={16} color="#818cf8" />
                    <span className="text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                      {formatTime(log.durationSeconds)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Dumbbell size={16} color="#818cf8" />
                    <span className="text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                      {completedCount}/{totalCount} ćw.
                    </span>
                  </div>
                </div>
              </button>
            )
          })
        )}
      </div>

      <LogDetailsModal 
        log={selectedLog} 
        onClose={handleCloseLog} 
      />
    </div>
  )
}
