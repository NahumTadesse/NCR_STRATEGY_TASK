import './App.css'
import { MenuTable } from './components/MenuTable'
import { StoreHeader } from './components/StoreHeader'
import { STORES } from './domain/seed'
import { useMenuState } from './useMenuState'

function App() {
  const { state, loadStatus, saveFailed, selectStore, setPrice } = useMenuState()
  const store = STORES.find((s) => s.id === state.selectedStoreId) ?? STORES[0]

  return (
    <>
      <StoreHeader selectedStoreId={store.id} onSelectStore={selectStore} />
      <main className="page" data-store={store.id}>
        {loadStatus === 'invalid' && (
          <p className="notice" role="status">
            Saved menu data could not be read, so sample data was loaded instead.
          </p>
        )}
        {(loadStatus === 'unavailable' || saveFailed) && (
          <p className="notice" role="status">
            This browser is not saving changes. They will be lost when you close the page.
          </p>
        )}
        <p className="page__intro">
          Changes on this page apply to <strong>{store.name}</strong> only.
        </p>
        {/* key resets any open edit when the store changes */}
        <MenuTable
          key={store.id}
          store={store}
          items={state.items}
          menu={state.byStore[store.id]}
          onSetPrice={setPrice}
        />
      </main>
    </>
  )
}

export default App
