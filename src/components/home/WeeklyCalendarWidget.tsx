import { useState } from 'react'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, ChevronDown, ChevronUp } from 'lucide-react'
import { useScheduleStore } from '@/store/useScheduleStore'
import DayScheduleModal from './DayScheduleModal'

// Helper to get days of the current week (Mon-Sun)
function getDaysOfWeek(date: Date) {
  const current = new Date(date)
  const day = current.getDay()
  const diff = current.getDate() - day + (day === 0 ? -6 : 1) // adjust when day is sunday
  
  const monday = new Date(current.setDate(diff))
  const days = []
  
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    days.push(d)
  }
  return days
}

// Helper to get days of the 42-day month grid (starting on Monday)
function getDaysOfMonth(date: Date) {
  const year = date.getFullYear()
  const month = date.getMonth()
  const firstDayOfMonth = new Date(year, month, 1)
  
  const startDay = firstDayOfMonth.getDay()
  const offset = startDay === 0 ? 6 : startDay - 1
  
  const startDate = new Date(firstDayOfMonth)
  startDate.setDate(firstDayOfMonth.getDate() - offset)
  
  const days = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(startDate)
    d.setDate(startDate.getDate() + i)
    days.push(d)
  }
  return days
}

export default function WeeklyCalendarWidget() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [isExpanded, setIsExpanded] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  
  const today = new Date()
  const { scheduledWorkouts } = useScheduleStore()
  
  const days = isExpanded ? getDaysOfMonth(currentDate) : getDaysOfWeek(currentDate)
  
  const handlePrev = () => {
    const next = new Date(currentDate)
    if (isExpanded) {
      next.setMonth(currentDate.getMonth() - 1)
    } else {
      next.setDate(currentDate.getDate() - 7)
    }
    setCurrentDate(next)
  }
  
  const handleNext = () => {
    const next = new Date(currentDate)
    if (isExpanded) {
      next.setMonth(currentDate.getMonth() + 1)
    } else {
      next.setDate(currentDate.getDate() + 7)
    }
    setCurrentDate(next)
  }

  const handleDayClick = (day: Date) => {
    setSelectedDate(day)
    setModalOpen(true)
  }

  return (
    <div 
      className="rounded-2xl p-4 animate-fade-in-up flex flex-col gap-3 transition-all"
      style={{
        background: 'var(--color-surface-800)',
        border: '1px solid var(--color-surface-600)'
      }}
    >
      <div className="flex items-center justify-between mb-1">
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 px-2 py-1 -ml-2 rounded-lg transition-all active:bg-surface-700"
        >
          <CalendarIcon size={16} style={{ color: '#8b5cf6' }} />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1">
            {currentDate.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' })}
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </h2>
        </button>
        <div className="flex items-center gap-1">
          <button 
            onClick={handlePrev}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-all active:scale-90"
            style={{ background: 'var(--color-surface-700)' }}
          >
            <ChevronLeft size={16} color="var(--color-text-secondary)" />
          </button>
          <button 
            onClick={handleNext}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-all active:scale-90"
            style={{ background: 'var(--color-surface-700)' }}
          >
            <ChevronRight size={16} color="var(--color-text-secondary)" />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="grid grid-cols-7 gap-1.5 mb-1">
          {['PON', 'WT', 'ŚR', 'CZW', 'PT', 'SOB', 'NIE'].map(d => (
            <div key={d} className="text-[10px] font-medium text-center" style={{ color: 'var(--color-text-muted)' }}>
              {d}
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-7 gap-1.5">
        {days.map((day, idx) => {
          const isToday = 
            day.getDate() === today.getDate() && 
            day.getMonth() === today.getMonth() && 
            day.getFullYear() === today.getFullYear()
            
          const isCurrentMonth = day.getMonth() === currentDate.getMonth()
          const dayName = day.toLocaleDateString('pl-PL', { weekday: 'short' }).substring(0, 3)
          
          const dateStr = [
            day.getFullYear(),
            String(day.getMonth() + 1).padStart(2, '0'),
            String(day.getDate()).padStart(2, '0')
          ].join('-')
          
          const hasWorkouts = scheduledWorkouts.some(sw => sw.date === dateStr && !sw.isCompleted)

          return (
            <button
              key={idx}
              onClick={() => handleDayClick(day)}
              className="flex flex-col items-center justify-center py-2 rounded-xl transition-all active:scale-95 cursor-pointer"
              style={{
                background: isToday ? 'color-mix(in srgb, #8b5cf6 25%, transparent)' : 'var(--color-surface-700)',
                border: isToday ? '1px solid #8b5cf6' : '1px solid transparent',
                opacity: !isExpanded || isCurrentMonth ? 1 : 0.3
              }}
            >
              {!isExpanded && (
                <span 
                  className="text-[10px] font-medium mb-1 uppercase"
                  style={{ color: isToday ? '#c4b5fd' : 'var(--color-text-muted)' }}
                >
                  {dayName}
                </span>
              )}
              <span 
                className="text-sm font-bold"
                style={{ color: isToday ? '#fff' : 'var(--color-text-primary)' }}
              >
                {day.getDate()}
              </span>
              <div 
                className="w-1.5 h-1.5 rounded-full mt-1.5"
                style={{ background: hasWorkouts ? '#34d399' : 'transparent' }}
              />
            </button>
          )
        })}
      </div>

      {selectedDate && (
        <DayScheduleModal 
          isOpen={modalOpen} 
          onClose={() => setModalOpen(false)} 
          date={selectedDate} 
        />
      )}
    </div>
  )
}
