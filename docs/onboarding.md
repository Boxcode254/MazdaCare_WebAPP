# MazdaCare — Onboarding

This document is for AI coding agents (Cursor, Antigravity, Copilot, etc.) and new developers. It explains project structure, conventions, and safe contribution practices.

## Project overview

- **Type:** React (Vite) mobile-first PWA for Mazda vehicle and service management
- **UI:** Tailwind CSS, shadcn/ui, Mazda palette
- **Data:** Supabase (auth, Postgres, service logs)
- **Features:** Vehicle management, service history, analytics/export (client-side), garage map, reminders, settings, dark mode
- **No backend secrets or API keys in repo or docs**

## Repository layout

- [Repository root](../) — Application (`src/`, `public/`, `supabase/`, `package.json`)
  - `src/components/` — UI, layout, service, car, map, auth, etc.
  - `src/pages/` — Route-level screens
  - `src/hooks/` — Auth, vehicles, service logs, alerts
  - `src/lib/` — Supabase client, export, Mazda models, maps, sanitization
  - `src/stores/` — Zustand (`appStore`)
  - `src/types/` — TypeScript types
  - `public/` — Manifest, icons, static assets
  - `supabase/` — Edge functions, config, migrations
  - `scripts/` — e.g. `update-project-status.mjs` (writes the auto snapshot in [Project status](./project-status.md))
- [`docs/`](./README.md) — This documentation tree
- `.env` / `.env.local` at repo root — local only; never commit secrets

## Onboarding for AI/IDE agents

1. Read this file and [Project status](./project-status.md) before coding.
2. Never paste or commit secrets.
3. Respect `.env` and Supabase config boundaries.
4. Use existing UI primitives and hooks.
5. Follow Mazda palette and Tailwind conventions.
6. All analytics/export is client-side.
7. Dark mode: class-based, CSS variables, see `useDarkMode` hook.
8. For new features, prefer composition and reuse.
9. After major changes, update [Onboarding](./onboarding.md) and [Project status](./project-status.md) as appropriate.

## Desktop web and adaptive UI (2026)

**Completed:** Multi-column shell (`Phase4Shell`), desktop scaling, shortcuts (N, V, S, H), hover states and context menus, `ResponsiveModal`, table view in history with context actions.

**Agent workflow:** Use `ServiceHistoryTable` for desktop tables; use `ResponsiveModal` for new modals. Document significant UI changes in this tree.

## Critical UI/UX rule — top page layout

- **Do not** add or change the top of any page to a black/dark background bar or full-width dark strip.
- The main shell header uses **`app-top-bar`** (light cream) in **both** themes — see [Design system](./design-system.md).
- Applies to all new pages and agent-generated UI.

## `.env` policy

- Required for local dev (Supabase keys, etc.).
- Never paste secrets into markdown or committed code.
- New variables: document the **key name** only in `.env.example` at the repo root.

## Safe coding checklist

- [ ] Read [Onboarding](./onboarding.md) and [Project status](./project-status.md)
- [ ] Never leak secrets
- [ ] Prefer existing hooks and components
- [ ] Validate light and dark mode
- [ ] Keep export/analytics client-side only
- [ ] Update docs after major changes

---

For toolchain and PWA icons, see [Local development](./local-development.md) and [`README.md`](../README.md).
