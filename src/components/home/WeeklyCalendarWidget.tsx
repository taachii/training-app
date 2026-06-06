import { useState } from 'react'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'

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

export default function WeeklyCalendarWidget() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const today = new Date()
  
  const days = getDaysOfWeek(currentDate)
  
  const handlePrevWeek = () => {
    const next = new Date(currentDate)
    next.setDate(currentDate.getDate() - 7)
    setCurrentDate(next)
  }
  
  const handleNextWeek = () => {
    const next = new Date(currentDate)
    next.setDate(currentDate.getDate() + 7)
    setCurrentDate(next)
  }

  return (
    <div 
      className="rounded-2xl p-4 animate-fade-in-up"
      style={{
        background: 'var(--color-surface-800)',
        border: '1px solid var(--color-surface-600)'
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalendarIcon size={16} style={{ color: '#8b5cf6' }} />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            {currentDate.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' })}
          </h2>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={handlePrevWeek}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-all active:scale-90"
            style={{ background: 'var(--color-surface-700)' }}
          >
            <ChevronLeft size={16} color="var(--color-text-secondary)" />
          </button>
          <button 
            onClick={handleNextWeek}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-all active:scale-90"
            style={{ background: 'var(--color-surface-700)' }}
          >
            <ChevronRight size={16} color="var(--color-text-secondary)" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {days.map((day, idx) => {
          const isToday = 
            day.getDate() === today.getDate() && 
            day.getMonth() === today.getMonth() && 
            day.getFullYear() === today.getFullYear()
            
          const dayName = day.toLocaleDateString('pl-PL', { weekday: 'short' }).substring(0, 3)

          return (
            <button
              key={idx}
              className="flex flex-col items-center justify-center py-2 rounded-xl transition-all active:scale-95 cursor-pointer"
              style={{
                background: isToday ? 'color-mix(in srgb, #8b5cf6 25%, transparent)' : 'var(--color-surface-700)',
                border: isToday ? '1px solid #8b5cf6' : '1px solid transparent'
              }}
            >
              <span 
                className="text-[10px] font-medium mb-1 uppercase"
                style={{ color: isToday ? '#c4b5fd' : 'var(--color-text-muted)' }}
              >
                {dayName}
              </span>
              <span 
                className="text-sm font-bold"
                style={{ color: isToday ? '#fff' : 'var(--color-text-primary)' }}
              >
                {day.getDate()}
              </span>
              {/* Dot indicator placeholder */}
              <div 
                className="w-1 h-1 rounded-full mt-1.5"
                style={{ background: isToday ? '#8b5cf6' : 'transparent' }}
              />
            </button>
          )
        })}
      </div>
    </div>
  )
}
