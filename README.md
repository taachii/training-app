# 🏋️ TrainingApp

> Zaawansowana aplikacja PWA do prowadzenia notatek treningowych z automatyczną progresją ciężarów i głęboką grywalizacją.

## Stack technologiczny

| Warstwa        | Technologia                        |
|----------------|------------------------------------|
| Frontend       | React 19 + TypeScript              |
| Build Tool     | Vite 6                             |
| Styling        | Tailwind CSS v4                    |
| PWA            | vite-plugin-pwa + Workbox          |
| State          | Zustand                            |
| Routing        | React Router v7                    |
| Backend (plan) | Supabase (PostgreSQL + Auth)       |

## Funkcje

- 📋 **Plany treningowe** — blueprinty ćwiczeń z konfiguracją serii, powtórzeń i ciężaru
- 📅 **Kalendarz** — planowanie treningów na konkretne dni
- ⏱️ **Aktywna sesja** — kolejkowy widok z odliczaniem przerw między seriami
- 📈 **Automatyczna progresja** — +2.5 kg przy sukcesie, deload przy porażce
- 🏅 **System rang** — Bronze → Damascus na podstawie ORM
- 📊 **Statystyki** — siatka aktywności (GitHub-style), PR-y, wykresy
- 🌐 **PWA** — działa offline, instalowalna na urządzeniach mobilnych

## Uruchomienie

```bash
npm install
npm run dev
```

## Struktura projektu

```
src/
├── components/     # Współdzielone komponenty UI i layoutu
├── features/       # Moduły domenowe (workouts, session, ranks…)
├── store/          # Stan globalny (Zustand)
├── hooks/          # Custom React hooks
├── lib/            # Utilities i helpers
├── pages/          # Strony aplikacji (router)
└── types/          # Globalne typy TypeScript
```

## Plan wdrożenia

Szczegółowy plan rozbity na 10 kroków — patrz `implementation_plan.md` (Antigravity artifact).
