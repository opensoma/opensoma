import { describe, expect, it } from 'bun:test'

import { program } from './cli'

function getCommandHelp(path: readonly string[]): string {
  let command = program
  for (const name of path) {
    const child = command.commands.find((candidate) => candidate.name() === name)
    if (!child) {
      throw new Error(`Command not found: ${path.join(' ')}`)
    }
    command = child
  }
  return command.helpInformation()
}

describe('CLI help', () => {
  it('shows the global --campus option in nested command help', () => {
    const help = getCommandHelp(['mentoring', 'list'])

    expect(help).toContain('Global Options:')
    expect(help).toContain('--campus <campus>')
    expect(help).toContain('Override campus for this command (seoul|busan)')
  })
})
