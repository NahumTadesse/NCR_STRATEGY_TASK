import { useEffect, useState } from 'react'
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
 * All changes go through the pure functions in src/domain/updates.ts.
 * Saving happens in the event handler, not an effect, so each change is
 * written exactly once.
 */
export function useMenuState() {
  const [initial] = useState(() => loadState())
  const [state, setState] = useState<AppState>(initial.state)
  const [saveFailed, setSaveFailed] = useState(false)

  function commit(next: AppState) {
    if (next === state) return
    setState(next)
    setSaveFailed(!saveState(next))
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
    selectStore: (storeId: StoreId) => commit(selectStoreIn(state, storeId)),
    /** Change a price at the selected store only. */
    setPrice: (itemId: ItemId, priceCents: number) =>
      commit(setPriceIn(state, state.selectedStoreId, itemId, priceCents)),
    /** Mark an item available or not at the selected store only. */
    setAvailability: (itemId: ItemId, available: boolean) =>
      commit(setAvailabilityIn(state, state.selectedStoreId, itemId, available)),
    /**
     * Copy the selected store's saved price to the picked stores. Recomputes
     * from current state at confirm time and returns the rows actually applied.
     */
    applyPriceToStores: (itemId: ItemId, targetStoreIds: StoreId[]): PricePreviewRow[] => {
      const result = applyPriceToStoresIn(state, state.selectedStoreId, itemId, targetStoreIds)
      commit(result.state)
      return result.rows
    },
  }
}
