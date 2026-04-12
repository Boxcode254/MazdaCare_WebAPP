import { chmodSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const hooksDir = path.join(root, '.githooks')
const prePushHook = path.join(hooksDir, 'pre-push')

if (!existsSync(prePushHook)) {
  throw new Error(`Missing git hook file: ${prePushHook}`)
}

chmodSync(prePushHook, 0o755)

const result = spawnSync('git', ['config', 'core.hooksPath', '.githooks'], {
  cwd: root,
  encoding: 'utf8',
})

if (result.stdout) process.stdout.write(result.stdout)
if (result.stderr) process.stderr.write(result.stderr)

if ((result.status ?? 1) !== 0) {
  throw new Error('Unable to configure git hooks for mazda-app.')
}

process.stdout.write('Configured git hooks: core.hooksPath=.githooks\n')