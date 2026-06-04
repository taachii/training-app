import { NavLink } from 'react-router-dom'
import {
  Home,
  CalendarDays,
  Dumbbell,
  BarChart2,
  User,
} from 'lucide-react'

const NAV_ITEMS = [
  { to: '/',          label: 'Home',      Icon: Home        },
  { to: '/calendar',  label: 'Kalendarz', Icon: CalendarDays },
  { to: '/plans',     label: 'Plany',     Icon: Dumbbell    },
  { to: '/stats',     label: 'Statsy',    Icon: BarChart2   },
  { to: '/profile',   label: 'Profil',    Icon: User        },
] as const

export default function BottomNav() {
  return (
    <nav
      aria-label="Nawigacja główna"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        /* Safe area for iPhone home indicator */
        paddingBottom: 'env(safe-area-inset-bottom)',
        background: 'color-mix(in srgb, var(--color-surface-800) 90%, transparent)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderTop: '1px solid var(--color-surface-600)',
      }}
    >
      <ul className="flex items-stretch justify-around">
        {NAV_ITEMS.map(({ to, label, Icon }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={to === '/'}
              className="flex flex-col items-center justify-center gap-0.5 py-2 px-1 transition-all duration-200 w-full"
              style={({ isActive }) => ({
                color: isActive ? '#818cf8' : 'var(--color-text-muted)',
              })}
            >
              {({ isActive }) => (
                <>
                  <span
                    className="flex items-center justify-center w-10 h-7 rounded-xl transition-all duration-200"
                    style={
                      isActive
                        ? {
                            background: 'color-mix(in srgb, #6366f1 20%, transparent)',
                            boxShadow: '0 0 12px color-mix(in srgb, #6366f1 25%, transparent)',
                          }
                        : {}
                    }
                  >
                    <Icon
                      size={20}
                      strokeWidth={isActive ? 2.5 : 1.75}
                      aria-hidden="true"
                    />
                  </span>
                  <span
                    className="text-[10px] font-medium leading-none"
                    style={{ fontFamily: 'var(--font-sans)' }}
                  >
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
