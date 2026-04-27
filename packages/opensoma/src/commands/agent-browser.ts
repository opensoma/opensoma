import { Command } from 'commander'

import { AgentBrowserLauncher } from '../agent-browser-launcher'
import { handleError } from '../shared/utils/error-handler'
import { createAuthenticatedHttp } from './helpers'

type LaunchOptions = { binary?: string }

async function launchAction(url: string, options: LaunchOptions): Promise<void> {
  try {
    const http = await createAuthenticatedHttp()
    const sessionCookie = http.getSessionCookie()
    if (!sessionCookie) {
      throw new Error('Authenticated session is missing a session cookie. Run: opensoma auth login')
    }

    const launcher = new AgentBrowserLauncher({ binary: options.binary })
    const { exitCode } = await launcher.launch({ url, sessionCookie })
    process.exit(exitCode)
  } catch (error) {
    handleError(error)
  }
}

export const agentBrowserCommand = new Command('agent-browser')
  .description('Launch agent-browser pre-authenticated to swmaestro.ai')
  .addCommand(
    new Command('launch')
      .description('Open a swmaestro.ai URL in agent-browser with the current opensoma session injected')
      .argument('<url>', 'swmaestro.ai URL to open')
      .option('--binary <path>', 'Path to the agent-browser executable (default: agent-browser on PATH)')
      .action(launchAction),
  )
