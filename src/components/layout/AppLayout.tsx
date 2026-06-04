import type { ReactNode } from 'react'
import BottomNav from './BottomNav'

interface Props {
  children: ReactNode
}

export default function AppLayout({ children }: Props) {
  return (
    <div
      className="min-h-dvh flex flex-col"
      style={{ background: 'var(--color-surface-900)' }}
    >
      {/* Page content — padded at bottom to clear the fixed nav */}
      <main
        className="flex-1 flex flex-col"
        style={{ paddingBottom: 'calc(64px + env(safe-area-inset-bottom))' }}
      >
        {children}
      </main>

      <BottomNav />
    </div>
  )
}
