import type { ChangeEntry } from '../domain/history'
import { formatCents } from '../domain/money'
import { STORES } from '../domain/seed'
import type { MenuItem, StoreItemState } from '../domain/types'

interface Props {
  history: readonly ChangeEntry[]
  items: readonly MenuItem[]
  canUndo: boolean
  onUndo: () => void
}

const timeFormat = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' })

const KIND_LABEL: Record<ChangeEntry['kind'], string> = {
  price: 'Price',
  availability: 'Availability',
  apply: 'Price, applied to other stores',
}

function describe(entry: ChangeEntry, value: StoreItemState): string {
  if (entry.kind === 'availability') return value.available ? 'Available' : 'Unavailable'
  return formatCents(value.priceCents)
}

function storeName(id: string): string {
  return STORES.find((s) => s.id === id)?.name ?? id
}

/** Changes made in this session, newest first. Only the newest can be undone. */
export function RecentChanges({ history, items, canUndo, onUndo }: Props) {
  const itemName = (id: string) => items.find((i) => i.id === id)?.name ?? id

  return (
    <section className="panel" aria-labelledby="recent-changes-title">
      <h2 id="recent-changes-title" className="panel__title">Recent changes</h2>
      {history.length === 0 ? (
        <p className="panel__empty">
          No changes yet in this session. Price and availability changes will show here.
        </p>
      ) : (
        <div className="table-scroll">
          <table className="history-table">
            <thead>
              <tr>
                <th scope="col">Time</th>
                <th scope="col">Item</th>
                <th scope="col">Store</th>
                <th scope="col" className="num">Before</th>
                <th scope="col" className="num">After</th>
                <th scope="col"><span className="visually-hidden">Undo</span></th>
              </tr>
            </thead>
            {history.map((entry, index) => {
              const span = entry.changes.length
              const name = itemName(entry.itemId)
              const stores = entry.changes.map((c) => storeName(c.storeId)).join(', ')
              return (
                <tbody key={entry.id} className={entry.undone ? 'is-undone' : undefined}>
                  {entry.changes.map((change, i) => (
                    <tr key={change.storeId}>
                      {i === 0 && (
                        <>
                          <td rowSpan={span} className="history-table__time">
                            {timeFormat.format(entry.at)}
                          </td>
                          <th scope="rowgroup" rowSpan={span}>
                            {name}
                            <span className="history-table__kind">{KIND_LABEL[entry.kind]}</span>
                          </th>
                        </>
                      )}
                      <td>{storeName(change.storeId)}</td>
                      <td className="num">{describe(entry, change.before)}</td>
                      <td className="num">{describe(entry, change.after)}</td>
                      {i === 0 && (
                        <td rowSpan={span} className="history-table__action">
                          {entry.undone ? (
                            <span className="tag">Undone</span>
                          ) : (
                            index === 0 &&
                            canUndo && (
                              <button
                                type="button"
                                className="button"
                                onClick={onUndo}
                                aria-label={`Undo last change: ${name} at ${stores}`}
                              >
                                Undo
                              </button>
                            )
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              )
            })}
          </table>
        </div>
      )}
    </section>
  )
}
