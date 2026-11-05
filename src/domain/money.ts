/** Valid menu price range in cents: $0.01 to $99.99. */
export const MIN_PRICE_CENTS = 1
export const MAX_PRICE_CENTS = 9999

export type ParsePriceResult =
  | { ok: true; cents: number }
  | { ok: false; error: string }

// Optional "$" (spaces after it are fine), whole dollars, then an optional dot
// with up to 2 decimal places. ".5" and "4." are allowed.
const PRICE_PATTERN = /^\$?\s*(\d*)(?:\.(\d{0,2}))?$/

/**
 * Parse user input like "4.5", "$4.50", "$ 4.50", "4." or ".99" into integer cents.
 * Uses string math only, so there is no floating point drift.
 */
export function parseDollarsToCents(input: string): ParsePriceResult {
  const trimmed = input.trim()
  if (trimmed === '') {
    return { ok: false, error: 'Enter a price.' }
  }

  const match = PRICE_PATTERN.exec(trimmed)
  if (!match || (match[1] === '' && !match[2])) {
    return { ok: false, error: 'Enter a price like 4.50.' }
  }

  const dollars = match[1] === '' ? 0 : Number(match[1])
  const fraction = (match[2] ?? '').padEnd(2, '0')
  const cents = dollars * 100 + Number(fraction)

  if (cents < MIN_PRICE_CENTS) {
    return { ok: false, error: 'Price must be at least $0.01. To stop selling an item, mark it unavailable.' }
  }
  if (cents > MAX_PRICE_CENTS) {
    return { ok: false, error: 'Price must be $99.99 or less.' }
  }
  return { ok: true, cents }
}

export function isValidPriceCents(cents: number): boolean {
  return Number.isInteger(cents) && cents >= MIN_PRICE_CENTS && cents <= MAX_PRICE_CENTS
}

/** Format integer cents as "$4.50". */
export function formatCents(cents: number): string {
  if (!Number.isInteger(cents) || cents < 0) {
    throw new RangeError(`formatCents expects a non-negative integer, got ${cents}`)
  }
  const dollars = Math.floor(cents / 100)
  const rest = String(cents % 100).padStart(2, '0')
  return `$${dollars}.${rest}`
}

/** Format cents for an input field, without the "$": "4.50". */
export function centsToInputValue(cents: number): string {
  return formatCents(cents).slice(1)
}
