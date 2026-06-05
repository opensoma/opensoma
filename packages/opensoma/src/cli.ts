#!/usr/bin/env bun

import { Command } from 'commander'

import pkg from '../package.json' with { type: 'json' }
import {
  agentBrowserCommand,
  authCommand,
  dashboardCommand,
  memberCommand,
  mentoringCommand,
  noticeCommand,
  reportCommand,
  roomCommand,
  scheduleCommand,
  teamCommand,
  tozCommand,
} from './commands/index'

function isUnauthenticatedCommand(command: Command): boolean {
  let current: Command | null = command
  while (current) {
    const name = current.name()
    if (name === 'auth' || name === 'toz') {
      return true
    }
    current = current.parent
  }
  return false
}

const program = new Command()

program
  .name('opensoma')
  .description('SWMaestro MyPage CLI for AI agents')
  .version(pkg.version)
  .option('--campus <campus>', 'Override campus for this command (seoul|busan)')

program.hook('preAction', async (thisCommand, actionCommand) => {
  const { setCampusOverride } = await import('./campus-context')
  setCampusOverride(undefined)

  const campusOption = thisCommand.opts().campus as string | undefined
  if (campusOption) {
    const { parseSomaCampus } = await import('./campus')
    try {
      setCampusOverride(parseSomaCampus(campusOption))
    } catch (error) {
      console.error(JSON.stringify({ error: error instanceof Error ? error.message : 'Invalid campus' }))
      process.exit(1)
    }
  }

  if (isUnauthenticatedCommand(actionCommand)) {
    return
  }

  const { CredentialManager } = await import('./credential-manager')
  const manager = new CredentialManager()
  const creds = await manager.getCredentials()
  if (!creds) {
    console.error(JSON.stringify({ error: 'Not logged in. Run: opensoma auth login' }))
    process.exit(1)
  }
})

program.hook('postAction', async () => {
  const { setCampusOverride } = await import('./campus-context')
  setCampusOverride(undefined)
})

program.addCommand(authCommand)
program.addCommand(agentBrowserCommand)
program.addCommand(mentoringCommand)
program.addCommand(roomCommand)
program.addCommand(dashboardCommand)
program.addCommand(noticeCommand)
program.addCommand(teamCommand)
program.addCommand(memberCommand)
program.addCommand(scheduleCommand)
program.addCommand(reportCommand)
program.addCommand(tozCommand)

program.parse(process.argv)

export { program }
