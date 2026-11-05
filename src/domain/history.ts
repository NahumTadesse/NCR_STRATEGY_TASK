import { STORE_IDS } from './types'
import type { AppState, ItemId, StoreId, StoreItemState } from './types'

/** One store's entry for one item, before and after a change. */
export interface StoreChange {
  storeId: StoreId
  before: StoreItemState
  after: StoreItemState
}

/**
 * One user action. A price edit or availability toggle touches one store;
 * an "Apply to other stores" confirm touches several and is still one entry.
 */
export interface ChangeEntry {
  id: number
  at: number // epoch ms
  itemId: ItemId
  kind: 'price' | 'availability' | 'apply'
  changes: StoreChange[]
  undone: boolean
}

export const HISTORY_LIMIT = 20

function sameEntry(a: StoreItemState, b: StoreItemState): boolean {
  return a.priceCents === b.priceCents && a.available === b.available
}

/** Stores where this item differs between two states, in store order. */
export function diffItem(prev: AppState, next: AppState, itemId: ItemId): StoreChange[] {
  const changes: StoreChange[] = []
  for (const storeId of STORE_IDS) {
    const before = prev.byStore[storeId][itemId]
    const after = next.byStore[storeId][itemId]
    if (!sameEntry(before, after)) changes.push({ storeId, before, after })
  }
  return changes
}

/** Newest first, capped at HISTORY_LIMIT. */
export function addEntry(history: readonly ChangeEntry[], entry: ChangeEntry): ChangeEntry[] {
  return [entry, ...history].slice(0, HISTORY_LIMIT)
}

/**
 * Record one user action. Compares the item across all stores before and
 * after, so an apply batch becomes one entry with several stores. Returns
 * the same history array when nothing changed (no empty entries).
 */
export function recordChange(
  history: readonly ChangeEntry[],
  prev: AppState,
  next: AppState,
  itemId: ItemId,
  kind: ChangeEntry['kind'],
  at: number,
): readonly ChangeEntry[] {
  const changes = diffItem(prev, next, itemId)
  if (changes.length === 0) return history
  const id = (history[0]?.id ?? 0) + 1
  return addEntry(history, { id, at, itemId, kind, changes, undone: false })
}

/** Only the newest entry can be undone, and only once. */
export function canUndo(history: readonly ChangeEntry[]): boolean {
  return history.length > 0 && !history[0].undone
}

export type UndoResult =
  | { ok: true; state: AppState; history: ChangeEntry[] }
  | { ok: false; reason: 'nothing-to-undo' | 'changed-since' }

/**
 * Undo the newest entry: put every store in it back to its "before" value.
 * Refuses if any of those stores no longer matches its "after" value (for
 * example, another tab changed it), so undo never overwrites newer work.
 */
export function undoLatest(state: AppState, history: readonly ChangeEntry[]): UndoResult {
  if (!canUndo(history)) return { ok: false, reason: 'nothing-to-undo' }
  const [latest, ...rest] = history

  const stillCurrent = latest.changes.every((c) =>
    sameEntry(state.byStore[c.storeId][latest.itemId], c.after),
  )
  if (!stillCurrent) return { ok: false, reason: 'changed-since' }

  const byStore = { ...state.byStore }
  for (const c of latest.changes) {
    byStore[c.storeId] = { ...byStore[c.storeId], [latest.itemId]: { ...c.before } }
  }
  return {
    ok: true,
    state: { ...state, byStore },
    history: [{ ...latest, undone: true }, ...rest],
  }
}
