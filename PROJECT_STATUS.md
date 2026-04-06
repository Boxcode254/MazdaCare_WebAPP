# MazdaCare Project Status

<!-- AUTO_STATUS_START -->
## Auto Snapshot

- Last auto update: 2026-04-06T16:18:13.949Z
- Branch: main
- Latest commit: b4e8a69
- Git status: dirty (3 file(s) changed, main...origin/main)
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
- `push_subscriptions` table created with RLS and policies
- Edge function deployed: `check-alerts` (ACTIVE)
- Function secrets configured:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `VAPID_PUBLIC_KEY`
  - `VAPID_PRIVATE_KEY`
  - `VAPID_CONTACT_EMAIL`
- Daily cron created and active:
  - Job: `check-alerts-daily`
  - Schedule: `0 7 * * *` (07:00 UTC)

### Auth

- Supabase Site URL set to: `https://mazdacare-app.vercel.app`
- Redirect allow list set to:
  - `https://mazdacare-app.vercel.app`
  - `http://localhost:5173`
  - `http://192.168.2.102:5174`
- Google OAuth provider enabled in Supabase

## Final Live Smoke Test (2026-04-06) - ALL GREEN

- Google Auth: PASS (`boxcode254@gmail.com` now has providers `[email google]`)
- Add Vehicle: PASS
- Log Service: PASS
- Alert Banner: PASS
- Edge Function Endpoint: PASS (`check-alerts` returns valid JSON)
- Build + PWA Output: PASS

## Optional Follow-ups

1. Google Maps API key
- `VITE_GOOGLE_MAPS_API_KEY` is still not set.
- Map features remain key-gated until key is added.
- Once available, set it in:
  - local `.env.local`
  - Vercel env (`production`, `preview`, `development`)

2. Maps key restrictions
- In Google Cloud, add HTTP referrer restrictions for your domain(s) before release.

## Useful Resume Commands

From project root (`mazda-app`):

- Build: `pnpm build`
- Dev server (LAN): `pnpm dev --host 0.0.0.0`
- List Supabase functions: `npx supabase functions list`
- Check cron job: `npx supabase db query --linked -o table "select jobname, schedule, active from cron.job where jobname='check-alerts-daily';"`
- Check Vercel env: `npx vercel env ls production --format json --non-interactive`
