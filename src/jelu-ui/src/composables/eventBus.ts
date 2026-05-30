type Handler = () => void

const handlers: Record<string, Set<Handler>> = {}

export function onBusEvent(event: string, handler: Handler): () => void {
  if (!handlers[event]) {
    handlers[event] = new Set()
  }
  handlers[event].add(handler)
  return () => {
    handlers[event]?.delete(handler)
  }
}

export function emitBusEvent(event: string): void {
  handlers[event]?.forEach((h) => {
    try {
      h()
    } catch {
      // ignore handler errors
    }
  })
}

export const BOOK_SAVED = 'book-saved'
