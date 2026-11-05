import { useState } from 'react'
import { loadState, saveState } from './domain/storage'
import type { AppState, ItemId, StoreId } from './domain/types'
import { selectStore as selectStoreIn, setPrice as setPriceIn } from './domain/updates'

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

  return {
    state,
    loadStatus: initial.status,
    saveFailed,
    selectStore: (storeId: StoreId) => commit(selectStoreIn(state, storeId)),
    /** Change a price at the selected store only. */
    setPrice: (itemId: ItemId, priceCents: number) =>
      commit(setPriceIn(state, state.selectedStoreId, itemId, priceCents)),
  }
}
