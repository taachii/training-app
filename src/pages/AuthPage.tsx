import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Dumbbell } from 'lucide-react'

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
        setError('Zarejestrowano pomyślnie. Zaloguj się teraz!')
        setIsLogin(true)
      }
    } catch (err: any) {
      setError(err.message || 'Wystąpił błąd podczas autoryzacji.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: 'var(--color-surface-900)' }}>
      <div className="w-full max-w-sm flex flex-col items-center animate-fade-in-up">
        
        {/* LOGO & TITLE */}
        <div className="flex flex-col items-center mb-10">
          <div 
            className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5 shadow-2xl" 
            style={{ 
              background: 'linear-gradient(135deg, var(--color-brand-400), var(--color-brand-600))',
              boxShadow: '0 8px 32px color-mix(in srgb, var(--color-brand-500) 40%, transparent)'
            }}
          >
            <Dumbbell size={40} color="white" strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-black tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
            TrainingApp
          </h1>
          <p className="text-sm font-medium mt-2 text-center" style={{ color: 'var(--color-text-secondary)' }}>
            {isLogin ? 'Zaloguj się, by kontynuować trening.' : 'Dołącz do nas i buduj formę!'}
          </p>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-1.5 ml-1" style={{ color: 'var(--color-text-muted)' }}>
              Email
            </label>
            <input 
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full p-4 rounded-2xl border-none outline-none font-medium transition-all focus:ring-2"
              style={{ 
                background: 'var(--color-surface-800)', 
                color: 'var(--color-text-primary)',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
              }}
              placeholder="twoj@email.com"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-1.5 ml-1" style={{ color: 'var(--color-text-muted)' }}>
              Hasło
            </label>
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full p-4 rounded-2xl border-none outline-none font-medium transition-all focus:ring-2"
              style={{ 
                background: 'var(--color-surface-800)', 
                color: 'var(--color-text-primary)',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
              }}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="p-4 rounded-2xl text-sm font-bold text-center mt-2" style={{ background: 'color-mix(in srgb, var(--color-danger-500) 15%, transparent)', color: 'var(--color-danger-400)' }}>
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full p-4 rounded-2xl font-bold tracking-widest mt-4 transition-transform active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg"
            style={{ 
              background: 'var(--color-brand-500)', 
              color: 'white',
              opacity: loading ? 0.7 : 1,
              boxShadow: '0 4px 16px color-mix(in srgb, var(--color-brand-500) 40%, transparent)'
            }}
          >
            {loading ? 'Ładowanie...' : (isLogin ? 'ZALOGUJ SIĘ' : 'ZAREJESTRUJ SIĘ')}
          </button>
        </form>

        {/* TOGGLE */}
        <button 
          onClick={() => {
            setIsLogin(!isLogin)
            setError(null)
          }}
          className="mt-8 text-sm font-bold tracking-wide transition-colors"
          style={{ color: 'var(--color-brand-400)' }}
        >
          {isLogin ? 'Nie masz konta? Zarejestruj się' : 'Masz już konto? Zaloguj się'}
        </button>
      </div>
    </div>
  )
}
