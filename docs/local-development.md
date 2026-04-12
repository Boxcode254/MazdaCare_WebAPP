# Local development

Run commands from **`mazda-app/`** (the directory that contains this repo’s `package.json`), for example:

```bash
cd mazda-app
pnpm push:github -- "Describe the deployment"
```

If your editor opens the parent folder (`MAZDA_SERVICE_APP`), you can run the same scripts from there with `pnpm push:github` — a root `package.json` forwards into `mazda-app/`. Do **not** type `mazda-app/:` as a shell command; use `cd mazda-app` instead.

Vercel tracks the **app repo inside `mazda-app/`**. Use the forwarded script instead of committing or pushing the outer wrapper repo when you want a production deployment.

## Prerequisites

- [Node.js](https://nodejs.org/) (version aligned with the repo)
- [pnpm](https://pnpm.io/)

## Setup

```bash
pnpm install
```

Copy `.env.example` to `.env` or `.env.local` and set `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and optionally `VITE_GOOGLE_MAPS_API_KEY`. Never commit real values.

`.env.local` is gitignored (`*.local` / `.env*.local`). Keep **GitHub PATs only there** (or in your OS credential manager), never in chat or committed files.

### Automated Vercel deployment

`pnpm push:github` now does the full deployment workflow for the app repo:

1. Builds the production app.
2. Stages and commits tracked changes when the working tree is dirty.
3. Pushes `main` to GitHub.
4. Polls the live Vercel app until the fresh deployment is visible.

Examples:

```bash
pnpm push:github -- "Refine vehicle service cards"
pnpm deploy:vercel -- -m "Adjust service log UX"
```

Use `--dry-run` to preview what the deployment command would do without creating a commit or pushing.

### Push to GitHub with a token in `.env.local`

If `git push` fails with a username/password prompt:

1. Revoke any Personal Access Token that was ever pasted into a chat or ticket; create a **new** PAT with `repo` scope (or fine-grained access to this repository).
2. Provide the token in **one** of these ways (never commit):

   - **Shell (one session):** `export GITHUB_TOKEN=your_new_token` then `pnpm push:github -- "Your commit message"`
   - **File:** add `GITHUB_TOKEN=your_new_token` to `mazda-app/.env.local` or `mazda-app/.env` (no spaces around `=`)

3. Run:

   `pnpm push:github -- "Your commit message"`

The script checks `GITHUB_TOKEN` in the environment first, then `.env.local`, then `.env`. Prefer SSH remotes or `gh auth login` long term.

### Git hook guard

Run `pnpm install:hooks` once in `mazda-app/` after cloning. That installs a `pre-push` guard which blocks raw `git push` and points you back to `pnpm push:github`, so deployments stay build-validated and Vercel-synced.

## Common commands

| Task | Command |
|------|---------|
| Dev server | `pnpm dev` |
| Dev (LAN) | `pnpm dev --host 0.0.0.0` |
| Production build | `pnpm build` |
| Refresh status snapshot in docs | `pnpm status:update` |
| Install the git hook guard | `pnpm install:hooks` |
| Automated GitHub push + Vercel verify | `pnpm push:github -- "Commit message"` |
| Alias for the same deployment flow | `pnpm deploy:vercel -- "Commit message"` |

`pnpm status:update` updates the **Auto Snapshot** section in [Project status](./project-status.md).

## PWA icons

Source artwork: `src/assets/mazdacare-icon.svg`. Export 192×192 and 512×512 PNGs to `public/icons/` as `icon-192.png` and `icon-512.png`. Details and tool examples are in [`README.md`](../README.md).
