import { groupByCategory } from '../domain/menu'
import { formatCents } from '../domain/money'
import type { MenuItem, Store, StoreMenu } from '../domain/types'

interface Props {
  store: Store
  items: readonly MenuItem[]
  menu: StoreMenu
}

export function MenuTable({ store, items, menu }: Props) {
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
                <td className="num">{formatCents(entry.priceCents)}</td>
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
