import { useState } from 'react'
import './App.css'
import { ApplyToStoresDialog } from './components/ApplyToStoresDialog'
import { MenuTable } from './components/MenuTable'
import { RecentChanges } from './components/RecentChanges'
import { ResetSampleData } from './components/ResetSampleData'
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
  const [message, setMessage] = useState<{ text: string; tone: 'ok' | 'warn' } | null>(null)
  const applyItem = state.items.find((i) => i.id === applyItemId)

  function confirmApply(itemId: ItemId, targets: StoreId[]) {
    // Recomputed from current state here, not taken from the dialog's preview.
    const rows = menu.applyPriceToStores(itemId, targets)
    const item = state.items.find((i) => i.id === itemId)
    if (item && rows.length > 0) {
      const names = rows.map((r) => STORES.find((s) => s.id === r.storeId)?.name ?? r.storeId)
      setMessage({
        text: `${item.name} is now ${formatCents(rows[0].afterCents)} at ${listFormat.format(names)}.`,
        tone: 'ok',
      })
    }
    setApplyItemId(null)
  }

  function undo(): boolean {
    const latest = menu.history[0]
    const name = state.items.find((i) => i.id === latest?.itemId)?.name ?? 'The item'
    const stores = listFormat.format(
      (latest?.changes ?? []).map((c) => STORES.find((s) => s.id === c.storeId)?.name ?? c.storeId),
    )
    const result = menu.undo()
    setMessage(
      result.ok
        ? { text: `Undid the last change to ${name} at ${stores}.`, tone: 'ok' }
        : {
            text: `Could not undo. ${name} at ${stores} was changed again since then, possibly in another tab.`,
            tone: 'warn',
          },
    )
    return result.ok
  }

  function resetSampleData() {
    menu.resetSampleData()
    setMessage({ text: `Sample data restored at all ${STORES.length} stores.`, tone: 'ok' })
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
        <p className={message?.tone === 'warn' ? 'notice' : 'page__message'} role="status">
          {message?.text}
        </p>
        {/* key resets any open edit when the store changes */}
        <MenuTable
          key={store.id}
          store={store}
          items={state.items}
          menu={state.byStore[store.id]}
          onSetPrice={menu.setPrice}
          onSetAvailability={menu.setAvailability}
          onApplyToOthers={(itemId) => {
            setMessage(null)
            setApplyItemId(itemId)
          }}
        />
        <RecentChanges
          history={menu.history}
          items={state.items}
          canUndo={menu.canUndo}
          onUndo={undo}
        />
        <ResetSampleData storeCount={STORES.length} onReset={resetSampleData} />
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
