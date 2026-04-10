# Routing and shell

## Public routes (`src/App.tsx`)

| Path | Screen |
|------|--------|
| `/auth` | Sign-in / sign-up (lazy `Auth` page). |
| `/` | Authenticated app: **`Phase4Shell`** only. |
| `*` | Redirects to `/`. |

There are **no** routes such as `/garage`, `/map`, or `/settings`. Deep links to those paths hit the catch-all and return to `/`.

## Phase4Shell — single app surface

All primary flows run inside **`Phase4Shell`** via **tabs** (`home` | `garage` | `map` | `profile`):

- **Home** — Dashboard / onboarding / empty states.
- **Garage** — Vehicles, service history, add car wizard entry, log service (embedded).
- **Map** — Garage finder.
- **Profile** — Settings (inline `SettingsView`), not a separate route.

Embedded modules import **page-level components** (e.g. `LogService` with `embedded`) as building blocks. They are **not** separate URLs.

## Legacy / unused page files

Files under `src/pages/` such as `Dashboard.tsx`, `Schedule.tsx`, `ServiceLog.tsx`, `History.tsx`, etc. are **legacy or experimental** unless imported by `Phase4Shell` or another active screen. **Do not** assume a filename implies a route.

When adding features, **extend the shell** (or `Auth`) rather than adding new top-level routes unless there is a strong reason (e.g. printable full-page export).

## Removed dead layout samples

`Sidebar.tsx` and `Navigation.tsx` that linked to `/garage`, `/map`, etc. were **not** used by `Phase4Shell` and have been removed to avoid confusion with the tab model.
