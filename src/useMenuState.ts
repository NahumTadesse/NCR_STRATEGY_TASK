import { useEffect, useState } from 'react'
import { canUndo, recordChange, undoLatest } from './domain/history'
import type { ChangeEntry, UndoResult } from './domain/history'
import { createSeedState } from './domain/seed'
import { loadState, parseStoredText, saveState, STORAGE_KEY } from './domain/storage'
import type { AppState, ItemId, PricePreviewRow, StoreId } from './domain/types'
import {
  applyPriceToStores as applyPriceToStoresIn,
  selectStore as selectStoreIn,
  setAvailability as setAvailabilityIn,
  setPrice as setPriceIn,
} from './domain/updates'

/**
 * Owns app state: loads once from localStorage and saves on every change.
 * All changes go through the pure functions in src/domain/. Saving happens
 * in the event handler, not an effect, so each change is written once.
 * The recent changes list lives in memory for this session only.
 */
export function useMenuState() {
  const [initial] = useState(() => loadState())
  const [state, setState] = useState<AppState>(initial.state)
  const [saveFailed, setSaveFailed] = useState(false)
  const [history, setHistory] = useState<readonly ChangeEntry[]>([])

  function save(next: AppState) {
    setState(next)
    setSaveFailed(!saveState(next))
  }

  /** Save a change and, if it touched an item, add it to recent changes. */
  function commit(next: AppState, record?: { itemId: ItemId; kind: ChangeEntry['kind'] }) {
    if (next === state) return
    if (record) {
      setHistory(recordChange(history, state, next, record.itemId, record.kind, Date.now()))
    }
    save(next)
  }

  // Pick up menu changes saved by another tab, so previews and confirms use
  // current prices. Keep this tab's own selected store.
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key !== STORAGE_KEY || e.newValue === null) return
      const incoming = parseStoredText(e.newValue)
      if (incoming) setState((prev) => ({ ...incoming, selectedStoreId: prev.selectedStoreId }))
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  return {
    state,
    loadStatus: initial.status,
    saveFailed,
    history,
    canUndo: canUndo(history),
    selectStore: (storeId: StoreId) => commit(selectStoreIn(state, storeId)),
    /** Change a price at the selected store only. */
    setPrice: (itemId: ItemId, priceCents: number) =>
      commit(setPriceIn(state, state.selectedStoreId, itemId, priceCents), { itemId, kind: 'price' }),
    /** Mark an item available or not at the selected store only. */
    setAvailability: (itemId: ItemId, available: boolean) =>
      commit(setAvailabilityIn(state, state.selectedStoreId, itemId, available), {
        itemId,
        kind: 'availability',
      }),
    /**
     * Copy the selected store's saved price to the picked stores. Recomputes
     * from current state at confirm time and returns the rows actually applied.
     * The whole batch is one recent-changes entry.
     */
    applyPriceToStores: (itemId: ItemId, targetStoreIds: StoreId[]): PricePreviewRow[] => {
      const result = applyPriceToStoresIn(state, state.selectedStoreId, itemId, targetStoreIds)
      commit(result.state, { itemId, kind: 'apply' })
      return result.rows
    },
    /** Undo the most recent change. Refuses if those stores changed since. */
    undo: (): UndoResult => {
      const result = undoLatest(state, history)
      if (result.ok) {
        setHistory(result.history)
        save(result.state)
      }
      return result
    },
    /** Replace all stores with fresh sample data. Keeps the selected store. */
    resetSampleData: () => {
      setHistory([])
      save({ ...createSeedState(), selectedStoreId: state.selectedStoreId })
    },
  }
}
