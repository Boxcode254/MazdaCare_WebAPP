import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const statusFilePath = path.join(root, 'PROJECT_STATUS.md')
const envFilePath = path.join(root, '.env.local')

function run(command) {
  try {
    return execSync(command, {
      cwd: root,
      stdio: ['ignore', 'pipe', 'ignore'],
      encoding: 'utf8',
    }).trim()
  } catch {
    return ''
  }
}

function isMapsKeyConfigured() {
  if (!fs.existsSync(envFilePath)) {
    return false
  }

  const envContents = fs.readFileSync(envFilePath, 'utf8')
  const line = envContents
    .split('\n')
    .find((entry) => entry.startsWith('VITE_GOOGLE_MAPS_API_KEY='))

  if (!line) {
    return false
  }

  const value = line.slice('VITE_GOOGLE_MAPS_API_KEY='.length).trim().replace(/^"|"$/g, '')
  return value.length > 0
}

const branch = run('git branch --show-current') || 'unknown'
const commit = run('git rev-parse --short HEAD') || 'none'
const shortStatusRaw = run('git status -sb')
const shortStatusLines = shortStatusRaw ? shortStatusRaw.split('\n').filter(Boolean) : []

let gitStatusText = 'unknown'
if (shortStatusLines.length > 0) {
  const tracking = shortStatusLines[0].replace(/^##\s*/, '')
  if (shortStatusLines.length === 1) {
    gitStatusText = `clean (${tracking})`
  } else {
    gitStatusText = `dirty (${shortStatusLines.length - 1} file(s) changed, ${tracking})`
  }
}

const now = new Date()
const timestamp = now.toISOString()
const mapsConfigured = isMapsKeyConfigured() ? 'yes' : 'no'

const autoSection = [
  '<!-- AUTO_STATUS_START -->',
  '## Auto Snapshot',
  '',
  `- Last auto update: ${timestamp}`,
  `- Branch: ${branch}`,
  `- Latest commit: ${commit}`,
  `- Git status: ${gitStatusText}`,
  '- Production app URL: https://mazdacare-app.vercel.app',
  '- Vercel project: mazdacare-app',
  '- Supabase project ref: rmfkykcijcndwvsursmu',
  `- Google Maps key configured locally: ${mapsConfigured}`,
  '',
  '<!-- AUTO_STATUS_END -->',
].join('\n')

const fallbackDoc = [
  '# MazdaCare Project Status',
  '',
  autoSection,
  '',
  '## Build Progress (Plan Prompts)',
  '',
  '- Prompt 1: Project scaffold - DONE',
  '- Prompt 2: Supabase auth setup - DONE',
  '- Prompt 3: Vehicle management - DONE',
  '- Prompt 4: Service logging - DONE',
  '- Prompt 5: Google Maps garage finder - DONE (code complete)',
  '- Prompt 6: Scheduler and alerts - DONE',
  '- Prompt 7: Dashboard and polish - DONE',
  '- Prompt 8: PWA and deployment - DONE (with a few manual external checks pending)',
].join('\n')

if (!fs.existsSync(statusFilePath)) {
  fs.writeFileSync(statusFilePath, `${fallbackDoc}\n`, 'utf8')
  process.exit(0)
}

const current = fs.readFileSync(statusFilePath, 'utf8')
const start = '<!-- AUTO_STATUS_START -->'
const end = '<!-- AUTO_STATUS_END -->'

if (current.includes(start) && current.includes(end)) {
  const updated = current.replace(new RegExp(`${start}[\\s\\S]*?${end}`, 'm'), autoSection)
  fs.writeFileSync(statusFilePath, updated, 'utf8')
  process.exit(0)
}

const lines = current.split('\n')
if (lines[0].startsWith('# ')) {
  const rebuilt = [lines[0], '', autoSection, '', ...lines.slice(1)].join('\n')
  fs.writeFileSync(statusFilePath, rebuilt, 'utf8')
} else {
  fs.writeFileSync(statusFilePath, `${fallbackDoc}\n\n${current}`, 'utf8')
}
