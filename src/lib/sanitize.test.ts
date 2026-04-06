// @vitest-environment jsdom

import { describe, expect, it } from 'vitest'
import {
  sanitizeCost,
  sanitizeMileage,
  sanitizeNote,
  sanitizePlate,
  sanitizeText,
} from '@/lib/sanitize'

describe('sanitize helpers', () => {
  it('removes markup from plain text input', () => {
    expect(sanitizeText('  <script>alert(1)</script>Hello <b>world</b>  ')).toBe('Hello world')
  })

  it('limits sanitized text to 500 characters', () => {
    expect(sanitizeText('a'.repeat(600))).toHaveLength(500)
  })

  it('removes markup and caps note length', () => {
    const sanitized = sanitizeNote(`<img src=x onerror=alert(1)>${'b'.repeat(2100)}`)
    expect(sanitized).not.toContain('<img')
    expect(sanitized).toHaveLength(2000)
  })

  it('normalizes registration plates', () => {
    expect(sanitizePlate('  kaa-123a!!  ')).toBe('KAA123A')
  })

  it('floors and clamps mileage values', () => {
    expect(sanitizeMileage(1234.9)).toBe(1234)
    expect(sanitizeMileage(-2)).toBe(0)
    expect(sanitizeMileage(99999999)).toBe(9999999)
  })

  it('rounds and clamps cost values', () => {
    expect(sanitizeCost(123.456)).toBe(123.46)
    expect(sanitizeCost(-10)).toBe(0)
    expect(sanitizeCost(10000001)).toBe(10000000)
  })
})