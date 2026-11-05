import { groupByCategory } from '../domain/menu'
import { useState } from 'react'
import type { ItemId, MenuItem, Store, StoreItemState, StoreMenu } from '../domain/types'
import { AvailabilityToggle } from './AvailabilityToggle'
import { CategoryIcon } from './CategoryIcon'
import { PriceEditor } from './PriceEditor'

interface Props {
  store: Store
  items: readonly MenuItem[]
  menu: StoreMenu
  onSetPrice: (itemId: ItemId, priceCents: number) => void
  onSetAvailability: (itemId: ItemId, available: boolean) => void
  onApplyToOthers: (itemId: ItemId) => void
}

export function MenuTable({ store, items, menu, onSetPrice, onSetAvailability, onApplyToOthers }: Props) {
  return (
    <div className="table-wrap">
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
              <th scope="colgroup" colSpan={3}>
                <span className="menu-table__category-label">
                  <CategoryIcon category={group.category} />
                  {group.category}
                  <span className="wave-rule" aria-hidden="true" />
                </span>
              </th>
            </tr>
            {group.items.map((item) => (
              <MenuRow
                key={item.id}
                item={item}
                entry={menu[item.id]}
                storeName={store.name}
                onSetPrice={onSetPrice}
                onSetAvailability={onSetAvailability}
                onApplyToOthers={onApplyToOthers}
              />
            ))}
          </tbody>
        ))}
      </table>
    </div>
  )
}

interface RowProps {
  item: MenuItem
  entry: StoreItemState
  storeName: string
  onSetPrice: Props['onSetPrice']
  onSetAvailability: Props['onSetAvailability']
  onApplyToOthers: Props['onApplyToOthers']
}

/**
 * One menu row. When its price or availability changes, the row gets a brief
 * highlight. Alternating two animation classes restarts the CSS animation
 * without remounting the row, so keyboard focus stays where it is.
 */
function MenuRow({ item, entry, storeName, onSetPrice, onSetAvailability, onApplyToOthers }: RowProps) {
  const signature = `${entry.priceCents}:${entry.available}`
  const [seen, setSeen] = useState(signature)
  const [flashes, setFlashes] = useState(0)
  if (seen !== signature) {
    // Adjusting state during render is React's recommended pattern for this.
    setSeen(signature)
    setFlashes((n) => n + 1)
  }

  const classes = [
    entry.available ? '' : 'is-unavailable',
    flashes === 0 ? '' : flashes % 2 ? 'is-changed-a' : 'is-changed-b',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <tr className={classes || undefined}>
      <th scope="row">{item.name}</th>
      <td className="num">
        <PriceEditor
          itemName={item.name}
          storeName={storeName}
          priceCents={entry.priceCents}
          onSave={(cents) => onSetPrice(item.id, cents)}
          onApplyToOthers={() => onApplyToOthers(item.id)}
        />
      </td>
      <td>
        <AvailabilityToggle
          itemName={item.name}
          storeName={storeName}
          available={entry.available}
          onChange={(available) => onSetAvailability(item.id, available)}
        />
      </td>
    </tr>
  )
}
