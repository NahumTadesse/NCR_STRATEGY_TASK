import { isValidPriceCents } from './money'
import { createSeedState, DEFAULT_STORE_ID } from './seed'
import { STORE_IDS } from './types'
import type { AppState, MenuItem, StoreId, StoreMenu } from './types'

/**
 * The only module that touches localStorage. The key carries the schema
 * version; if the shape ever changes, bump both so old data is ignored
 * instead of being misread.
 */
export const STORAGE_KEY = 'harbor-street-kitchen:menu:v1'

/** The subset of the Web Storage API we use. Injectable for tests. */
export type KeyValueStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

/**
 * Why the seed was used, so the UI can tell the user if saved data was reset.
 * - stored: saved data loaded fine
 * - empty: nothing saved yet (first visit)
 * - invalid: saved data was corrupt or an unknown version
 * - unavailable: localStorage could not be read (blocked, private mode)
 */
export type LoadStatus = 'stored' | 'empty' | 'invalid' | 'unavailable'

export interface LoadResult {
  state: AppState
  status: LoadStatus
}

function defaultStorage(): KeyValueStorage | null {
  try {
    return globalThis.localStorage ?? null
  } catch {
    // Some browsers throw on access when storage is blocked.
    return null
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isStoreId(value: unknown): value is StoreId {
  return typeof value === 'string' && (STORE_IDS as readonly string[]).includes(value)
}

function isMenuItem(value: unknown): value is MenuItem {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    value.id !== '' &&
    typeof value.name === 'string' &&
    typeof value.category === 'string'
  )
}

function isStoreMenu(value: unknown, itemIds: readonly string[]): value is StoreMenu {
  if (!isRecord(value)) return false
  // Every store carries every item.
  return itemIds.every((id) => {
    const entry = value[id]
    return (
      isRecord(entry) &&
      typeof entry.priceCents === 'number' &&
      isValidPriceCents(entry.priceCents) &&
      typeof entry.available === 'boolean'
    )
  })
}

/**
 * Validate unknown parsed JSON into an AppState, or return null.
 * Copies only known fields, so stray keys in storage are dropped.
 */
export function parseState(raw: unknown): AppState | null {
  if (!isRecord(raw) || raw.version !== 1) return null

  const { items, byStore } = raw
  if (!Array.isArray(items) || items.length === 0 || !items.every(isMenuItem)) return null
  const itemIds = items.map((item) => item.id)
  if (new Set(itemIds).size !== itemIds.length) return null

  if (!isRecord(byStore)) return null
  const menus = {} as Record<StoreId, StoreMenu>
  for (const storeId of STORE_IDS) {
    const menu = byStore[storeId]
    if (!isStoreMenu(menu, itemIds)) return null
    menus[storeId] = Object.fromEntries(
      itemIds.map((id) => [id, { priceCents: menu[id].priceCents, available: menu[id].available }]),
    )
  }

  return {
    version: 1,
    // A bad selected store alone is not worth discarding prices over.
    selectedStoreId: isStoreId(raw.selectedStoreId) ? raw.selectedStoreId : DEFAULT_STORE_ID,
    items: items.map(({ id, name, category }) => ({ id, name, category })),
    byStore: menus,
  }
}

/** Load saved state. Never throws; falls back to fresh seed data. */
export function loadState(storage: KeyValueStorage | null = defaultStorage()): LoadResult {
  if (!storage) return { state: createSeedState(), status: 'unavailable' }

  let text: string | null
  try {
    text = storage.getItem(STORAGE_KEY)
  } catch {
    return { state: createSeedState(), status: 'unavailable' }
  }
  if (text === null) return { state: createSeedState(), status: 'empty' }

  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return { state: createSeedState(), status: 'invalid' }
  }

  const state = parseState(raw)
  return state ? { state, status: 'stored' } : { state: createSeedState(), status: 'invalid' }
}

/** Save state. Returns false if storage is unavailable or full; never throws. */
export function saveState(
  state: AppState,
  storage: KeyValueStorage | null = defaultStorage(),
): boolean {
  if (!storage) return false
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state))
    return true
  } catch {
    return false
  }
}

/** Remove saved data so the next load starts from the seed. Never throws. */
export function clearState(storage: KeyValueStorage | null = defaultStorage()): boolean {
  if (!storage) return false
  try {
    storage.removeItem(STORAGE_KEY)
    return true
  } catch {
    return false
  }
}
