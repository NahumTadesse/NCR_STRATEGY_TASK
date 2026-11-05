import { beforeEach, describe, expect, it } from 'vitest'
import { addEntry, canUndo, diffItem, HISTORY_LIMIT, undoLatest } from './history'
import type { ChangeEntry } from './history'
import { createSeedState } from './seed'
import type { AppState } from './types'
import { applyPriceToStores, getStoreItem, setAvailability, setPrice } from './updates'

let base: AppState
let nextId = 1

function entryFor(prev: AppState, next: AppState, itemId: string, kind: ChangeEntry['kind']): ChangeEntry {
  return { id: nextId++, at: 0, itemId, kind, changes: diffItem(prev, next, itemId), undone: false }
}

beforeEach(() => {
  base = createSeedState()
})

describe('diffItem', () => {
  it('finds the one store a price edit touched', () => {
    const next = setPrice(base, 'uptown', 'fries', 600)
    expect(diffItem(base, next, 'fries')).toEqual([
      {
        storeId: 'uptown',
        before: { priceCents: 520, available: true },
        after: { priceCents: 600, available: true },
      },
    ])
  })

  it('finds every store an apply touched', () => {
    const edited = setPrice(base, 'downtown', 'fries', 600)
    const { state: next } = applyPriceToStores(edited, 'downtown', 'fries', ['uptown', 'westside'])
    expect(diffItem(edited, next, 'fries').map((c) => c.storeId)).toEqual(['uptown', 'westside'])
  })

  it('returns nothing when nothing changed', () => {
    expect(diffItem(base, base, 'fries')).toEqual([])
  })
})

describe('addEntry and canUndo', () => {
  it('keeps newest first and caps the list', () => {
    let history: ChangeEntry[] = []
    for (let i = 0; i < HISTORY_LIMIT + 5; i++) {
      history = addEntry(history, { id: i, at: 0, itemId: 'fries', kind: 'price', changes: [], undone: false })
    }
    expect(history).toHaveLength(HISTORY_LIMIT)
    expect(history[0].id).toBe(HISTORY_LIMIT + 4)
  })

  it('allows undo only when the newest entry is not undone', () => {
    expect(canUndo([])).toBe(false)
    const e = { id: 1, at: 0, itemId: 'fries', kind: 'price' as const, changes: [], undone: false }
    expect(canUndo([e])).toBe(true)
    expect(canUndo([{ ...e, undone: true }, e])).toBe(false)
  })
})

describe('undoLatest', () => {
  it('reverts a single-store price edit', () => {
    const next = setPrice(base, 'uptown', 'fries', 600)
    const result = undoLatest(next, [entryFor(base, next, 'fries', 'price')])
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.state.byStore).toEqual(base.byStore)
      expect(result.history[0].undone).toBe(true)
    }
  })

  it('reverts an availability toggle', () => {
    const next = setAvailability(base, 'westside', 'chowder', true)
    const result = undoLatest(next, [entryFor(base, next, 'chowder', 'availability')])
    expect(result.ok && getStoreItem(result.state, 'westside', 'chowder').available).toBe(false)
  })

  it('reverts every store in an apply batch at once', () => {
    const edited = setPrice(base, 'downtown', 'fries', 600)
    const { state: next } = applyPriceToStores(edited, 'downtown', 'fries', ['harborfront', 'uptown', 'westside'])
    const history = [entryFor(edited, next, 'fries', 'apply'), entryFor(base, edited, 'fries', 'price')]

    const result = undoLatest(next, history)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.state.byStore).toEqual(edited.byStore)
      // Downtown's own edit is a separate, older entry and stays.
      expect(getStoreItem(result.state, 'downtown', 'fries').priceCents).toBe(600)
    }
  })

  it('only undoes once: the older entry is not undoable afterwards', () => {
    const a = setPrice(base, 'uptown', 'fries', 600)
    const b = setPrice(a, 'uptown', 'lemonade', 500)
    const history = [entryFor(a, b, 'lemonade', 'price'), entryFor(base, a, 'fries', 'price')]
    const first = undoLatest(b, history)
    expect(first.ok).toBe(true)
    if (first.ok) expect(undoLatest(first.state, first.history)).toEqual({ ok: false, reason: 'nothing-to-undo' })
  })

  it('refuses if a store changed since, and leaves state alone', () => {
    const next = setPrice(base, 'uptown', 'fries', 600)
    const history = [entryFor(base, next, 'fries', 'price')]
    const otherTab = setPrice(next, 'uptown', 'fries', 650)
    expect(undoLatest(otherTab, history)).toEqual({ ok: false, reason: 'changed-since' })
  })

  it('does not mutate its inputs', () => {
    const next = setPrice(base, 'uptown', 'fries', 600)
    const history = [entryFor(base, next, 'fries', 'price')]
    const snapshot = JSON.stringify({ next, history })
    undoLatest(next, history)
    expect(JSON.stringify({ next, history })).toBe(snapshot)
  })
})
