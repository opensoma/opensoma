#!/usr/bin/env bun

import { Command } from 'commander'

import pkg from '../package.json' with { type: 'json' }
import {
  agentBrowserCommand,
  authCommand,
  dashboardCommand,
  eventCommand,
  memberCommand,
  mentoringCommand,
  noticeCommand,
  reportCommand,
  roomCommand,
  scheduleCommand,
  teamCommand,
} from './commands/index'

function isAuthCommand(command: Command): boolean {
  let current: Command | null = command
  while (current) {
    if (current.name() === 'auth') {
      return true
    }
    current = current.parent
  }
  return false
}

const program = new Command()

program.name('opensoma').description('SWMaestro MyPage CLI for AI agents').version(pkg.version)

program.hook('preAction', async (_thisCommand, actionCommand) => {
  if (isAuthCommand(actionCommand)) {
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

program.addCommand(authCommand)
program.addCommand(agentBrowserCommand)
program.addCommand(mentoringCommand)
program.addCommand(roomCommand)
program.addCommand(dashboardCommand)
program.addCommand(noticeCommand)
program.addCommand(teamCommand)
program.addCommand(memberCommand)
program.addCommand(eventCommand)
program.addCommand(scheduleCommand)
program.addCommand(reportCommand)

program.parse(process.argv)

export { program }
