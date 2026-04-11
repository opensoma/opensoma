import { error } from './stderr'

export function handleError(err: unknown): void {
  const message = err instanceof Error ? err.message : typeof err === 'string' ? err : 'Unknown error'
  error(JSON.stringify({ error: message }))
  process.exit(1)
}
