// Quick placeholder factory — each page stub uses this to render a coming-soon card
import type { ReactNode } from 'react'

interface Props {
  icon: string
  title: string
  description: string
  children?: ReactNode
}

export default function PagePlaceholder({ icon, title, description, children }: Props) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center animate-fade-in-up">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-5 shadow-xl"
        style={{
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          boxShadow: '0 0 30px color-mix(in srgb, #6366f1 30%, transparent)',
        }}
      >
        {icon}
      </div>
      <h1
        className="text-2xl font-bold mb-2"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}
      >
        {title}
      </h1>
      <p className="text-sm max-w-xs" style={{ color: 'var(--color-text-secondary)' }}>
        {description}
      </p>
      {children}
    </div>
  )
}
