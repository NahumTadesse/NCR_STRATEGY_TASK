import { STORES } from '../domain/seed'
import type { StoreId } from '../domain/types'
import { BrandMark } from './BrandMark'

interface Props {
  selectedStoreId: StoreId
  onSelectStore: (storeId: StoreId) => void
}

/**
 * A navy brand strip that scrolls away, then the store band in the store's
 * color, which stays pinned so the current store is always visible.
 */
export function StoreHeader({ selectedStoreId, onSelectStore }: Props) {
  const store = STORES.find((s) => s.id === selectedStoreId) ?? STORES[0]

  return (
    <>
      <div className="brand-bar">
        <p className="brand-bar__inner">
          <BrandMark size={28} />
          <span className="brand-bar__wordmark">Harbor Street Kitchen</span>
        </p>
      </div>
      <header className="store-header" data-store={store.id}>
        <div className="store-header__inner">
          <p className="store-header__current" aria-live="polite">
            <span className="store-header__label">Editing store</span>
            <span className="store-header__name">{store.name}</span>
          </p>
          <label className="store-header__picker">
            <span>Switch store</span>
            <select
              value={selectedStoreId}
              onChange={(e) => onSelectStore(e.target.value as StoreId)}
            >
              {STORES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>
    </>
  )
}
