import { useEffect, useState, useRef } from 'react'
import { levelFromTotalXp, totalXpForLevel, getLevelMeta, MAX_LEVEL, MAX_TOTAL_XP } from '@/lib/xpSystem'

interface XpSummaryAnimationProps {
  initialTotalXp: number
  sessionEarnedXp: number
}

const ANIMATION_DURATION_MS = 2500

export default function XpSummaryAnimation({ initialTotalXp, sessionEarnedXp }: XpSummaryAnimationProps) {
  const [currentTotalXp, setCurrentTotalXp] = useState(initialTotalXp)
  const [isLevelUp, setIsLevelUp] = useState(false)
  const [tickedXp, setTickedXp] = useState(0)

  const { level, currentLevelXp } = levelFromTotalXp(currentTotalXp)
  const isMaxLevel = level >= MAX_LEVEL
  const xpForNextLevel = isMaxLevel ? 1 : totalXpForLevel(level + 1) - totalXpForLevel(level)
  const progressPercent = isMaxLevel ? 100 : Math.min(100, Math.max(0, (currentLevelXp / xpForNextLevel) * 100))
  const meta = getLevelMeta(level)

  const previousLevelRef = useRef(level)

  useEffect(() => {
    let startTimestamp: number | null = null
    let animationFrameId: number

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp
      const elapsed = timestamp - startTimestamp
      const progress = Math.min(1, elapsed / ANIMATION_DURATION_MS)

      // Easing function (easeOutCubic)
      const easeProgress = 1 - Math.pow(1 - progress, 3)
      const currentEarned = Math.floor(easeProgress * sessionEarnedXp)

      setTickedXp(currentEarned)
      const nextTotalXp = Math.min(initialTotalXp + currentEarned, MAX_TOTAL_XP)
      setCurrentTotalXp(nextTotalXp)

      const nextLevelObj = levelFromTotalXp(nextTotalXp)
      if (nextLevelObj.level > previousLevelRef.current) {
        setIsLevelUp(true)
        previousLevelRef.current = nextLevelObj.level
        // Remove level up animation state after a short delay
        setTimeout(() => setIsLevelUp(false), 2000)
      }

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step)
      }
    }

    // Delay start slightly for better UX when modal opens
    const timeoutId = setTimeout(() => {
      animationFrameId = requestAnimationFrame(step)
    }, 400)

    return () => {
      clearTimeout(timeoutId)
      if (animationFrameId) cancelAnimationFrame(animationFrameId)
    }
  }, [initialTotalXp, sessionEarnedXp])

  return (
    <div className="w-full flex flex-col items-center gap-4 py-2">
      {/* Level Badge & XP Count */}
      <div className="relative flex flex-col items-center justify-center">
        {/* Glow effect behind badge */}
        <div
          className="absolute inset-0 rounded-full blur-2xl transition-all duration-300"
          style={{
            background: meta.color,
            opacity: isLevelUp ? 0.6 : 0.2,
            transform: isLevelUp ? 'scale(1.5)' : 'scale(1)',
          }}
        />

        <div
          className={`relative z-10 w-24 h-24 rounded-full flex flex-col items-center justify-center shadow-lg transition-transform duration-300 ${
            isLevelUp ? 'scale-125' : 'scale-100'
          }`}
          style={{
            background: 'var(--color-surface-800)',
            border: `2px solid ${meta.ringColor}`,
            boxShadow: `0 0 ${isLevelUp ? '30px' : '15px'} ${meta.color}40`,
          }}
        >
          <span className="font-black text-5xl leading-none" style={{ color: '#fff', fontFamily: 'var(--font-display)', textShadow: `0 0 16px ${meta.color}` }}>
            {level}
          </span>
        </div>

        {/* Level Up Text */}
        <div
          className={`absolute -top-6 text-xl font-black uppercase tracking-widest whitespace-nowrap transition-all duration-500 ${
            isLevelUp ? 'opacity-100 translate-y-0 text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]' : 'opacity-0 translate-y-4'
          }`}
          style={{ fontFamily: 'var(--font-display)', zIndex: 20 }}
        >
          Level Up!
        </div>
      </div>

      {/* Ticking Earned XP Display */}
      <div className="text-center mt-2">
        <div className="text-3xl font-black" style={{ color: '#fff', fontFamily: 'var(--font-display)' }}>
          +{tickedXp} <span className="text-lg opacity-60">XP</span>
        </div>
        <div className="text-xs mt-1" style={{ color: meta.color }}>
          {meta.label}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-sm mt-4">
        <div className="flex justify-between text-xs mb-2 font-bold" style={{ color: 'rgba(255,255,255,0.5)' }}>
          <span>{Math.floor(currentLevelXp)} XP</span>
          <span>{isMaxLevel ? 'MAX' : `${Math.floor(xpForNextLevel)} XP`}</span>
        </div>
        <div className="h-3 w-full rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
          <div
            className="h-full rounded-full"
            style={{
              width: `${progressPercent}%`,
              background: `linear-gradient(90deg, ${meta.color}, ${meta.ringColor})`,
              boxShadow: `0 0 10px ${meta.color}`,
            }}
          />
        </div>
      </div>
    </div>
  )
}
