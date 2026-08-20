/**
 * A tiny event log for the demo screens: it shows what the SDK did and in which order.
 * Not part of the SDK integration.
 */

export type LogEntry = {
  id: number
  time: string
  title: string
  details?: string
}

type Listener = (entries: LogEntry[]) => void

const MAX_ENTRIES = 100

let entries: LogEntry[] = []
let nextId = 1
const listeners = new Set<Listener>()

function notify() {
  listeners.forEach(listener => listener(entries))
}

export function logEvent(title: string, details?: unknown) {
  const entry: LogEntry = {
    id: nextId++,
    time: new Date().toLocaleTimeString(),
    title,
    details:
      details === undefined
        ? undefined
        : typeof details === 'string'
          ? details
          : JSON.stringify(details, null, 2),
  }

  entries = [entry, ...entries].slice(0, MAX_ENTRIES)
  notify()
  console.log(`[DEMO] ${title}`, details ?? '')
}

export function clearLog() {
  entries = []
  notify()
}

export function getLog(): LogEntry[] {
  return entries
}

export function subscribeToLog(listener: Listener): () => void {
  listeners.add(listener)
  listener(entries)
  return () => {
    listeners.delete(listener)
  }
}
