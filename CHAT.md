# MazdaCare App — Project Chat & Onboarding

Welcome! This document is for AI coding agents (Cursor, Antigravity, Copilot, etc.) and new developers. It explains the project structure, conventions, and onboarding steps so you can understand and safely contribute before writing code.

## Project Overview
- **Type:** React (Vite) mobile-first PWA for Mazda vehicle/service management
- **UI:** Tailwind CSS, shadcn/ui, Mazda palette
- **Data:** Supabase (auth, storage, service logs)
- **Features:**
  - Vehicle management (add, update, quick mileage)
  - Service log/history, analytics, export (CSV/PDF/WhatsApp)
  - Garage map, reminders, settings, dark mode
- **No backend secrets or API keys in repo or docs**

## Key Structure
- `src/` — All app code
  - `components/` — UI, layout, service, car, map, auth, etc.
  - `pages/` — Route-level screens (Dashboard, Settings, LogService, etc.)
  - `hooks/` — Custom React hooks (auth, vehicles, service logs, alerts)
  - `lib/` — Utilities (supabase, export, Mazda models, maps, etc.)
  - `stores/` — Zustand state (appStore)
  - `types/` — TypeScript types
- `public/` — Manifest, icons, static assets
- `supabase/` — Edge functions, config, migrations
- `scripts/` — Project scripts (status update, etc.)
- `.env` — (Keep! Never commit secrets)

## Onboarding for AI/IDE Agents
1. **Read this file and `PROJECT_STATUS.md` before coding.**
2. **Never paste or commit secrets.**
3. **Respect .env and Supabase config boundaries.**
4. **Use existing UI primitives and hooks.**
5. **Follow Mazda palette and Tailwind conventions.**
6. **All analytics/export is client-side.**
7. **Dark mode: class-based, CSS variables, see `useDarkMode` hook.**
8. **For new features, prefer composition and reuse.**
9. **Update this file and `PROJECT_STATUS.md` after major changes.**

## ⚠️ Critical UI/UX Rule — Top Page Layout
- **DO NOT add, modify, or introduce any black/dark background layout or bar at the top of any page.**
- The top of all app pages must remain **light** (as currently designed and implemented).
- This applies to ALL future UI/UX code, component changes, prompts, and agent-generated diffs.
- When writing or reviewing code for any page or component, explicitly preserve the existing top layout styles.
- This rule applies equally to Phase4Shell, individual page headers, nav components, and any new pages.

## .env Policy
- `.env` is required for local dev (Supabase keys, etc.)
- Never paste or commit secrets into markdown or code
- If you need a new env var, document the key (not value) in `.env.example`

## Safe Coding Checklist
- [ ] Read this file and `PROJECT_STATUS.md`
- [ ] Never leak secrets
- [ ] Use existing hooks/components first
- [ ] Validate UI in both light/dark mode
- [ ] Test export/analytics client-side only
- [ ] Update docs after major changes

---
For questions, see `README.md` or ask the project maintainer.
