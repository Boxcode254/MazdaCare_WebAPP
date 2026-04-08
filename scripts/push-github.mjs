import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const envLocalPath = path.join(root, '.env.local')
const envPath = path.join(root, '.env')

function parseGithubTokenFromFile(filePath) {
  if (!fs.existsSync(filePath)) return null
  const text = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '')
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const unexported = line.replace(/^\s*export\s+/, '')
    const m = unexported.match(/^\s*GITHUB_TOKEN\s*=\s*(.*)$/)
    if (!m) continue
    let v = m[1].trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1)
    }
    if (v.length > 0) return v
  }
  return null
}

function readGithubToken() {
  const fromEnv = process.env.GITHUB_TOKEN?.trim()
  if (fromEnv) return fromEnv

  const fromLocal = parseGithubTokenFromFile(envLocalPath)
  if (fromLocal) return fromLocal

  const fromEnvFile = parseGithubTokenFromFile(envPath)
  if (fromEnvFile) return fromEnvFile

  const relLocal = path.join('mazda-app', '.env.local')
  const hint = [
    'No GITHUB_TOKEN found. Use one of:',
    '  1) Export for this shell only:  export GITHUB_TOKEN=ghp_your_token',
    '  2) Add to mazda-app/.env.local (gitignored):  GITHUB_TOKEN=ghp_your_token',
    '     (no spaces around =; use a new PAT from https://github.com/settings/tokens )',
    '  3) Same line in mazda-app/.env if you use that file',
    'See docs/local-development.md',
  ].join('\n')
  throw new Error(hint)
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
