import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav'

export default function AppLayout() {
  return (
    <div
      className="min-h-dvh flex flex-col"
      style={{ background: 'var(--color-surface-900)' }}
    >
      {/* Page content — padded at bottom to clear the fixed nav */}
      <main
        className="flex-1 flex flex-col"
        style={{ paddingBottom: 'calc(72px + env(safe-area-inset-bottom))' }}
      >
        <Outlet />
      </main>

      <BottomNav />
    </div>
  )
}
