import { useId, useRef, useState } from 'react'
import type { FormEvent, KeyboardEvent } from 'react'
import { centsToInputValue, formatCents, parseDollarsToCents } from '../domain/money'

interface Props {
  itemName: string
  storeName: string
  priceCents: number
  onSave: (priceCents: number) => void
  onApplyToOthers: () => void
}

/** Shows a price with an Edit button; editing validates inline before saving. */
export function PriceEditor({ itemName, storeName, priceCents, onSave, onApplyToOthers }: Props) {
  const [draft, setDraft] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const errorId = useId()
  // After Save or Cancel, put focus back on the Edit button so keyboard users keep their place.
  const focusEditOnMount = useRef(false)

  function startEditing() {
    setDraft(centsToInputValue(priceCents))
    setError(null)
  }

  function cancel() {
    focusEditOnMount.current = true
    setDraft(null)
    setError(null)
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    const result = parseDollarsToCents(draft ?? '')
    if (!result.ok) {
      setError(result.error)
      return
    }
    onSave(result.cents)
    cancel()
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') cancel()
  }

  if (draft === null) {
    return (
      <span className="price">
        <span className="price__value">{formatCents(priceCents)}</span>
        <button
          type="button"
          className="link-button"
          onClick={startEditing}
          ref={(el) => {
            if (el && focusEditOnMount.current) {
              focusEditOnMount.current = false
              el.focus()
            }
          }}
          aria-label={`Edit price of ${itemName} at ${storeName}`}
        >
          Edit
        </button>
        <button
          type="button"
          className="link-button"
          onClick={onApplyToOthers}
          aria-label={`Apply to other stores: ${itemName} price from ${storeName}`}
        >
          Apply to other stores
        </button>
      </span>
    )
  }

  return (
    <form className="price-form" onSubmit={submit} noValidate>
      <span className="price-form__row">
        <span aria-hidden="true">$</span>
        <input
          className="price-form__input"
          inputMode="decimal"
          autoComplete="off"
          autoFocus
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value)
            setError(null)
          }}
          onKeyDown={onKeyDown}
          aria-label={`New price of ${itemName} at ${storeName}, in dollars`}
          aria-invalid={error !== null}
          aria-describedby={error ? errorId : undefined}
        />
        <button type="submit" className="button button--primary">Save</button>
        <button type="button" className="button" onClick={cancel}>Cancel</button>
      </span>
      {error && (
        <span id={errorId} className="field-error" role="alert">
          {error}
        </span>
      )}
    </form>
  )
}
