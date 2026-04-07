import DOMPurify from 'dompurify'

export function sanitizeInput(value: string): string {
  if (!value) return ''

  return DOMPurify.sanitize(value, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  }).trim()
}

export function sanitizeText(input: string): string {
  return sanitizeInput(input).slice(0, 500)
}

export function sanitizeNote(input: string): string {
  return sanitizeInput(input).slice(0, 2000)
}

export function sanitizePlate(input: string): string {
  return input.replace(/[^A-Z0-9\s]/gi, '').toUpperCase().trim().slice(0, 10)
}

export function sanitizeVin(input: string): string {
  return input.replace(/[^A-HJ-NPR-Z0-9]/gi, '').toUpperCase().trim().slice(0, 17)
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