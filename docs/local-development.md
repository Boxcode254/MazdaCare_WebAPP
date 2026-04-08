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

`.env.local` is gitignored (`*.local` / `.env*.local`). Keep **GitHub PATs only there** (or in your OS credential manager), never in chat or committed files.

### Push to GitHub with a token in `.env.local`

If `git push` fails with a username/password prompt:

1. Revoke any Personal Access Token that was ever pasted into a chat or ticket; create a **new** PAT with `repo` scope (or fine-grained access to this repository).
2. Add a single line to `.env.local` (same folder as `package.json`):

   `GITHUB_TOKEN=your_new_token_here`

3. Run:

   `pnpm push:github`

The script reads the token from `.env.local` only; it is not stored in the repo. Prefer SSH remotes or `gh auth login` long term.

## Common commands

| Task | Command |
|------|---------|
| Dev server | `pnpm dev` |
| Dev (LAN) | `pnpm dev --host 0.0.0.0` |
| Production build | `pnpm build` |
| Refresh status snapshot in docs | `pnpm status:update` |
| Push using `GITHUB_TOKEN` in `.env.local` | `pnpm push:github` |

`pnpm status:update` updates the **Auto Snapshot** section in [Project status](./project-status.md).

## PWA icons

Source artwork: `src/assets/mazdacare-icon.svg`. Export 192×192 and 512×512 PNGs to `public/icons/` as `icon-192.png` and `icon-512.png`. Details and tool examples are in [`README.md`](../README.md).
