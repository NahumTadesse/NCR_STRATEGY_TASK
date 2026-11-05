import { useState } from 'react'
import './App.css'
import { ApplyToStoresDialog } from './components/ApplyToStoresDialog'
import { MenuTable } from './components/MenuTable'
import { StoreHeader } from './components/StoreHeader'
import { formatCents } from './domain/money'
import { STORES } from './domain/seed'
import type { ItemId, StoreId } from './domain/types'
import { useMenuState } from './useMenuState'

const listFormat = new Intl.ListFormat('en', { type: 'conjunction' })

function App() {
  const menu = useMenuState()
  const { state } = menu
  const store = STORES.find((s) => s.id === state.selectedStoreId) ?? STORES[0]
  const [applyItemId, setApplyItemId] = useState<ItemId | null>(null)
  const [message, setMessage] = useState('')
  const applyItem = state.items.find((i) => i.id === applyItemId)

  function confirmApply(itemId: ItemId, targets: StoreId[]) {
    // Recomputed from current state here, not taken from the dialog's preview.
    const rows = menu.applyPriceToStores(itemId, targets)
    const item = state.items.find((i) => i.id === itemId)
    if (item && rows.length > 0) {
      const names = rows.map((r) => STORES.find((s) => s.id === r.storeId)?.name ?? r.storeId)
      setMessage(
        `${item.name} is now ${formatCents(rows[0].afterCents)} at ${listFormat.format(names)}.`,
      )
    }
    setApplyItemId(null)
  }

  return (
    <>
      <StoreHeader selectedStoreId={store.id} onSelectStore={menu.selectStore} />
      <main className="page" data-store={store.id}>
        {menu.loadStatus === 'invalid' && (
          <p className="notice" role="status">
            Saved menu data could not be read, so sample data was loaded instead.
          </p>
        )}
        {(menu.loadStatus === 'unavailable' || menu.saveFailed) && (
          <p className="notice" role="status">
            This browser is not saving changes. They will be lost when you close the page.
          </p>
        )}
        <p className="page__intro">
          Changes on this page apply to <strong>{store.name}</strong> only.
        </p>
        <p className="page__message" role="status">{message}</p>
        {/* key resets any open edit when the store changes */}
        <MenuTable
          key={store.id}
          store={store}
          items={state.items}
          menu={state.byStore[store.id]}
          onSetPrice={menu.setPrice}
          onSetAvailability={menu.setAvailability}
          onApplyToOthers={(itemId) => {
            setMessage('')
            setApplyItemId(itemId)
          }}
        />
      </main>
      {applyItem && (
        <ApplyToStoresDialog
          state={state}
          sourceStore={store}
          item={applyItem}
          onConfirm={(targets) => confirmApply(applyItem.id, targets)}
          onClose={() => setApplyItemId(null)}
        />
      )}
    </>
  )
}

export default App
