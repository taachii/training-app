import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AppLayout    from '@/components/layout/AppLayout'
import HomePage     from '@/pages/HomePage'
import RankingsPage from '@/pages/RankingsPage'
import FriendsPage  from '@/pages/FriendsPage'
import PlansPage    from '@/pages/PlansPage'
import PlanFormPage from '@/pages/PlanFormPage'
import SessionPage  from '@/pages/SessionPage'
import HistoryPage  from '@/pages/HistoryPage'
import ProfilePage  from '@/pages/ProfilePage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Pages with BottomNav */}
        <Route element={<AppLayout />}>
          <Route path="/"         element={<HomePage />}     />
          <Route path="/rankings" element={<RankingsPage />} />
          <Route path="/friends"  element={<FriendsPage />}  />
          <Route path="/plans"    element={<PlansPage />}    />
          <Route path="/history"  element={<HistoryPage />}  />
          <Route path="/profile"  element={<ProfilePage />}  />
          <Route path="*"         element={<HomePage />}     />
        </Route>

        {/* Full-screen pages (no BottomNav) */}
        <Route path="/plans/new"        element={<PlanFormPage />} />
        <Route path="/plans/:id/edit"   element={<PlanFormPage />} />
        <Route path="/session"               element={<SessionPage />} />
        <Route path="/session/start/:planId"  element={<SessionPage />} />
      </Routes>
    </BrowserRouter>
  )
}
