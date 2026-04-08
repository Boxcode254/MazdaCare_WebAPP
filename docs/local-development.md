# Local development

Run all commands from the **repository root** (directory that contains `package.json`).

## Prerequisites

- [Node.js](https://nodejs.org/) (version aligned with the repo)
- [pnpm](https://pnpm.io/)

## Setup

```bash
pnpm install
```

Copy `.env.example` to `.env` or `.env.local` and set `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and optionally `VITE_GOOGLE_MAPS_API_KEY`. Never commit real values.

## Common commands

| Task | Command |
|------|---------|
| Dev server | `pnpm dev` |
| Dev (LAN) | `pnpm dev --host 0.0.0.0` |
| Production build | `pnpm build` |
| Refresh status snapshot in docs | `pnpm status:update` |

`pnpm status:update` updates the **Auto Snapshot** section in [Project status](./project-status.md).

## PWA icons

Source artwork: `src/assets/mazdacare-icon.svg`. Export 192×192 and 512×512 PNGs to `public/icons/` as `icon-192.png` and `icon-512.png`. Details and tool examples are in [`README.md`](../README.md).
