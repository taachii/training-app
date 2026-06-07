import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function AuthPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        // On success, Supabase might require email confirmation, or log them in automatically based on settings
        setError('Jeśli rejestracja się powiodła, możesz się teraz zalogować.')
        setIsLogin(true)
      }
    } catch (err: any) {
      setError(err.message || 'Wystąpił błąd podczas autoryzacji.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-sm p-6 rounded-3xl" style={{ background: 'var(--color-surface-800)' }}>
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: 'var(--color-primary-500)', color: 'white', fontSize: '32px' }}>
            💪
          </div>
          <h1 className="text-2xl font-black text-center" style={{ color: 'var(--color-text-primary)' }}>
            {isLogin ? 'Witaj z powrotem!' : 'Dołącz do nas!'}
          </h1>
          <p className="text-sm mt-2 text-center" style={{ color: 'var(--color-text-secondary)' }}>
            Zaloguj się, aby zsynchronizować swoje treningi.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--color-text-secondary)' }}>Email</label>
            <input 
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full p-3 rounded-xl border-none outline-none font-medium"
              style={{ background: 'var(--color-surface-900)', color: 'var(--color-text-primary)' }}
              placeholder="twoj@email.com"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--color-text-secondary)' }}>Hasło</label>
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full p-3 rounded-xl border-none outline-none font-medium"
              style={{ background: 'var(--color-surface-900)', color: 'var(--color-text-primary)' }}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl text-sm font-medium" style={{ background: 'color-mix(in srgb, var(--color-danger) 20%, transparent)', color: 'var(--color-danger)' }}>
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full p-4 rounded-xl font-bold uppercase tracking-widest mt-2 active:scale-[0.98] transition-transform"
            style={{ 
              background: 'var(--color-primary-500)', 
              color: 'var(--color-surface-900)',
              opacity: loading ? 0.7 : 1 
            }}
          >
            {loading ? 'Ładowanie...' : (isLogin ? 'Zaloguj się' : 'Zarejestruj się')}
          </button>
        </form>

        <button 
          onClick={() => {
            setIsLogin(!isLogin)
            setError(null)
          }}
          className="w-full mt-6 text-sm font-medium"
          style={{ color: 'var(--color-primary-500)' }}
        >
          {isLogin ? 'Nie masz konta? Zarejestruj się' : 'Masz już konto? Zaloguj się'}
        </button>
      </div>
    </div>
  )
}
