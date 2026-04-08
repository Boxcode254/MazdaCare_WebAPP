import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const envPath = path.join(root, '.env.local')

function readGithubToken() {
  if (!fs.existsSync(envPath)) {
    throw new Error(
      `Missing ${path.relative(process.cwd(), envPath) || '.env.local'}. Add GITHUB_TOKEN there (never commit). See docs/local-development.md.`,
    )
  }
  const text = fs.readFileSync(envPath, 'utf8')
  for (const raw of text.split('\n')) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const m = line.match(/^GITHUB_TOKEN=(.*)$/)
    if (!m) continue
    let v = m[1].trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1)
    }
    if (v.length > 0) return v
  }
  throw new Error('GITHUB_TOKEN not found in .env.local (add it on one line: GITHUB_TOKEN=...)')
}

function runGit(args) {
  const r = spawnSync('git', args, {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
  })
  if (r.stdout) process.stdout.write(r.stdout)
  if (r.stderr) process.stderr.write(r.stderr)
  return r.status ?? 1
}

const branch =
  spawnSync('git', ['branch', '--show-current'], { cwd: root, encoding: 'utf8' }).stdout?.trim() ||
  'main'

const token = readGithubToken()
const ownerRepo = 'Boxcode254/MazdaCare_WebAPP'
const pushUrl = `https://x-access-token:${encodeURIComponent(token)}@github.com/${ownerRepo}.git`

const code = runGit(['push', pushUrl, `${branch}:${branch}`])
process.exit(code)
