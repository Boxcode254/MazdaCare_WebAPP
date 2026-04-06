import DOMPurify from 'dompurify'

export function sanitizeText(input: string): string {
  if (!input) return ''
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })
    .trim()
    .slice(0, 500)
}

export function sanitizeNote(input: string): string {
  if (!input) return ''
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })
    .trim()
    .slice(0, 2000)
}

export function sanitizePlate(input: string): string {
  return input.replace(/[^A-Z0-9\s]/gi, '').toUpperCase().trim().slice(0, 10)
}

export function sanitizeMileage(input: number): number {
  const numericValue = Math.floor(Number(input))
  if (isNaN(numericValue) || numericValue < 0) return 0
  if (numericValue > 9999999) return 9999999
  return numericValue
}

export function sanitizeCost(input: number): number {
  const numericValue = Math.round(Number(input) * 100) / 100
  if (isNaN(numericValue) || numericValue < 0) return 0
  if (numericValue > 10000000) return 10000000
  return numericValue
}