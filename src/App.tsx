function App() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-6">
      {/* Hero glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% -10%, color-mix(in srgb, #6366f1 20%, transparent), transparent)',
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-6 text-center animate-fade-in-up">
        {/* Logo */}
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl shadow-2xl"
          style={{
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            boxShadow: '0 0 40px color-mix(in srgb, #6366f1 40%, transparent)',
          }}
        >
          🏋️
        </div>

        <div>
          <h1
            className="text-4xl font-bold tracking-tight mb-2"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}
          >
            Training<span style={{ color: '#818cf8' }}>App</span>
          </h1>
          <p style={{ color: 'var(--color-text-secondary)' }} className="text-base">
            Twój zaawansowany dziennik treningowy
          </p>
        </div>

        {/* Status badges */}
        <div className="flex flex-wrap gap-2 justify-center">
          {['React + Vite', 'Tailwind CSS v4', 'PWA Ready', 'TypeScript'].map((badge) => (
            <span
              key={badge}
              className="px-3 py-1 text-xs font-medium rounded-full"
              style={{
                background: 'color-mix(in srgb, #6366f1 15%, transparent)',
                border: '1px solid color-mix(in srgb, #6366f1 30%, transparent)',
                color: '#818cf8',
              }}
            >
              {badge}
            </span>
          ))}
        </div>

        {/* Coming soon */}
        <div
          className="mt-4 px-6 py-4 rounded-2xl text-sm"
          style={{
            background: 'var(--color-surface-800)',
            border: '1px solid var(--color-surface-600)',
            color: 'var(--color-text-secondary)',
          }}
        >
          ⚙️ Inicjalizacja zakończona. Wkrótce pełna aplikacja…
        </div>
      </div>
    </div>
  )
}

export default App
