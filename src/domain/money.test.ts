import { describe, expect, it } from 'vitest'
import {
  centsToInputValue,
  formatCents,
  isValidPriceCents,
  parseDollarsToCents,
} from './money'

describe('parseDollarsToCents', () => {
  it.each([
    ['4.5', 450],
    ['$4.50', 450],
    ['4', 400],
    ['.99', 99],
    ['0.01', 1],
    ['19.99', 1999],
    ['99.99', 9999],
    ['  12.30  ', 1230],
  ])('parses %j as %i cents', (input, cents) => {
    expect(parseDollarsToCents(input)).toEqual({ ok: true, cents })
  })

  it('has no floating point drift on tricky values', () => {
    // 0.29 * 100 === 28.999999999999996 in floating point
    expect(parseDollarsToCents('0.29')).toEqual({ ok: true, cents: 29 })
    expect(parseDollarsToCents('1.15')).toEqual({ ok: true, cents: 115 })
  })

  it.each(['', '   '])('asks for a price when input is %j', (input) => {
    expect(parseDollarsToCents(input)).toEqual({ ok: false, error: 'Enter a price.' })
  })

  it.each(['abc', '-1', '1.234', '$', '.', '1,50', '4.', '1e2', '$ 4.50'])(
    'rejects malformed input %j',
    (input) => {
      expect(parseDollarsToCents(input).ok).toBe(false)
    },
  )

  it.each(['0', '0.00', '$0'])('rejects zero (%j) and points to availability', (input) => {
    const result = parseDollarsToCents(input)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toMatch(/unavailable/)
  })

  it.each(['100', '100.00', '250'])('rejects prices over $99.99 (%j)', (input) => {
    expect(parseDollarsToCents(input)).toEqual({
      ok: false,
      error: 'Price must be $99.99 or less.',
    })
  })
})

describe('isValidPriceCents', () => {
  it('accepts 1 through 9999', () => {
    expect(isValidPriceCents(1)).toBe(true)
    expect(isValidPriceCents(9999)).toBe(true)
  })
  it.each([0, -1, 10000, 4.5, Number.NaN])('rejects %d', (cents) => {
    expect(isValidPriceCents(cents)).toBe(false)
  })
})

describe('formatCents', () => {
  it.each([
    [0, '$0.00'],
    [5, '$0.05'],
    [450, '$4.50'],
    [1999, '$19.99'],
  ])('formats %i as %s', (cents, text) => {
    expect(formatCents(cents)).toBe(text)
  })

  it('throws on non-integer or negative cents', () => {
    expect(() => formatCents(4.5)).toThrow(RangeError)
    expect(() => formatCents(-1)).toThrow(RangeError)
  })

  it('round-trips through the input format', () => {
    expect(parseDollarsToCents(centsToInputValue(1999))).toEqual({ ok: true, cents: 1999 })
  })
})
