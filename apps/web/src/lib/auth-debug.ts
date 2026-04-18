const PREFIX = '[auth-debug]'

function redactJid(value: string | undefined | null): string {
  if (!value) return 'none'
  return value.slice(0, 8)
}

function redactUser(value: string | undefined | null): string {
  if (!value) return 'none'
  return `${value.slice(0, 1)}***`
}

type EventPayload = Record<string, string | number | boolean | null | undefined>

export function emit(evt: string, payload: EventPayload = {}): void {
  const clean: EventPayload = { evt }
  for (const [k, v] of Object.entries(payload)) {
    if (v !== undefined) clean[k] = v
  }
  try {
    console.warn(PREFIX, JSON.stringify(clean))
  } catch {
    console.warn(PREFIX, evt, 'stringify_failed')
  }
}

export const authDebug = {
  redactJid,
  redactUser,
  emit,
}
