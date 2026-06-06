import { useId } from 'react'
import { getLevelMeta, MAX_LEVEL } from '@/lib/xpSystem'

// ─────────────────────────────────────────────
// SIZE CONFIG
// ─────────────────────────────────────────────

const SIZE_CONFIG = {
  sm: { svg: 52,  stroke: 4,  labelSize: '20px', gap: 2  },
  md: { svg: 76,  stroke: 5,  labelSize: '28px', gap: 2  },
  lg: { svg: 104, stroke: 7,  labelSize: '40px', gap: 3  },
} as const

type BadgeSize = keyof typeof SIZE_CONFIG

// ─────────────────────────────────────────────
// CIRCULAR PROGRESS SVG
// ─────────────────────────────────────────────

interface CircularProgressProps {
  progress: number   // 0–1
  size: BadgeSize
  color: string      // ring color
  isMax?: boolean
}

function CircularProgress({ progress, size, color, isMax }: CircularProgressProps) {
  const uid = useId()
  const cfg = SIZE_CONFIG[size]
  const c   = cfg.svg / 2
  const r   = c - cfg.stroke / 2 - 2
  const circumference = 2 * Math.PI * r
  const dashOffset    = circumference * (1 - Math.min(1, progress))

  const glowId     = `glow-${uid}`
  const gradientId = `grad-${uid}`

  return (
    <svg
      width={cfg.svg}
      height={cfg.svg}
      viewBox={`0 0 ${cfg.svg} ${cfg.svg}`}
      style={{ display: 'block', overflow: 'visible' }}
      aria-hidden="true"
    >
      <defs>
        {/* Neon glow filter */}
        <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={isMax ? '3' : '2'} result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Arc gradient: lighter at start, richer at end */}
        <linearGradient id={gradientId} gradientUnits="userSpaceOnUse"
          x1={c} y1={0} x2={c} y2={cfg.svg}>
          <stop offset="0%"   stopColor={color} stopOpacity="0.6" />
          <stop offset="100%" stopColor={color} stopOpacity="1"   />
        </linearGradient>
      </defs>

      {/* Track ring */}
      <circle
        cx={c} cy={c} r={r}
        fill="none"
        stroke="rgba(255,255,255,0.07)"
        strokeWidth={cfg.stroke}
      />

      {/* Progress arc */}
      {progress > 0 && (
        <circle
          cx={c} cy={c} r={r}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={cfg.stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${c} ${c})`}
          filter={`url(#${glowId})`}
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)' }}
        />
      )}

      {/* Pulsing outer glow ring when at max */}
      {isMax && (
        <circle
          cx={c} cy={c} r={r + cfg.stroke / 2 + 1}
          fill="none"
          stroke={color}
          strokeWidth={1}
          strokeOpacity={0.4}
          filter={`url(#${glowId})`}
          style={{ animation: 'levelPulse 2s ease-in-out infinite' }}
        />
      )}
    </svg>
  )
}

// ─────────────────────────────────────────────
// LEVEL BADGE (main export)
// ─────────────────────────────────────────────

interface LevelBadgeProps {
  level: number
  currentLevelXp: number
  nextLevelXp: number
  size?: BadgeSize
  /** Show XP numbers below the ring */
  showXP?: boolean
}

export default function LevelBadge({
  level,
  currentLevelXp,
  nextLevelXp,
  size = 'md',
  showXP = false,
}: LevelBadgeProps) {
  const cfg      = SIZE_CONFIG[size]
  const meta     = getLevelMeta(level)
  const isMax    = level >= MAX_LEVEL
  const progress = isMax ? 1 : nextLevelXp === 0 ? 0 : currentLevelXp / nextLevelXp

  return (
    <div className="flex flex-col items-center" style={{ gap: cfg.gap }}>
      {/* Ring + center content */}
      <div className="relative" style={{ width: cfg.svg, height: cfg.svg }}>
        {/* SVG ring */}
        <CircularProgress
          progress={progress}
          size={size}
          color={meta.ringColor}
          isMax={isMax}
        />

        {/* Center overlay */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center select-none"
          style={{ pointerEvents: 'none' }}
        >
          {/* Level number */}
          <span
            style={{
              fontSize: cfg.labelSize,
              fontWeight: 900,
              lineHeight: 1,
              fontFamily: 'var(--font-display)',
              color: '#fff',
              textShadow: `0 0 12px ${meta.color}`,
              letterSpacing: '-0.02em',
            }}
          >
            {isMax ? '★' : level}
          </span>
        </div>
      </div>

      {/* XP progress text */}
      {showXP && (
        <div className="text-center" style={{ gap: 0 }}>
          <p
            style={{
              fontSize: '10px',
              fontWeight: 700,
              color: meta.ringColor,
              fontFamily: 'var(--font-sans)',
              lineHeight: 1,
            }}
          >
            {isMax ? 'MAX LEVEL' : `${currentLevelXp} / ${nextLevelXp} XP`}
          </p>
          <p
            style={{
              fontSize: '9px',
              color: 'var(--color-text-muted)',
              marginTop: '2px',
              lineHeight: 1,
            }}
          >
            {meta.label} Lv.{level}
          </p>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// INLINE ANIMATION STYLES  (injected once)
// ─────────────────────────────────────────────

// Inject keyframe for max-level pulsing ring
if (typeof document !== 'undefined') {
  const styleId = '__lvl-badge-keyframes__'
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style')
    style.id = styleId
    style.textContent = `
      @keyframes levelPulse {
        0%, 100% { stroke-opacity: 0.15; }
        50%       { stroke-opacity: 0.55; }
      }
    `
    document.head.appendChild(style)
  }
}
