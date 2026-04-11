const isTTY = process.stderr.isTTY ?? false

function colorize(code: number, text: string): string {
  return isTTY ? `\x1b[${code}m${text}\x1b[0m` : text
}

export function info(message: string): void {
  process.stderr.write(`${colorize(36, message)}\n`)
}

export function warn(message: string): void {
  process.stderr.write(`${colorize(33, message)}\n`)
}

export function error(message: string): void {
  process.stderr.write(`${colorize(31, message)}\n`)
}

export function debug(message: string): void {
  if (process.env.DEBUG) {
    process.stderr.write(`${colorize(90, message)}\n`)
  }
}
