#!/usr/bin/env bun
// Per-file process isolation test runner.
//
// Bun's mock.module() leaks across test files (oven-sh/bun#12823)
// because mock.restore() doesn't clean up module mocks (documented).
// Running each file in its own process eliminates contamination.

import { Glob } from 'bun'

const root = 'src'
const glob = new Glob('**/*.test.ts')
const files = [...glob.scanSync(root)].sort().map((f) => `${root}/${f}`)

let totalPass = 0
let totalFail = 0
let totalExpect = 0
let failedFiles: string[] = []

const concurrency = navigator.hardwareConcurrency ?? 4
const queue = [...files]
const running = new Set<Promise<void>>()

async function runFile(file: string): Promise<void> {
  const proc = Bun.spawn(['bun', 'test', file], {
    stdout: 'pipe',
    stderr: 'pipe',
    env: process.env,
  })

  const [stdout, stderr] = await Promise.all([new Response(proc.stdout).text(), new Response(proc.stderr).text()])
  const exitCode = await proc.exited

  // eslint-disable-next-line no-control-regex
  const output = (stdout + stderr).replace(/\x1b\[[0-9;]*m/g, '')
  const passMatch = output.match(/(\d+) pass/)
  const failMatch = output.match(/(\d+) fail/)
  const expectMatch = output.match(/(\d+) expect\(\)/)

  const pass = passMatch ? parseInt(passMatch[1]) : 0
  const fail = failMatch ? parseInt(failMatch[1]) : exitCode !== 0 ? 1 : 0
  const expect = expectMatch ? parseInt(expectMatch[1]) : 0

  totalPass += pass
  totalFail += fail
  totalExpect += expect

  if (exitCode !== 0) {
    failedFiles.push(file)
    process.stdout.write(stdout)
    if (stderr) process.stderr.write(stderr)
  }
}

while (queue.length > 0 || running.size > 0) {
  while (queue.length > 0 && running.size < concurrency) {
    const file = queue.shift()!
    const promise = runFile(file).then(() => {
      running.delete(promise)
    })
    running.add(promise)
  }
  if (running.size > 0) {
    await Promise.race(running)
  }
}

const totalTests = totalPass + totalFail
console.log()
if (failedFiles.length > 0) {
  console.log(`\x1b[31m ${totalFail} fail\x1b[0m`)
}
console.log(` \x1b[32m${totalPass} pass\x1b[0m`)
console.log(` ${totalExpect} expect() calls`)
console.log(`Ran ${totalTests} tests across ${files.length} files.`)

if (failedFiles.length > 0) {
  console.log(`\n\x1b[31mFailed files:\x1b[0m`)
  for (const f of failedFiles) {
    console.log(`  ${f}`)
  }
  process.exit(1)
}
