# MazdaCare Project Status

<!-- AUTO_STATUS_START -->
## Auto Snapshot

- Last auto update: 2026-04-07T10:56:29.012Z
- Branch: main
- Latest commit: 2b4fa06
- Git status: dirty (14 file(s) changed, main...origin/main)
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

## Phase 4 — Logo, Refinements & Security

- LOGO-1 MazdaCare SVG icon component - PENDING
- LOGO-2 Apply logo to auth page - PENDING
- LOGO-3 PWA icons and splash screen - PENDING
- LOGO-4 Dashboard and nav logo placement - DONE
- SEC-1 CSP headers via vercel.json - PENDING
- SEC-2 Input sanitization (DOMPurify) - DONE
- SEC-3 API key and env variable audit - PENDING
- SEC-4 Supabase RLS edge case hardening - DONE (remote migration applied)
- SEC-5 Auth guard and session hardening - PENDING
- SEC-6 Client-side form rate limiting - DONE
- REFINE-1 Micro-interactions and haptics - PENDING
- REFINE-2 Onboarding empty state - DONE
- REFINE-3 Offline indicator and network state - DONE

## Deployment and Infra Status

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
   - local `.env.local`
   - Vercel env (production, preview, development)
   After adding: verify map loads, then add HTTP referrer restrictions
   in Google Cloud Console for https://mazdacare-app.vercel.app/*

2. PWA icon PNG files — after LOGO-3 is applied, export the SVG icon to
   192×192 and 512×512 PNG and commit to public/icons/

## Useful Resume Commands

From project root (mazda-app):
  Build:                pnpm build
  Dev server (LAN):     pnpm dev --host 0.0.0.0
  List Supabase fns:    npx supabase functions list
  Check cron:           npx supabase db query --linked -o table "select jobname, schedule, active from cron.job where jobname='check-alerts-daily';"
  Check Vercel env:     npx vercel env ls production --format json --non-interactive
  Check RLS policies:   npx supabase db query --linked "select tablename, policyname, cmd from pg_policies where schemaname='public' order by tablename;"
