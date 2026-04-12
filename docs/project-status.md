
# MazdaCare Project Status
## AI/IDE Agent Onboarding

**Before coding, all agents (Cursor, Antigravity, Copilot, etc.) and new devs must:**
- Read [Onboarding](./onboarding.md) and this file fully
- Never paste or commit secrets (API keys, tokens, etc.)
- Keep `.env` present for local dev at the repo root, but never leak its contents
- Use existing hooks, UI primitives, and Mazda palette
- Validate UI in both light and dark mode
- All analytics/export is client-side only
- For new features, prefer composition and reuse
- Update [Onboarding](./onboarding.md) and this file after major changes


**.env policy:**
- `.env` is required for local dev (Supabase keys, etc.)
- Never paste or commit secrets into markdown or code
- If you need a new env var, document the key (not value) in `.env.example`

---

## Architecture Recommendations (2026-04-07)

- Add a high-level architecture diagram (C4 or similar) to documentation for onboarding and audits.
- Document the flow for critical features (e.g., service logging, push notifications).
- Regularly review RLS and edge function logic as the schema evolves.

#### [Placeholder: Insert C4 Context/Container Diagram Here]

---

## Refactoring Plan
---

## Manual QA Walkthrough: End-to-End User Flow (2026-04-07)

Follow this checklist to simulate a real user journey and catch UI/UX bugs:

### 1. Account Creation
- Open the app in a private/incognito browser window.
- Click “Sign Up” or “Continue with Google.”
- Complete the registration process (use a test email or Google account).
- Confirm onboarding screens and initial dashboard load.

### 2. Add Multiple Cars
- Navigate to “Garage” or “Add Car.”
- Add a first vehicle (fill all required fields, test VIN decoder if available).
- Add a second and third vehicle (use different models/years).
- Switch between vehicles and verify context updates (dashboard, service logs, etc.).

### 3. Set Garages Visited
- Go to the “Garage Finder” or “Map.”
- Search for and select a garage.
- Mark it as visited or add to your garage history.
- Repeat for multiple garages.
- Check that the visited list/history updates and persists after reload.

### 4. Service Logging
- For each car, log a new service (oil change, tire rotation, etc.).
- Enter realistic and edge-case data (e.g., high mileage, missing optional fields).
- Verify logs appear in the service history and analytics update.

### 5. Alerts & Scheduler
- Set a maintenance alert/reminder for a car.
- Confirm alert appears in dashboard/schedule.
- Simulate time passing (if possible) and check alert banners.

### 6. PWA & Offline
- Install the app to your device home screen (PWA prompt).
- Reload and use the app offline; verify offline banners and limited functionality.

### 7. Settings & Auth
- Update profile details, toggle push notifications, test password reset.
- Log out and log back in; confirm state is preserved.

### 8. General UI/UX
- Test in both light and dark mode.
- Try on mobile and desktop browsers.
- Look for layout glitches, broken buttons, or missing feedback.

---

Log any bugs, unexpected behaviors, or UX issues found during this walkthrough for triage and fixing.

- Domain-based folder refactoring (e.g., hooks/components by vehicles, service_logs, maps) is deferred until the next major feature push. Current structure is maintainable; refactor will be planned alongside new features for minimal disruption.

---


<!-- AUTO_STATUS_START -->
## Auto Snapshot

- Last auto update: 2026-04-12T12:35:07.683Z
- Branch: main
- Latest commit: 53f4d56
- Git status: dirty (5 file(s) changed, main...origin/main)
- Production app URL: https://mazdacare-app.vercel.app
- Vercel project: mazdacare-app
- Supabase project ref: rmfkykcijcndwvsursmu
- Google Maps key configured locally: no

<!-- AUTO_STATUS_END -->

## Build Progress (Plan Prompts)

- Prompt 1: Project scaffold - DONE
- Prompt 2: Supabase auth setup - DONE
- Prompt 3: Vehicle management - DONE
- Prompt 4: Service logging - DONE
- Prompt 5: Google Maps garage finder - DONE (code complete)
- Prompt 6: Scheduler and alerts - DONE
- Prompt 7: Dashboard and polish - DONE
- Prompt 8: PWA and deployment - DONE


## UI/UX Progress

- Mazda Soul Red redesign pass - DONE (UI-1 through UI-15 complete)
- Phase 1 redesign pass - DONE
- Phase 2 performance and interaction pass - DONE
- Phase 3 final UX QA pass - DONE
- P2-2 VIN decoder integration in Add Car flow - DONE
- P2-3 multi-vehicle switcher rail + active context - DONE
- P3-2 calendar actions + reminder preferences - DONE
- Home-first onboarding + garage history simplification pass - DONE
- Settings refinements (personal details, push toggle, garage visit ranking) - DONE
- Auth password recovery flow ("Forgot Password?" + email reset) - DONE

## Phase 4 — Logo, Refinements & Security

- LOGO-1 MazdaCare SVG icon component - DONE
- LOGO-2 Apply logo to auth page - DONE
- LOGO-3 PWA icons and splash screen - DONE
- LOGO-4 Dashboard and nav logo placement - DONE
- LOGO-5 Official custom logo asset integration (crystal red) - DONE
- SEC-1 CSP headers via vercel.json - DONE
- SEC-2 Input sanitization (DOMPurify) - DONE
- SEC-3 API key and env variable audit - DONE
- SEC-4 Supabase RLS edge case hardening - DONE (remote migration applied)
- SEC-5 Auth guard and session hardening - DONE
- SEC-6 Client-side form rate limiting - DONE
- REFINE-1 Micro-interactions and haptics - DONE
- REFINE-2 Onboarding empty state - DONE
- REFINE-3 Offline indicator and network state - DONE

## Phase 5 — Adaptive Desktop & Table View (2026-04-08)

- Multi-column grid layout with sidebar (Phase4Shell) - DONE
- Interactive element scaling for desktop (buttons/cards) - DONE
- Global keyboard shortcuts (N, V, S, H) - DONE
- Desktop hover states and right-click context menus (ServiceLogCard, Table rows) - DONE
- ResponsiveModal: Dialog on desktop, Drawer on mobile - DONE
- Desktop Table View: Toggle between Card/Table in History, high-density data, context menu actions - DONE
- Documentation updated: [Onboarding](./onboarding.md) and this file reflect desktop enhancements - DONE

## Phase 6 — Vehicle Workspace & Service-State Consistency (2026-04-12)

- Shared vehicle service snapshot utility (`src/lib/serviceState.ts`) derived from latest service logs first, alerts second - DONE
- Latest-log map support in `useServiceLogs` for cross-screen service-state reuse - DONE
- Vehicles list cards and notifications now show exact due state instead of interval approximation - DONE
- Mileage update sheet now uses the same service target source as list/detail views - DONE
- Desktop Vehicles upgraded to a true master-detail workspace with persistent list + detail pane - DONE
- Reusable `VehicleListCard`, `VehicleDetailView`, and dedicated `/vehicles/:id` route added - DONE
- Dashboard cards now read the same shared service snapshot as Vehicles - DONE
- Premium token refresh applied: Plus Jakarta Sans + Instrument Serif, refined warm neutral/red/gold palette - DONE

## Deployment and Infra Status

### Recent Code/Data Updates

- **Vehicle workspace and service-state consistency pass (2026-04-12):**
  - Added `src/lib/serviceState.ts` as the single source of truth for due mileage/date, overdue state, due-soon state, and progress
  - Added `src/lib/vehicleDisplay.ts` to centralize vehicle image/catalog lookup
  - Added `src/components/car/VehicleListCard.tsx` and `src/components/car/VehicleDetailView.tsx`
  - Added `src/pages/VehicleDetail.tsx` and routed `/vehicles/:id` through `src/App.tsx`
  - Updated `Dashboard.tsx`, `CarCard.tsx`, `Phase4Shell.tsx`, and `Vehicles.tsx` so service status is consistent across dashboard, list, detail, and notifications
  - Refined global typography/color tokens in `src/index.css` and `tailwind.config.js`

- **Mazda Manual Catalog Integration (2026-04-07):**
  - Added `src/data/mazdaManualCatalog.json` (official Mazda Canada manual links, 2000+ lines, all models/years)
  - Added `src/lib/mazdaManuals.ts` utility for programmatic lookup of manuals by model/year
  - Enables in-app manual lookup and future user-facing features

### Vercel

- Project created and linked to GitHub repo: `Boxcode254/MazdaCare_WebAPP`
- Git integration connected
- Production branch configured as `main`
- Frontend env vars configured in Vercel (production/preview/development):
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- Production deployment completed and live

### Supabase

- Core schema migration applied (vehicles, service logs, garages, service alerts)
- RLS enabled and policies applied for core tables
- Remote migrations applied through `20260407090500_add_vehicle_vin_column.sql`
- `vehicles.vin` column added on linked hosted database
- Local Docker-based Supabase stack still needs migration replay if local DB testing is required
- `push_subscriptions` table created with RLS and policies
- Edge function deployed: `check-alerts` (ACTIVE)
- Function secrets configured: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
  VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_CONTACT_EMAIL
- Daily cron active: `check-alerts-daily` at `0 7 * * *`

### Auth

- Supabase Site URL: `https://mazdacare-app.vercel.app`
- Google OAuth: enabled

## Final Live Smoke Test (2026-04-06) - ALL GREEN

- Google Auth, Add Vehicle, Log Service, Alert Banner,
  Edge Function Endpoint, Build + PWA Output — all PASS

## Remaining Blockers

1. Google Maps API key — set VITE_GOOGLE_MAPS_API_KEY in:
   - local `.env.local` at repo root
   - Vercel env (production, preview, development)
   After adding: verify map loads, then add HTTP referrer restrictions
   in Google Cloud Console for https://mazdacare-app.vercel.app/*

## Useful Resume Commands

From repository root:

  Build:                pnpm build
  Dev server (LAN):     pnpm dev --host 0.0.0.0
  List Supabase fns:    npx supabase functions list
  Check cron:           npx supabase db query --linked -o table "select jobname, schedule, active from cron.job where jobname='check-alerts-daily';"
  Check Vercel env:     npx vercel env ls production --format json --non-interactive
  Check RLS policies:   npx supabase db query --linked "select tablename, policyname, cmd from pg_policies where schemaname='public' order by tablename;"

Update the **Auto Snapshot** block in this file: `pnpm status:update` (from repository root)
