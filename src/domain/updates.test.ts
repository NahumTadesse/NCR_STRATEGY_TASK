import { beforeEach, describe, expect, it } from 'vitest'
import { createSeedState } from './seed'
import type { AppState } from './types'
import {
  applyPriceToStores,
  getStoreItem,
  previewPriceChange,
  selectStore,
  setAvailability,
  setPrice,
} from './updates'

let state: AppState
let snapshot: string

beforeEach(() => {
  state = createSeedState()
  snapshot = JSON.stringify(state)
})

/** Every test also proves the input state was not mutated. */
function expectInputUnchanged() {
  expect(JSON.stringify(state)).toBe(snapshot)
}

describe('setPrice', () => {
  it('changes the price at the selected store only', () => {
    const next = setPrice(state, 'downtown', 'fries', 599)

    expect(getStoreItem(next, 'downtown', 'fries').priceCents).toBe(599)
    expect(next.byStore.harborfront).toBe(state.byStore.harborfront)
    expect(next.byStore.uptown).toBe(state.byStore.uptown)
    expect(next.byStore.westside).toBe(state.byStore.westside)
    expectInputUnchanged()
  })

  it('leaves availability and other items alone', () => {
    const next = setPrice(state, 'westside', 'chowder', 700)

    expect(getStoreItem(next, 'westside', 'chowder')).toEqual({ priceCents: 700, available: false })
    expect(next.byStore.westside.fries).toBe(state.byStore.westside.fries)
    expectInputUnchanged()
  })

  it('returns the same object when the price is unchanged', () => {
    const current = getStoreItem(state, 'downtown', 'fries').priceCents
    expect(setPrice(state, 'downtown', 'fries', current)).toBe(state)
  })

  it.each([0, -100, 10000, 4.5])('throws on invalid price %d', (cents) => {
    expect(() => setPrice(state, 'downtown', 'fries', cents)).toThrow(RangeError)
    expectInputUnchanged()
  })

  it('throws on an unknown item', () => {
    expect(() => setPrice(state, 'downtown', 'nope', 500)).toThrow(/Unknown item/)
  })
})

describe('setAvailability', () => {
  it('changes availability at the selected store only', () => {
    const next = setAvailability(state, 'uptown', 'lemonade', false)

    expect(getStoreItem(next, 'uptown', 'lemonade').available).toBe(false)
    expect(getStoreItem(next, 'downtown', 'lemonade').available).toBe(true)
    expect(getStoreItem(next, 'harborfront', 'lemonade').available).toBe(true)
    expect(getStoreItem(next, 'westside', 'lemonade').available).toBe(true)
    expectInputUnchanged()
  })

  it('leaves the price alone', () => {
    const before = getStoreItem(state, 'westside', 'chowder').priceCents
    const next = setAvailability(state, 'westside', 'chowder', true)
    expect(getStoreItem(next, 'westside', 'chowder')).toEqual({ priceCents: before, available: true })
  })

  it('returns the same object when nothing changes', () => {
    expect(setAvailability(state, 'downtown', 'fries', true)).toBe(state)
  })
})

describe('selectStore', () => {
  it('changes the selected store without touching menus', () => {
    const next = selectStore(state, 'uptown')
    expect(next.selectedStoreId).toBe('uptown')
    expect(next.byStore).toBe(state.byStore)
    expectInputUnchanged()
  })
})

describe('previewPriceChange', () => {
  beforeEach(() => {
    state = setPrice(state, 'downtown', 'fries', 600)
    snapshot = JSON.stringify(state)
  })

  it('lists only the picked stores with before and after prices', () => {
    const rows = previewPriceChange(state, 'downtown', 'fries', ['uptown', 'westside'])
    expect(rows).toEqual([
      { storeId: 'uptown', beforeCents: 520, afterCents: 600 },
      { storeId: 'westside', beforeCents: 495, afterCents: 600 },
    ])
    expectInputUnchanged()
  })

  it('returns no rows when no stores are picked', () => {
    expect(previewPriceChange(state, 'downtown', 'fries', [])).toEqual([])
  })

  it('ignores the source store and duplicate picks', () => {
    const rows = previewPriceChange(state, 'downtown', 'fries', ['downtown', 'uptown', 'uptown'])
    expect(rows.map((r) => r.storeId)).toEqual(['uptown'])
  })

  it('keeps stores that already match, so the preview can say no change', () => {
    state = setPrice(state, 'uptown', 'fries', 600)
    const rows = previewPriceChange(state, 'downtown', 'fries', ['uptown'])
    expect(rows).toEqual([{ storeId: 'uptown', beforeCents: 600, afterCents: 600 }])
  })
})

describe('applyPriceToStores', () => {
  beforeEach(() => {
    state = setPrice(state, 'downtown', 'fries', 600)
    snapshot = JSON.stringify(state)
  })

  it('changes price at picked stores and nowhere else', () => {
    const { state: next } = applyPriceToStores(state, 'downtown', 'fries', ['westside'])

    expect(getStoreItem(next, 'westside', 'fries').priceCents).toBe(600)
    expect(next.byStore.harborfront).toBe(state.byStore.harborfront)
    expect(next.byStore.uptown).toBe(state.byStore.uptown)
    expect(next.byStore.downtown).toBe(state.byStore.downtown)
    expectInputUnchanged()
  })

  it('never changes availability', () => {
    // chowder is unavailable at westside in the seed data
    const { state: next } = applyPriceToStores(state, 'downtown', 'chowder', ['westside', 'uptown'])
    expect(getStoreItem(next, 'westside', 'chowder').available).toBe(false)
    expect(getStoreItem(next, 'uptown', 'chowder').available).toBe(true)
  })

  it('only changes the chosen item', () => {
    const { state: next } = applyPriceToStores(state, 'downtown', 'fries', ['westside'])
    expect(next.byStore.westside.lemonade).toBe(state.byStore.westside.lemonade)
  })

  it('recomputes from current state, not from an earlier preview', () => {
    const stalePreview = previewPriceChange(state, 'downtown', 'fries', ['uptown'])
    // Someone changes uptown between preview and confirm.
    const changed = setPrice(state, 'uptown', 'fries', 777)

    const { rows } = applyPriceToStores(changed, 'downtown', 'fries', ['uptown'])
    expect(stalePreview[0].beforeCents).toBe(520)
    expect(rows).toEqual([{ storeId: 'uptown', beforeCents: 777, afterCents: 600 }])
  })

  it('returns the same state when no stores are picked', () => {
    const result = applyPriceToStores(state, 'downtown', 'fries', [])
    expect(result.state).toBe(state)
    expect(result.rows).toEqual([])
  })
})
