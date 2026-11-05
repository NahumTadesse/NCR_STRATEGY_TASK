import { beforeEach, describe, expect, it } from 'vitest'
import { createSeedState } from './seed'
import { clearState, loadState, parseState, saveState, STORAGE_KEY } from './storage'
import type { KeyValueStorage } from './storage'
import { selectStore, setAvailability, setPrice } from './updates'

/** In-memory stand-in for localStorage. */
function memoryStorage(): KeyValueStorage & { data: Map<string, string> } {
  const data = new Map<string, string>()
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
  }
}

function throwingStorage(): KeyValueStorage {
  const fail = () => {
    throw new Error('blocked')
  }
  return { getItem: fail, setItem: fail, removeItem: fail }
}

let storage: ReturnType<typeof memoryStorage>

beforeEach(() => {
  storage = memoryStorage()
})

describe('loadState', () => {
  it('returns seed data on first visit', () => {
    expect(loadState(storage)).toEqual({ state: createSeedState(), status: 'empty' })
  })

  it('round-trips saved state including edits and selected store', () => {
    let state = createSeedState()
    state = setPrice(state, 'uptown', 'fries', 599)
    state = setAvailability(state, 'uptown', 'lemonade', false)
    state = selectStore(state, 'uptown')

    expect(saveState(state, storage)).toBe(true)
    expect(loadState(storage)).toEqual({ state, status: 'stored' })
  })

  it('writes under the versioned key', () => {
    saveState(createSeedState(), storage)
    expect([...storage.data.keys()]).toEqual([STORAGE_KEY])
    expect(STORAGE_KEY).toMatch(/:v1$/)
  })

  it.each([
    ['not JSON', '{oops'],
    ['JSON null', 'null'],
    ['an array', '[]'],
    ['a different version', JSON.stringify({ ...createSeedState(), version: 2 })],
  ])('falls back to seed on %s', (_label, text) => {
    storage.setItem(STORAGE_KEY, text)
    expect(loadState(storage)).toEqual({ state: createSeedState(), status: 'invalid' })
  })

  it('reports unavailable when storage throws on read', () => {
    expect(loadState(throwingStorage())).toEqual({ state: createSeedState(), status: 'unavailable' })
  })

  it('reports unavailable when there is no storage at all', () => {
    expect(loadState(null).status).toBe('unavailable')
  })

  it('returns a fresh seed each time, not a shared object', () => {
    const a = loadState(storage).state
    const b = loadState(storage).state
    expect(a).not.toBe(b)
    expect(a.byStore.downtown).not.toBe(b.byStore.downtown)
  })
})

describe('parseState', () => {
  const valid = () => JSON.parse(JSON.stringify(createSeedState()))

  it('accepts a valid state', () => {
    expect(parseState(valid())).toEqual(createSeedState())
  })

  it('rejects a missing store', () => {
    const raw = valid()
    delete raw.byStore.westside
    expect(parseState(raw)).toBeNull()
  })

  it('rejects a store missing an item', () => {
    const raw = valid()
    delete raw.byStore.uptown.fries
    expect(parseState(raw)).toBeNull()
  })

  it.each([
    ['a float price', 4.5],
    ['a zero price', 0],
    ['a price over $99.99', 10000],
    ['a string price', '450'],
  ])('rejects %s', (_label, price) => {
    const raw = valid()
    raw.byStore.downtown.fries.priceCents = price
    expect(parseState(raw)).toBeNull()
  })

  it('rejects non-boolean availability', () => {
    const raw = valid()
    raw.byStore.downtown.fries.available = 'yes'
    expect(parseState(raw)).toBeNull()
  })

  it('rejects duplicate item ids', () => {
    const raw = valid()
    raw.items.push({ ...raw.items[0] })
    expect(parseState(raw)).toBeNull()
  })

  it('rejects an empty menu', () => {
    const raw = valid()
    raw.items = []
    expect(parseState(raw)).toBeNull()
  })

  it('keeps prices but resets an unknown selected store to the default', () => {
    const raw = valid()
    raw.selectedStoreId = 'moon-base'
    raw.byStore.uptown.fries.priceCents = 777
    const state = parseState(raw)
    expect(state?.selectedStoreId).toBe('downtown')
    expect(state?.byStore.uptown.fries.priceCents).toBe(777)
  })

  it('drops unknown extra fields', () => {
    const raw = valid()
    raw.extra = 'x'
    raw.byStore.downtown.fries.note = 'x'
    expect(parseState(raw)).toEqual(createSeedState())
  })
})

describe('saveState and clearState', () => {
  it('return false instead of throwing when storage fails', () => {
    expect(saveState(createSeedState(), throwingStorage())).toBe(false)
    expect(clearState(throwingStorage())).toBe(false)
    expect(saveState(createSeedState(), null)).toBe(false)
  })

  it('clearState makes the next load start from seed', () => {
    saveState(setPrice(createSeedState(), 'downtown', 'fries', 599), storage)
    expect(clearState(storage)).toBe(true)
    expect(loadState(storage).status).toBe('empty')
  })
})
