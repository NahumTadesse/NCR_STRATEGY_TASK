import { isValidPriceCents } from './money'
import type { AppState, ItemId, PricePreviewRow, StoreId, StoreItemState } from './types'

/**
 * Pure, immutable state updates. Every function returns a new AppState and
 * never mutates its input. If nothing would change, the original object is
 * returned so callers can cheaply detect a no-op with ===.
 *
 * Invalid input (unknown store or item, bad price) throws. The UI is expected
 * to validate first, so a throw here means a programming error.
 */

function getEntry(state: AppState, storeId: StoreId, itemId: ItemId): StoreItemState {
  const menu = state.byStore[storeId]
  if (!menu) throw new Error(`Unknown store: ${storeId}`)
  const entry = menu[itemId]
  if (!entry) throw new Error(`Unknown item "${itemId}" at store ${storeId}`)
  return entry
}

function assertValidPrice(cents: number): void {
  if (!isValidPriceCents(cents)) {
    throw new RangeError(`Invalid price in cents: ${cents}`)
  }
}

function withEntry(
  state: AppState,
  storeId: StoreId,
  itemId: ItemId,
  next: StoreItemState,
): AppState {
  return {
    ...state,
    byStore: {
      ...state.byStore,
      [storeId]: { ...state.byStore[storeId], [itemId]: next },
    },
  }
}

export function getStoreItem(state: AppState, storeId: StoreId, itemId: ItemId): StoreItemState {
  return getEntry(state, storeId, itemId)
}

export function selectStore(state: AppState, storeId: StoreId): AppState {
  if (!state.byStore[storeId]) throw new Error(`Unknown store: ${storeId}`)
  if (state.selectedStoreId === storeId) return state
  return { ...state, selectedStoreId: storeId }
}

/** Change one item's price at one store only. */
export function setPrice(
  state: AppState,
  storeId: StoreId,
  itemId: ItemId,
  priceCents: number,
): AppState {
  assertValidPrice(priceCents)
  const entry = getEntry(state, storeId, itemId)
  if (entry.priceCents === priceCents) return state
  return withEntry(state, storeId, itemId, { ...entry, priceCents })
}

/** Mark one item available or unavailable at one store only. */
export function setAvailability(
  state: AppState,
  storeId: StoreId,
  itemId: ItemId,
  available: boolean,
): AppState {
  const entry = getEntry(state, storeId, itemId)
  if (entry.available === available) return state
  return withEntry(state, storeId, itemId, { ...entry, available })
}

/** Unique target stores in input order, excluding the source store. */
function normalizeTargets(sourceStoreId: StoreId, targetStoreIds: readonly StoreId[]): StoreId[] {
  return [...new Set(targetStoreIds)].filter((id) => id !== sourceStoreId)
}

/**
 * Before/after rows for copying the source store's saved price to the
 * picked stores. Only stores the user picked appear. Rows where the price
 * already matches are included (beforeCents === afterCents) so the preview
 * can say "no change" instead of silently hiding a store.
 */
export function previewPriceChange(
  state: AppState,
  sourceStoreId: StoreId,
  itemId: ItemId,
  targetStoreIds: readonly StoreId[],
): PricePreviewRow[] {
  const afterCents = getEntry(state, sourceStoreId, itemId).priceCents
  return normalizeTargets(sourceStoreId, targetStoreIds).map((storeId) => ({
    storeId,
    beforeCents: getEntry(state, storeId, itemId).priceCents,
    afterCents,
  }))
}

/**
 * Copy the source store's saved price to the picked stores. Price only;
 * availability is never touched. The preview is recomputed from `state`
 * here, so a stale preview shown earlier cannot leak into the result.
 */
export function applyPriceToStores(
  state: AppState,
  sourceStoreId: StoreId,
  itemId: ItemId,
  targetStoreIds: readonly StoreId[],
): { state: AppState; rows: PricePreviewRow[] } {
  const rows = previewPriceChange(state, sourceStoreId, itemId, targetStoreIds)
  let next = state
  for (const row of rows) {
    next = setPrice(next, row.storeId, itemId, row.afterCents)
  }
  return { state: next, rows }
}
