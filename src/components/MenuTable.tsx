import { groupByCategory } from '../domain/menu'
import type { ItemId, MenuItem, Store, StoreMenu } from '../domain/types'
import { PriceEditor } from './PriceEditor'

interface Props {
  store: Store
  items: readonly MenuItem[]
  menu: StoreMenu
  onSetPrice: (itemId: ItemId, priceCents: number) => void
}

export function MenuTable({ store, items, menu, onSetPrice }: Props) {
  return (
    <table className="menu-table">
      <caption>Menu at {store.name}</caption>
      <thead>
        <tr>
          <th scope="col">Item</th>
          <th scope="col" className="num">Price</th>
          <th scope="col">Status</th>
        </tr>
      </thead>
      {groupByCategory(items).map((group) => (
        <tbody key={group.category}>
          <tr className="menu-table__category">
            <th scope="colgroup" colSpan={3}>{group.category}</th>
          </tr>
          {group.items.map((item) => {
            const entry = menu[item.id]
            return (
              <tr key={item.id} className={entry.available ? '' : 'is-unavailable'}>
                <th scope="row">{item.name}</th>
                <td className="num">
                  <PriceEditor
                    itemName={item.name}
                    storeName={store.name}
                    priceCents={entry.priceCents}
                    onSave={(cents) => onSetPrice(item.id, cents)}
                  />
                </td>
                <td>
                  <span className={entry.available ? 'badge badge--on' : 'badge badge--off'}>
                    {entry.available ? 'Available' : 'Unavailable'}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      ))}
    </table>
  )
}
