import { useEffect, useId, useRef, useState } from 'react'
import { formatCents } from '../domain/money'
import { STORES } from '../domain/seed'
import type { AppState, MenuItem, Store, StoreId } from '../domain/types'
import { previewPriceChange } from '../domain/updates'

interface Props {
  state: AppState
  sourceStore: Store
  item: MenuItem
  onConfirm: (targetStoreIds: StoreId[]) => void
  onClose: () => void
}

function storeName(id: StoreId): string {
  return STORES.find((s) => s.id === id)?.name ?? id
}

/**
 * Copies the source store's saved price to stores the user picks.
 * Nothing is preselected. The preview is derived from current state on
 * every render, and the parent recomputes it again on confirm.
 */
export function ApplyToStoresDialog({ state, sourceStore, item, onConfirm, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [picked, setPicked] = useState<StoreId[]>([])
  const titleId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  const otherStores = STORES.filter((s) => s.id !== sourceStore.id)
  const newPrice = state.byStore[sourceStore.id][item.id].priceCents
  // Keep picks in the same order as the store list.
  const targets = otherStores.map((s) => s.id).filter((id) => picked.includes(id))
  const rows = previewPriceChange(state, sourceStore.id, item.id, targets)

  function toggle(id: StoreId, checked: boolean) {
    setPicked((prev) => (checked ? [...prev, id] : prev.filter((p) => p !== id)))
  }

  return (
    <dialog
      ref={dialogRef}
      className="dialog"
      aria-labelledby={titleId}
      onClose={onClose}
      data-store={sourceStore.id}
    >
      <form method="dialog" onSubmit={(e) => {
        e.preventDefault()
        onConfirm(targets)
      }}>
        <h2 id={titleId} className="dialog__title">Apply price to other stores</h2>
        <p>
          Set <strong>{item.name}</strong> to <strong>{formatCents(newPrice)}</strong>, the
          current price at {sourceStore.name}. Only price changes. Availability stays as it is
          at each store.
        </p>

        <fieldset className="dialog__stores">
          <legend>Choose stores to update</legend>
          {otherStores.map((s) => (
            <label key={s.id} className="dialog__store">
              <input
                type="checkbox"
                checked={picked.includes(s.id)}
                onChange={(e) => toggle(s.id, e.target.checked)}
              />
              {s.name}
              <span className="dialog__muted">
                now {formatCents(state.byStore[s.id][item.id].priceCents)}
              </span>
            </label>
          ))}
        </fieldset>

        <h3 className="dialog__subtitle">Preview</h3>
        {rows.length === 0 ? (
          <p className="dialog__muted">No stores chosen yet. Nothing will change.</p>
        ) : (
          <table className="preview-table">
            <thead>
              <tr>
                <th scope="col">Store</th>
                <th scope="col" className="num">Before</th>
                <th scope="col" className="num">After</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.storeId}>
                  <th scope="row">{storeName(row.storeId)}</th>
                  <td className="num">{formatCents(row.beforeCents)}</td>
                  <td className="num">
                    {row.beforeCents === row.afterCents
                      ? 'No change'
                      : formatCents(row.afterCents)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="dialog__actions">
          <button type="button" className="button" onClick={() => dialogRef.current?.close()}>
            Cancel
          </button>
          <button type="submit" className="button button--primary" disabled={rows.length === 0}>
            {rows.length === 0
              ? 'Apply'
              : `Apply to ${rows.length} ${rows.length === 1 ? 'store' : 'stores'}`}
          </button>
        </div>
      </form>
    </dialog>
  )
}
