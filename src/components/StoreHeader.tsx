import { STORES } from '../domain/seed'
import { BrandMark } from './BrandMark'
import type { StoreId } from '../domain/types'

interface Props {
  selectedStoreId: StoreId
  onSelectStore: (storeId: StoreId) => void
}

export function StoreHeader({ selectedStoreId, onSelectStore }: Props) {
  const store = STORES.find((s) => s.id === selectedStoreId) ?? STORES[0]

  return (
    <header className="store-header" data-store={store.id}>
      <div className="store-header__inner">
        <p className="store-header__brand">
          <BrandMark />
          <span className="store-header__wordmark">Harbor Street Kitchen</span>
        </p>
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
  )
}
