import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useSyncEngine } from '@/lib/syncEngine'
import AppLayout    from '@/components/layout/AppLayout'
import AuthPage     from '@/pages/AuthPage'
import HomePage     from '@/pages/HomePage'
import RankingsPage from '@/pages/RankingsPage'
import FriendsPage  from '@/pages/FriendsPage'
import PlansPage    from '@/pages/PlansPage'
import PlanFormPage from '@/pages/PlanFormPage'
import SessionPage  from '@/pages/SessionPage'
import HistoryPage  from '@/pages/HistoryPage'
import ProfilePage  from '@/pages/ProfilePage'

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  // Initialize Sync Engine
  useSyncEngine()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">Ładowanie...</div>
  }

  if (!session) {
    return <AuthPage />
  }

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
