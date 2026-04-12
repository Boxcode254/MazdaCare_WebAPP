import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const envLocalPath = path.join(root, '.env.local')
const envPath = path.join(root, '.env')
const ownerRepo = 'Boxcode254/MazdaCare_WebAPP'
const productionUrl = 'https://mazdacare-app.vercel.app'
const argv = process.argv.slice(2)
const isDryRun = argv.includes('--dry-run')
const skipVerify = argv.includes('--skip-verify')

function parseCommitMessage(args) {
  const filtered = []

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]

    if (arg === '--') {
      continue
    }

    if (arg === '--dry-run' || arg === '--skip-verify') {
      continue
    }

    if (arg === '--message' || arg === '-m') {
      return args.slice(index + 1).join(' ').trim()
    }

    filtered.push(arg)
  }

  return filtered.join(' ').trim()
}

const commitMessage = parseCommitMessage(argv) || 'chore: sync Vercel deployment'

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

  return null
}

function run(command, args, options = {}) {
  const r = spawnSync(command, args, {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, GIT_TERMINAL_PROMPT: '0', ...options.env },
  })
  if (r.stdout) process.stdout.write(r.stdout)
  if (r.stderr) process.stderr.write(r.stderr)
  return r.status ?? 1
}

function capture(command, args, options = {}) {
  const r = spawnSync(command, args, {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, GIT_TERMINAL_PROMPT: '0', ...options.env },
  })

  if ((r.status ?? 1) !== 0) {
    const message = [r.stdout, r.stderr].filter(Boolean).join('\n').trim() || `${command} ${args.join(' ')} failed`
    throw new Error(message)
  }

  return (r.stdout ?? '').trim()
}

function runGit(args, options = {}) {
  return run('git', args, options)
}

function readGit(args) {
  return capture('git', args)
}

function hasWorkingTreeChanges() {
  return readGit(['status', '--porcelain']).length > 0
}

function hasStagedChanges() {
  return readGit(['diff', '--cached', '--name-only']).length > 0
}

function aheadCount(branch) {
  const remoteRef = `origin/${branch}`
  const remoteExists = spawnSync('git', ['rev-parse', '--verify', '--quiet', remoteRef], {
    cwd: root,
    encoding: 'utf8',
  }).status === 0

  if (!remoteExists) {
    return 0
  }

  const count = readGit(['rev-list', '--count', `${remoteRef}..HEAD`])
  return Number.parseInt(count, 10) || 0
}

function runBuildIfNeeded() {
  console.log('Running production build before deployment...')
  const code = run('pnpm', ['build'])
  if (code !== 0) {
    throw new Error('Build failed. Deployment aborted.')
  }
}

function stageAndCommitIfNeeded() {
  if (!hasWorkingTreeChanges()) {
    console.log('Working tree clean. No new commit required.')
    return false
  }

  runBuildIfNeeded()

  const addCode = runGit(['add', '-A'])
  if (addCode !== 0) {
    throw new Error('Unable to stage changes for deployment.')
  }

  if (!hasStagedChanges()) {
    console.log('No staged changes found after build. Skipping commit.')
    return false
  }

  const commitCode = runGit(['commit', '-m', commitMessage])
  if (commitCode !== 0) {
    throw new Error('Commit failed. Deployment aborted.')
  }

  return true
}

async function fetchText(url) {
  const response = await fetch(url, { headers: { 'cache-control': 'no-cache' } })
  const text = await response.text()
  return { response, text }
}

async function verifyProductionDeployment(startedAt) {
  if (skipVerify) {
    console.log('Skipping production verification because --skip-verify was provided.')
    return
  }

  console.log(`Verifying production deployment at ${productionUrl} ...`)

  const deadline = Date.now() + 5 * 60 * 1000
  let lastObservedModified = null

  while (Date.now() < deadline) {
    const homeResponse = await fetch(productionUrl, {
      headers: { 'cache-control': 'no-cache' },
    })

    const lastModified = homeResponse.headers.get('last-modified')
    lastObservedModified = lastModified

    if (homeResponse.ok && lastModified) {
      const modifiedAt = Date.parse(lastModified)
      if (!Number.isNaN(modifiedAt) && modifiedAt >= startedAt - 60000) {
        const homeHtml = await homeResponse.text()
        const scriptMatch = homeHtml.match(/<script type="module" crossorigin src="([^"]+)"/)
        const scriptUrl = scriptMatch ? new URL(scriptMatch[1], productionUrl).toString() : null

        const manifestResponse = await fetch(new URL('/manifest.webmanifest', productionUrl), {
          headers: { 'cache-control': 'no-cache' },
        })
        const swResponse = await fetch(new URL('/registerSW.js', productionUrl), {
          headers: { 'cache-control': 'no-cache' },
        })

        if (!manifestResponse.ok || !swResponse.ok) {
          throw new Error('Production deployment responded, but manifest or service worker registration is unavailable.')
        }

        if (scriptUrl) {
          const scriptResponse = await fetch(scriptUrl, {
            headers: { 'cache-control': 'no-cache' },
          })

          if (!scriptResponse.ok) {
            throw new Error(`Production deployment responded, but the current JS asset failed: ${scriptUrl}`)
          }
        }

        console.log(`Production verified. Last-Modified: ${lastModified}`)
        return
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 15000))
  }

  throw new Error(
    `Timed out waiting for Vercel to serve a fresh deployment. Last observed Last-Modified header: ${lastObservedModified ?? 'missing'}`
  )
}

const branch =
  readGit(['branch', '--show-current']) || 'main'

const token = readGithubToken()
const pushTarget = token
  ? `https://x-access-token:${encodeURIComponent(token)}@github.com/${ownerRepo}.git`
  : 'origin'
const startedAt = Date.now()

async function main() {
  if (isDryRun) {
    const dirty = hasWorkingTreeChanges()
    const ahead = aheadCount(branch)
    console.log('Dry run summary:')
    console.log(`- branch: ${branch}`)
    console.log(`- commit message: ${commitMessage}`)
    console.log(`- working tree dirty: ${dirty ? 'yes' : 'no'}`)
    console.log(`- would build before commit: ${dirty ? 'yes' : 'no'}`)
    console.log(`- would create commit: ${dirty ? 'yes' : 'no'}`)
    console.log(`- commits ahead of origin/${branch}: ${ahead}`)
    console.log(`- production verification: ${skipVerify ? 'skipped' : 'would run after push'}`)
    return
  }

  const createdCommit = stageAndCommitIfNeeded()
  const ahead = aheadCount(branch)

  if (ahead === 0) {
    console.log(`No commits ahead of origin/${branch}. Nothing to push.`)
  } else {
    if (!token) {
      console.log('No GITHUB_TOKEN found. Falling back to the configured git remote credentials.')
    }

    const pushCode = runGit(['push', pushTarget, `${branch}:${branch}`], {
      env: { SKIP_MAZDA_PRE_PUSH: '1' },
    })

    if (pushCode !== 0) {
      throw new Error('Git push failed.')
    }
  }

  await verifyProductionDeployment(startedAt)
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
  process.exit(1)
})
