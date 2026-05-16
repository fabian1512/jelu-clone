import DOMPurify from 'dompurify'

export function sanitizeHtml(value: string | null | undefined): string {
  if (!value) {
    return ''
  }
  return DOMPurify.sanitize(value)
}
