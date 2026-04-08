# Mazda Maintenance Monitoring App — Full Implementation Plan

> **Last updated:** 2026-04-07  
> **Platform decision:** Progressive Web App (PWA) — works on any Android/iOS browser in Nairobi,  
> installs to home screen, no Play Store needed, offline-capable, one codebase.  
> **Production URL:** https://mazdacare-app.vercel.app  
> **GitHub repo:** Boxcode254/MazdaCare_WebAPP  
> **Documentation tree:** [`docs/README.md`](./README.md) (onboarding, status, this plan)

---

## Implementation Status

| Phase | Status |
|---|---|
| Prompt 1: Project scaffold | ✅ DONE |
| Prompt 2: Supabase auth | ✅ DONE |
| Prompt 3: Vehicle management | ✅ DONE |
| Prompt 4: Service logging | ✅ DONE |
| Prompt 5: Google Maps garage finder | ✅ DONE (code complete, needs API key in production) |
| Prompt 6: Scheduler & alerts | ✅ DONE |
| Prompt 7: Dashboard & polish | ✅ DONE |
| Prompt 8: PWA & deployment | ✅ DONE |
| UI/UX redesign (Phases 1–3) | ✅ DONE (Soul Red theme, performance, QA) |
| Phase 4: Logo, refinements, security | 🔧 IN PROGRESS |

### Phase 4 Remaining Items

| ID | Task | Status |
|---|---|---|
| LOGO-1 | MazdaCare SVG icon component | PENDING |
| LOGO-2 | Apply logo to auth page | PENDING |
| LOGO-3 | PWA icons and splash screen | PENDING |
| LOGO-4 | Dashboard and nav logo placement | ✅ DONE |
| SEC-1 | CSP headers via vercel.json | PENDING |
| SEC-2 | Input sanitization (DOMPurify) | ✅ DONE |
| SEC-3 | API key and env variable audit | PENDING |
| SEC-4 | Supabase RLS edge case hardening | ✅ DONE |
| SEC-5 | Auth guard and session hardening | PENDING |
| SEC-6 | Client-side form rate limiting | ✅ DONE |
| REFINE-1 | Micro-interactions and haptics | PENDING |
| REFINE-2 | Onboarding empty state | ✅ DONE |
| REFINE-3 | Offline indicator and network state | ✅ DONE |

### Remaining Blockers

1. **Google Maps API key** — set `VITE_GOOGLE_MAPS_API_KEY` in local `.env.local` and Vercel env vars. After adding: verify map loads, then add HTTP referrer restrictions in Google Cloud Console for `https://mazdacare-app.vercel.app/*`
2. **PWA icon PNG files** — after LOGO-3, export SVG to 192×192 and 512×512 PNG, commit to `public/icons/`

---

## Tech Stack

| Layer | Tool | Version | Why |
|---|---|---|---|
| Frontend framework | React + TypeScript | 19.2.4 / ~6.0.2 | Type safety, large ecosystem |
| Build tool | Vite | 7.1.12 | Fast HMR, ESM-native |
| Styling | Tailwind CSS + shadcn/ui | 3.4.17 / 4.1.2 | Fast, mobile-first, accessible components |
| Animations | Motion (framer-motion) | 12.38.0 | AnimatePresence, page transitions |
| Routing | React Router v6 | 6.30.1 | SPA navigation |
| State management | Zustand | 5.0.12 | Lightweight, no boilerplate |
| Forms | React Hook Form + Zod | 7.72.1 / 4.3.6 | Validation, type-safe schemas |
| Backend / DB | Supabase | 2.101.1 | Postgres + Auth + Realtime, free tier, Kenya-friendly |
| Maps | Google Maps JS API + Places API | 2.0.2 | Garage/petrol station search |
| Icons | Lucide React | 1.7.0 | Modern icon library |
| XSS Protection | DOMPurify | 3.3.3 | Input sanitization at insert boundary |
| Toasts | Sonner | 2.0.7 | Toast notifications |
| Push alerts | Web Push (via Supabase Edge Functions) | — | Service reminders |
| PWA | Vite PWA plugin | 1.2.0 | Installable, offline cache |
| Hosting | Vercel | — | Free tier, CI/CD from GitHub |
| Package manager | pnpm | — | Fast installs |
| Testing | Vitest | 4.1.2 | Unit tests |

---

## Project Structure

```
<repo root>/                   # GitHub: MazdaCare_WebAPP (local folder name may vary)
├── docs/                      # README, onboarding, project-status, implementation plan
│   ├── README.md
│   ├── onboarding.md
│   ├── project-status.md      # Auto snapshot: pnpm status:update
│   ├── local-development.md
│   └── implementation-plan.md
├── public/
│   ├── manifest.json          # PWA manifest
│   └── icons/                 # App icons (192, 512px)
├── scripts/
│   └── update-project-status.mjs  # Writes docs/project-status.md (Auto Snapshot block)
├── src/
│   ├── components/
│   │   ├── ui/                # shadcn components (button, card, input, select, dialog, sheet, badge, toast, tabs, form, label, slider, avatar, progress, sonner)
│   │   ├── layout/            # Phase4Shell (unified app shell), BottomNav, InstallAppBanner
│   │   ├── auth/              # ProtectedRoute
│   │   ├── car/               # CarCard
│   │   ├── service/           # ServiceLogCard
│   │   ├── map/               # GarageCard
│   │   └── schedule/          # AlertBanner
│   ├── pages/
│   │   ├── Dashboard.tsx      # (Legacy — Phase4Shell now handles home)
│   │   ├── AddCar.tsx         # (Legacy — wizard embedded in Phase4Shell)
│   │   ├── Auth.tsx           # Sign-in / sign-up (Google OAuth + email)
│   │   ├── ServiceLog.tsx     # Service history list
│   │   ├── LogService.tsx     # Log a new service form
│   │   ├── GarageMap.tsx      # Google Maps + garage search
│   │   ├── Schedule.tsx       # Upcoming service calendar
│   │   └── Settings.tsx       # User settings & profile
│   ├── hooks/
│   │   ├── useAuth.ts         # Auth state + session listener
│   │   ├── useVehicles.ts     # Vehicle CRUD with sanitization
│   │   ├── useServiceLogs.ts  # Service log queries + mutations
│   │   └── useAlerts.ts       # Alert fetching + next-service calc
│   ├── lib/
│   │   ├── supabase.ts        # Supabase client
│   │   ├── oils.ts            # Kenya oil data (9 brands/grades)
│   │   ├── mazda-models.ts    # Mazda model list (12 models)
│   │   ├── maps.ts            # Google Maps helpers
│   │   ├── sanitize.ts        # DOMPurify sanitization helpers
│   │   └── utils.ts           # cn() and general utils
│   ├── stores/
│   │   └── appStore.ts        # Zustand global store
│   ├── types/
│   │   └── index.ts           # Vehicle, ServiceLog, Garage, ServiceAlert interfaces
│   └── App.tsx                # Routes: /auth → Auth, / → ProtectedRoute → Phase4Shell
├── supabase/
│   ├── config.toml
│   ├── migrations/
│   │   ├── 20260406142604_setup_check_alerts_cron.sql
│   │   ├── 20260406142805_bootstrap_core_schema.sql
│   │   ├── 20260406160000_harden_rls_limits_constraints.sql
│   │   ├── 20260407090500_add_vehicle_vin_column.sql
│   │   └── 20260407120000_widen_mileage_interval_check.sql
│   └── functions/
│       └── check-alerts/index.ts  # Edge Function: daily push notification check
├── .env.local                 # Local env vars (not committed)
├── vite.config.ts             # Vite + PWA config
└── package.json
```

### Architecture Note

The app uses **Phase4Shell** (`src/components/layout/Phase4Shell.tsx`) as a unified single-page shell with tab-based navigation (`home` | `garage` | `map` | `profile`), replacing the original multi-page React Router approach. The shell manages all primary views, the vehicle add wizard, settings, and service logging inline. The only separate route is `/auth`.

---

## Database Schema (Supabase / PostgreSQL)

> All schema changes are managed via Supabase CLI migrations in `supabase/migrations/`.  
> 5 migrations applied to remote as of 2026-04-07.

```sql
-- 0. Push subscriptions (for Web Push notifications)
-- Migration: 20260406142604_setup_check_alerts_cron.sql
create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz default now()
);
-- RLS: users see & manage own subscriptions
-- Cron: daily at 07:00 UTC via pg_cron + pg_net → Edge Function /check-alerts

-- 1. Vehicles table
-- Migration: 20260406142805_bootstrap_core_schema.sql
--            20260407090500_add_vehicle_vin_column.sql (adds vin)
--            20260407120000_widen_mileage_interval_check.sql (widens constraint)
create table vehicles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  make text not null default 'Mazda',
  model text not null,              -- e.g. Demio, CX-5, Axela, BT-50
  year integer,
  vin text,                         -- optional, indexed
  fuel_type text check (fuel_type in ('petrol','diesel')),
  engine_size text,                 -- e.g. 1.5L Petrol, 2.2L Diesel
  registration text,
  current_mileage integer,
  mileage_interval integer default 5000
    check (mileage_interval in (5000, 7000, 9000, 10000)),
  color text,
  created_at timestamptz default now()
);
-- Constraints (from hardening migration):
--   mileage_positive: current_mileage >= 0 AND current_mileage < 10,000,000
--   Max 10 vehicles per user (trigger: check_vehicle_limit)

-- 2. Service logs
create table service_logs (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid references vehicles on delete cascade,
  user_id uuid references auth.users not null,
  service_date date not null,
  service_type text check (service_type in ('minor','major','oil_change','tyre_rotation','brake_service','other')),
  mileage_at_service integer,
  next_service_mileage integer,
  oil_brand text,
  oil_grade text,                   -- e.g. 5W-30, 0W-20
  oil_quantity_litres numeric,
  garage_id uuid references garages,
  garage_name text,                 -- free text fallback
  service_cost numeric,
  notes text,
  rating integer check (rating between 1 and 5),
  created_at timestamptz default now()
);
-- Constraints (from hardening migration):
--   log_mileage_positive: 0 <= mileage_at_service < 10,000,000
--   log_cost_positive: service_cost >= 0 AND < 10,000,000 (nullable)
--   log_rating_range: rating BETWEEN 1 AND 5 (nullable)
--   Max 500 logs per vehicle (trigger: check_log_limit)
--   Insert RLS checks vehicle ownership

-- 3. Garages / service points
create table garages (
  id uuid primary key default gen_random_uuid(),
  google_place_id text unique,
  name text not null,
  type text check (type in ('garage','petrol_station','dealer','mobile_mechanic')),
  address text,
  lat numeric,
  lng numeric,
  phone text,
  avg_rating numeric,
  total_reviews integer default 0,
  verified boolean default false,
  created_at timestamptz default now()
);

-- 4. Service alerts / schedules
create table service_alerts (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid references vehicles on delete cascade,
  user_id uuid references auth.users not null,
  alert_type text check (alert_type in ('mileage','date','both')),
  due_mileage integer,
  due_date date,
  service_type text,
  is_dismissed boolean default false,
  created_at timestamptz default now()
);
-- Insert RLS checks vehicle ownership

-- 5. Row Level Security (all tables)
alter table vehicles enable row level security;
alter table service_logs enable row level security;
alter table service_alerts enable row level security;
alter table push_subscriptions enable row level security;

create policy "Users see own vehicles" on vehicles for all using (auth.uid() = user_id);
create policy "Users see own logs" on service_logs for all using (auth.uid() = user_id);
create policy "Users see own alerts" on service_alerts for all using (auth.uid() = user_id);
create policy "Anyone can read garages" on garages for select using (true);
create policy "Users can add garages" on garages for insert with check (auth.uid() is not null);
```

---

## Kenya Engine Oil Data (`src/lib/oils.ts`)

> The Mazda model list is now in a separate file: `src/lib/mazda-models.ts`

```typescript
export interface EngineOil {
  brand: string;
  grade: string;
  type: 'synthetic' | 'semi-synthetic' | 'mineral';
  suitableFor: string[];     // model names
  fuelType: ('petrol' | 'diesel')[];
  availableIn: string[];     // retailers in Kenya
  approxPriceKes: number;
}

export const KENYA_MAZDA_OILS: EngineOil[] = [
  // Mazda Genuine
  {
    brand: 'Mazda Genuine Oil',
    grade: '0W-20',
    type: 'synthetic',
    suitableFor: ['CX-5', 'CX-3', 'Axela', 'Atenza'],
    fuelType: ['petrol'],
    availableIn: ['Mazda Kenya Dealer', 'DT Dobie'],
    approxPriceKes: 4500,
  },
  {
    brand: 'Mazda Genuine Oil',
    grade: '5W-30',
    type: 'synthetic',
    suitableFor: ['Demio', 'Axela', 'CX-5', 'BT-50'],
    fuelType: ['petrol', 'diesel'],
    availableIn: ['Mazda Kenya Dealer', 'DT Dobie'],
    approxPriceKes: 4200,
  },
  // Castrol
  {
    brand: 'Castrol EDGE',
    grade: '5W-30',
    type: 'synthetic',
    suitableFor: ['CX-5', 'CX-3', 'Axela', 'Atenza', 'Demio'],
    fuelType: ['petrol', 'diesel'],
    availableIn: ['Total Energies Kenya', 'Autozone', 'Nakumatt'],
    approxPriceKes: 3800,
  },
  {
    brand: 'Castrol GTX',
    grade: '10W-40',
    type: 'semi-synthetic',
    suitableFor: ['Demio', 'Axela'],
    fuelType: ['petrol'],
    availableIn: ['Total Energies Kenya', 'Carrefour', 'Nakumatt'],
    approxPriceKes: 2400,
  },
  // Mobil
  {
    brand: 'Mobil 1',
    grade: '0W-20',
    type: 'synthetic',
    suitableFor: ['CX-5', 'CX-9', 'Atenza'],
    fuelType: ['petrol'],
    availableIn: ['ExxonMobil Kenya dealers', 'Autozone'],
    approxPriceKes: 4800,
  },
  {
    brand: 'Mobil Super 3000',
    grade: '5W-40',
    type: 'synthetic',
    suitableFor: ['BT-50', 'CX-5 diesel'],
    fuelType: ['diesel'],
    availableIn: ['ExxonMobil Kenya dealers'],
    approxPriceKes: 3600,
  },
  // Total
  {
    brand: 'Total Quartz 9000',
    grade: '5W-30',
    type: 'synthetic',
    suitableFor: ['Demio', 'Axela', 'CX-3', 'CX-5'],
    fuelType: ['petrol'],
    availableIn: ['Total Energies Kenya stations'],
    approxPriceKes: 3500,
  },
  {
    brand: 'Total Rubia TIR 8600',
    grade: '10W-40',
    type: 'mineral',
    suitableFor: ['BT-50'],
    fuelType: ['diesel'],
    availableIn: ['Total Energies Kenya stations'],
    approxPriceKes: 2800,
  },
  // Shell
  {
    brand: 'Shell Helix Ultra',
    grade: '5W-30',
    type: 'synthetic',
    suitableFor: ['CX-5', 'CX-3', 'Axela', 'Atenza', 'Demio'],
    fuelType: ['petrol', 'diesel'],
    availableIn: ['Shell Kenya stations', 'Autozone'],
    approxPriceKes: 3900,
  },
];

export function getRecommendedOils(model: MazdaModel, fuelType: 'petrol' | 'diesel') {
  return KENYA_MAZDA_OILS.filter(
    (oil) =>
      oil.fuelType.includes(fuelType) &&
      oil.suitableFor.some((m) => m.toLowerCase().includes(model.toLowerCase()))
  );
}
```

### Mazda Models (`src/lib/mazda-models.ts`)

```typescript
export const MAZDA_MODELS = [
  'Demio', 'Axela', 'MX-5', 'CX-3', 'CX-5', 'CX-7', 'CX-9',
  'Atenza', 'BT-50', 'Premacy', 'MPV', 'Tribute',
] as const;

export type MazdaModel = (typeof MAZDA_MODELS)[number];
```

---

## TypeScript Interfaces (`src/types/index.ts`)

```typescript
export interface Vehicle {
  id: string;
  userId: string;
  make: string;
  model: string;
  year: number;
  vin?: string;                          // optional VIN
  fuelType: 'petrol' | 'diesel';
  engineSize: string;                    // e.g. "1.5L Petrol", "2.2L Diesel"
  registration: string;
  currentMileage: number;
  mileageInterval: 5000 | 7000 | 9000 | 10000;  // 4 options
  color?: string;
  nextServiceMileage?: number;           // computed: currentMileage + mileageInterval
}

export interface ServiceLog {
  id: string;
  vehicleId: string;
  serviceDate: string;
  serviceType: 'minor' | 'major' | 'oil_change' | 'tyre_rotation' | 'brake_service' | 'other';
  mileageAtService: number;
  nextServiceMileage: number;
  oilBrand?: string;
  oilGrade?: string;
  oilQuantityLitres?: number;
  garageId?: string;
  garageName?: string;
  serviceCost?: number;
  notes?: string;
  rating?: number;
}

export interface Garage {
  id: string;
  googlePlaceId?: string;
  name: string;
  type: 'garage' | 'petrol_station' | 'dealer' | 'mobile_mechanic';
  address: string;
  lat: number;
  lng: number;
  phone?: string;
  avgRating?: number;
}

export interface ServiceAlert {
  id: string;
  vehicleId: string;
  alertType: 'mileage' | 'date' | 'both';
  dueMileage?: number;
  dueDate?: string;
  serviceType: string;
  isDismissed: boolean;
}
```

---

## Environment Variables (`.env.local` at repo root)

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

---

## Zustand Store (`src/stores/appStore.ts`)

```typescript
interface AppState {
  user: User | null
  session: Session | null
  loading: boolean            // defaults to true; set false after first getSession()
  vehicles: Vehicle[]
  serviceLogs: ServiceLog[]
  alerts: ServiceAlert[]
  activeVehicleId: string | null

  setAuthState: (user: User | null, session: Session | null) => void
  setLoading: (loading: boolean) => void
  setDisplayName: (displayName: string) => void
  clearAuthState: () => void
  clearAll: () => void        // wipes sessionStorage + resets all state
}
```

**Key behavior:** Display name is persisted in sessionStorage keyed by `mazdacare_display_name:{userId}`. `clearAll()` wipes the entire sessionStorage and resets store to defaults.

---

## Step-by-Step Build Prompts for Your AI Agent

Copy and paste each prompt in order into your IDE's AI agent (Cursor, Copilot, Cline, etc).

---

### PROMPT 1 — Project Scaffold ✅ DONE

> **Actual implementation notes:**  
> - Used Vite 7 + React 19 + TypeScript 6 (newer than originally planned)  
> - Font changed from Inter to **Geist** (`@fontsource-variable/geist`)  
> - Mazda red primary updated to **#A31526** (Soul Red, closer to actual Mazda branding)  
> - PWA theme colors changed to **#111010** (dark theme)  
> - Additional deps added: `motion` (animations), `dompurify` (XSS), `sonner` (toasts), `radix-ui`, `next-themes`  
> - shadcn initialized with **Radix UI primitives** and `tw-animate-css`  
> - Routing simplified: `/auth` → Auth, `/` → ProtectedRoute → Phase4Shell (single-page shell with tab navigation)  

```
Create a new Vite + React + TypeScript project called "mazda-app" using pnpm.

Install these dependencies:
- @supabase/supabase-js
- react-router-dom
- zustand
- tailwindcss @tailwindcss/forms
- @googlemaps/js-api-loader @react-google-maps/api
- vite-plugin-pwa
- date-fns
- react-hook-form
- zod @hookform/resolvers
- lucide-react
- clsx tailwind-merge
- motion
- dompurify
- sonner
- radix-ui

Install shadcn/ui and initialize it with the "new-york" style, slate base color.

Add these shadcn components: button, card, input, select, dialog, sheet, badge, toast, tabs, form, label, slider, avatar, progress.

Set up Tailwind CSS with Geist font and a custom Mazda Soul Red primary color: #A31526.

Configure React Router with these routes:
  / → Phase4Shell (unified app shell with tab navigation: home, garage, map, profile)
  /auth → Auth

Set up a bottom navigation bar component for mobile with icons for: Home, Garage, Map, Profile.

Configure the PWA manifest in vite.config.ts with:
  name: "Mazda Maintenance Kenya"
  short_name: "MazdaCare"
  theme_color: "#111010"
  background_color: "#111010"
  display: "standalone"
  icons at 192 and 512px
```

---

### PROMPT 2 — Supabase Client + Auth ✅ DONE

> **Actual implementation notes:**  
> - ProtectedRoute simplified to minimal loading/user check (no validation logic, no timeouts)  
> - Phase4Shell reads `user` directly from Zustand store — does NOT call `useAuth()` (fixed infinite loading loop)  
> - `useAuth.ts` initializes session once; store default `loading: true` handles first load  
> - Display name stored in sessionStorage per user  
> - Google OAuth and email/password both working in production  

```
Create src/lib/supabase.ts with the Supabase client initialized from VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY env vars.

Create src/pages/Auth.tsx with:
- Email + password sign-in and sign-up tabs
- Google OAuth button using supabase.auth.signInWithOAuth({ provider: 'google' })
- Loading states and error handling with toast notifications
- Redirect to "/" on successful auth

Create src/hooks/useAuth.ts that:
- Subscribes to supabase.auth.onAuthStateChange
- Exposes: user, session, signOut, loading
- Stores auth state in Zustand (src/stores/appStore.ts)

Create a ProtectedRoute wrapper component that redirects unauthenticated users to /auth.

Wrap all routes except /auth with ProtectedRoute in App.tsx.
```

---

### PROMPT 3 — Vehicle Management ✅ DONE

> **Actual implementation notes:**  
> - VIN field is **optional** (not part of form validation)  
> - Engine size uses a **horizontal scroll pill selector** (1.5L Petrol, 1.5L Diesel, 2.0L Petrol, 2.2L Diesel, 2.5L Petrol)  
> - Mileage interval expanded to **4 options**: 5,000 / 7,000 / 9,000 / 10,000 km (horizontal scroll pills)  
> - Add-car wizard is **embedded in Phase4Shell** (not a separate page) with model grid → details form flow  
> - All vehicle inputs sanitized via DOMPurify at insert boundary  
> - Max 10 vehicles per user enforced by DB trigger  

```
Using the Vehicle interface from src/types/index.ts and the MAZDA_MODELS array from src/lib/mazda-models.ts, create:

1. src/hooks/useVehicles.ts
   - fetchVehicles(): queries Supabase "vehicles" table for current user
   - addVehicle(data): inserts new vehicle
   - updateVehicle(id, data): updates vehicle mileage
   - deleteVehicle(id): deletes vehicle

2. src/pages/AddCar.tsx — a multi-step form (3 steps):
   Step 1: Select Mazda model from dropdown (MAZDA_MODELS list), year picker, fuel type toggle (Petrol/Diesel), engine size input
   Step 2: Registration plate input (Kenya format KXX 123A), current mileage input, mileage interval selector (5,000 km or 10,000 km using a segmented control), car color picker (basic colors)
   Step 3: Summary card showing all details, confirm button

   Use react-hook-form + zod for validation.
   On submit, save to Supabase and redirect to Dashboard.

3. src/components/car/CarCard.tsx
   - Displays: model, year, fuel badge (green=petrol, blue=diesel), registration, current mileage
   - Shows progress bar for mileage to next service (current vs next_service_mileage)
   - Tap to navigate to /service/:vehicleId
   - Edit icon to update mileage
```

---

### PROMPT 4 — Service Logging ✅ DONE

> **Actual implementation notes:**  
> - Service log form embedded in Phase4Shell's garage tab  
> - Kenya oil data with 9 brands/grades fully integrated  
> - Max 500 service logs per vehicle enforced by DB trigger  

```
Using the ServiceLog interface from src/types/index.ts and KENYA_MAZDA_OILS from src/lib/oils.ts:

1. src/hooks/useServiceLogs.ts
   - fetchLogs(vehicleId): get all logs for a vehicle, ordered by date desc
   - addLog(data): insert new log, also update vehicle current_mileage and create next service_alert
   - deleteLog(id)

2. src/pages/LogService.tsx — a form page to log a completed service:

   Section A — Service details:
   - Date picker (default today)
   - Mileage at service (number input, pre-filled with vehicle's current mileage)
   - Service type selector: Minor Service / Major Service / Oil Change / Tyre Rotation / Brake Service / Other
     (show a brief description of what each involves)
   - Next service mileage (auto-calculated: current + vehicle interval, but user can override between 5000-10000 using a slider)

   Section B — Engine oil (show only if service type is Minor, Major, or Oil Change):
   - Filter oils dynamically from KENYA_MAZDA_OILS based on the vehicle's model and fuelType
   - Show oil cards: brand, grade, type badge (synthetic/semi-synthetic/mineral), approx price in KES
   - User selects one, then inputs quantity in litres (default 4)
   - "Oil not listed" option to type custom brand/grade

   Section C — Where was it serviced:
   - Toggle: Garage / Petrol Station / Mazda Dealer / Mobile Mechanic / Home
   - Search box that triggers Google Places Autocomplete (restricted to Kenya)
   - Or type manually
   - Star rating 1-5 for the service location

   Section D — Notes & cost:
   - Cost in KES (optional)
   - Notes text area

   On submit: save log, update vehicle mileage, create alert for next service, show success toast.

3. src/pages/ServiceLog.tsx — history list for a vehicle:
   - List of ServiceLogCard components showing: date, type, mileage, garage, rating, cost
   - Floating "+" button to navigate to LogService
   - Filter tabs: All / Minor / Major / Oil
```

---

### PROMPT 5 — Google Maps Garage Finder ✅ DONE (code complete)

> **Actual implementation notes:**  
> - Code complete using `@googlemaps/js-api-loader` + `@react-google-maps/api`  
> - Map tab in Phase4Shell renders the garage finder  
> - **Blocked in production:** `VITE_GOOGLE_MAPS_API_KEY` not yet set in Vercel env vars  
> - Community garage database saves to Supabase garages table  

```
Using @googlemaps/js-api-loader and the VITE_GOOGLE_MAPS_API_KEY env var:

1. Create src/lib/maps.ts:
   - initMap(elementId): loads Google Maps centered on Nairobi (lat: -1.2921, lng: 36.8219), zoom 13
   - searchNearbyGarages(map, location): uses Places API to search for:
     * "Mazda service center Nairobi"
     * "Car garage Nairobi"  
     * "Petrol station Nairobi"
     Returns Place results with name, address, rating, geometry
   - addGarageMarker(map, place, onClick): adds a custom red pin marker
   - getUserLocation(): wraps navigator.geolocation.getCurrentPosition in a Promise

2. src/pages/GarageMap.tsx:
   - Full-screen Google Map (height: calc(100vh - 120px))
   - On load: request user location, center map there, run nearby garage search
   - Map markers for each result (red for garages, blue for petrol stations, gold for Mazda dealers)
   - Bottom sheet (using shadcn Sheet) listing garages as scrollable cards
   - Each garage card shows: name, address, Google rating, distance, "Get directions" button (opens Google Maps app)
   - Search bar at top to search for specific garage by name or area
   - "Add this garage to my log" button on each card that pre-fills the service log form

3. src/components/map/GarageCard.tsx:
   - Name, type badge, address
   - Star rating (from Google Places + internal user ratings)
   - Distance from user
   - Phone (if available)
   - "Rate this garage" inline star picker that saves to Supabase garages table

Save garages to Supabase when a user selects/rates one to build a community garage database.
```

---

### PROMPT 6 — Service Scheduler & Alerts ✅ DONE

> **Actual implementation notes:**  
> - Alert banner shows in Home tab when service due within 1,000 km  
> - Edge Function `check-alerts` deployed and active on daily cron (07:00 UTC)  
> - Push subscriptions table with RLS  
> - Secrets configured: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, VAPID keys  

```
Create the service scheduling system:

1. src/hooks/useAlerts.ts:
   - fetchAlerts(userId): get undismissed alerts
   - calculateNextService(vehicle, lastLog): returns { dueMileage, dueDate, kmRemaining, daysRemaining }
     Logic: dueMileage = lastLog.mileage + vehicle.mileageInterval
            dueDate = lastLog.date + 3 months (for minor) or 6 months (for major)
            kmRemaining = dueMileage - vehicle.currentMileage
   - dismissAlert(id): marks alert as dismissed

2. src/pages/Schedule.tsx:
   - Top card: vehicle name + "Next service in X km or by DATE (whichever comes first)"
   - Progress bar: colored green→yellow→red based on % of interval used
     (green: >40% remaining, yellow: 10-40%, red: <10%)
   - Service checklist card for the upcoming service type (minor vs major):
     Minor: engine oil + filter, air filter check, tyre pressure, fluid levels
     Major: everything in minor + brake pads, spark plugs, transmission fluid, timing belt check
   - "Schedule reminder" button: creates a browser push notification via Web Push API
   - Past services timeline: chronological list with mileage milestones
   - Estimated cost range card (in KES): show typical minor (KES 3,000-6,000) vs major (KES 8,000-20,000)

3. AlertBanner component:
   - Shows at top of Dashboard when a service is due within 500km or 2 weeks
   - Red banner with dismiss X button
   - Tap to navigate to Schedule page
```

---

### PROMPT 7 — Dashboard & Polish ✅ DONE

> **Actual implementation notes:**  
> - Dashboard now lives in Phase4Shell's **home** tab (not a separate page)  
> - Features: Hero Vehicle Card (image + gradient + status badge + mileage), time-of-day greeting, quick stats grid  
> - Empty Home State with personalized greeting and "Add My First Mazda" CTA  
> - Quick Actions 2×2 grid: Find Service, Book Appointment, Roadside Assist, Manuals  
> - Settings accessible from profile tab: display name, sign out  
> - Install App banner (beforeinstallprompt)  
> - Loading skeletons, pull-to-refresh, mobile-optimized touch targets  
> - Idle timeout auto-logout  

```
Build the main Dashboard page (src/pages/Dashboard.tsx):

Header section:
- Welcome message "Hello [first name]" 
- Greeting based on time of day (Good morning/afternoon/evening)
- Mazda logo or car icon

If user has no cars:
- Empty state with illustration, "Add your Mazda" CTA button

If user has cars (support multiple vehicles):
- Horizontal scroll of CarCard components (one per vehicle)
- Active vehicle selector (dots indicator below)

For the selected vehicle:
- Next service countdown card (large, prominent): "Next service in 2,340 km" with circular progress
- Last service summary card: date, type, garage name, rating stars
- Quick action buttons row: [Log Service] [Find Garage] [View Schedule]
- Recent service log (last 3 entries)

Bottom navigation tabs: Dashboard | Services | Map | Schedule

Global polish:
- Add loading skeletons for all data-fetching states
- Add pull-to-refresh on mobile (touch events)
- Add empty states for all list views
- Ensure all forms work well on mobile (large touch targets, no zoom on input focus: font-size 16px minimum)
- Add a settings page (accessible from header avatar): profile name, push notification toggle, mileage unit (km only for Kenya), sign out button
- Wrap the whole app in a Toaster for toast notifications
- Add a simple onboarding flow: if no vehicles exist and user is new, auto-navigate to AddCar
```

---

### PROMPT 8 — PWA & Deployment ✅ DONE

> **Actual implementation notes:**  
> - Workbox: CacheFirst for static assets (30 days, 200 max), NetworkFirst for API (5s timeout, 1 day cache, 100 max)  
> - Background sync for service log POST requests (24h retention)  
> - Additional manifest entries pre-cached: `/`, `/add-car`, `/map`, `/auth`  
> - Build chunks optimized: vendor (react*), supabase, maps  
> - Vercel connected to GitHub `Boxcode254/MazdaCare_WebAPP`, auto-deploys on main push  
> - Env vars configured in Vercel: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`  
> - Google OAuth redirect URL set in Supabase  
> - All 5 SQL migrations applied to remote  

```
Finalize PWA and deploy:

1. vite.config.ts PWA setup:
   - workbox strategy: CacheFirst for static assets, NetworkFirst for API calls
   - Pre-cache all pages for offline use
   - Background sync for service logs submitted while offline

2. public/manifest.json:
{
  "name": "Mazda Maintenance Kenya",
  "short_name": "MazdaCare",
  "description": "Track your Mazda service history",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#111010",
  "theme_color": "#111010",
  "orientation": "portrait",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}

3. Create an "Install App" button in the header that:
   - Listens for the beforeinstallprompt event
   - Shows a banner: "Install MazdaCare on your phone" with Install button
   - Calls prompt() on click
   - Hides after install

4. Supabase Edge Function for scheduled alerts (supabase/functions/check-alerts/index.ts):
   - Runs daily via cron
   - Queries vehicles where current_mileage >= (next_service_mileage - 500)
   - Sends push notification via Web Push to subscribed users

5. Deploy to Vercel:
   - Connect GitHub repo to Vercel
   - Set environment variables in Vercel dashboard
   - Enable automatic deployments on main branch push
   - Add custom domain if available (e.g. mazdacare.co.ke)

6. Supabase setup checklist:
   - Run all SQL migrations
   - Enable Google OAuth in Supabase Auth settings
   - Add production URL to Supabase allowed redirect URLs
   - Enable Row Level Security on all tables (verify policies)
   - Add Google Maps API key restrictions (HTTP referrers: your domain)
```

---

## API Keys & Services

| Service | Where to get | Status | Cost |
|---|---|---|---|
| Supabase | supabase.com → New project | ✅ Active (ref: rmfkykcijcndwvsursmu) | Free tier (500MB, 50k MAU) |
| Google Maps JS API | console.cloud.google.com | ⚠️ Key exists locally, NOT in Vercel | ~$7/1000 loads (free $200/month credit) |
| Google Places API | Same project as Maps | ⚠️ Same as above | Included in $200 credit |
| Google OAuth | Same GCP project → OAuth consent screen | ✅ Active | Free |

## Build Time (Actual)

| Phase | Planned | Actual Status |
|---|---|---|
| Scaffold + Auth | 2-3 hours | ✅ Complete |
| Vehicle management | 3-4 hours | ✅ Complete |
| Service logging | 4-5 hours | ✅ Complete |
| Maps integration | 3-4 hours | ✅ Complete (needs API key in prod) |
| Scheduler + alerts | 2-3 hours | ✅ Complete |
| Dashboard + polish | 3-4 hours | ✅ Complete |
| PWA + deploy | 1-2 hours | ✅ Complete |
| UI/UX redesign (3 phases) | — | ✅ Complete |
| Phase 4 (logo, security, refinement) | — | 🔧 In progress |

---

## Cost to Run (Monthly, Kenya)

| Service | Free Tier Covers | Paid if exceeded |
|---|---|---|
| Supabase | 500MB DB, 50k users | $25/month (Pro) |
| Vercel | Unlimited hobby deploys | $20/month (Pro) |
| Google Maps | $200 credit (~28k map loads) | $7 per 1000 loads |
| **Total** | **KES 0** for early stage | ~KES 6,000/month at scale |
