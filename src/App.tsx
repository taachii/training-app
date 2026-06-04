import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AppLayout from '@/components/layout/AppLayout'
import HomePage     from '@/pages/HomePage'
import CalendarPage from '@/pages/CalendarPage'
import SessionPage  from '@/pages/SessionPage'
import StatsPage    from '@/pages/StatsPage'
import ProfilePage  from '@/pages/ProfilePage'

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/"         element={<HomePage />}     />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/session"  element={<SessionPage />}  />
          <Route path="/stats"    element={<StatsPage />}    />
          <Route path="/profile"  element={<ProfilePage />}  />
          {/* 404 fallback */}
          <Route path="*"         element={<HomePage />}     />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  )
}
