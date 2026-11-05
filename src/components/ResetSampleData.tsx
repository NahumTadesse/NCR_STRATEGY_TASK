import { useState } from 'react'

interface Props {
  storeCount: number
  onReset: () => void
}

/** Two-step reset: the first click asks, the second one does it. */
export function ResetSampleData({ storeCount, onReset }: Props) {
  const [confirming, setConfirming] = useState(false)

  return (
    <section className="panel panel--quiet" aria-labelledby="sample-data-title">
      <h2 id="sample-data-title" className="panel__title">Sample data</h2>
      {confirming ? (
        <div className="confirm" role="group" aria-label="Confirm reset">
          <p className="confirm__text">
            This replaces prices and availability at all {storeCount} stores with the original
            sample data and clears recent changes. It cannot be undone.
          </p>
          <div className="confirm__actions">
            <button type="button" className="button" onClick={() => setConfirming(false)} autoFocus>
              Cancel
            </button>
            <button
              type="button"
              className="button button--danger"
              onClick={() => {
                onReset()
                setConfirming(false)
              }}
            >
              Reset all stores
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="panel__empty">
            Everything here is sample data saved in this browser only.
          </p>
          <button type="button" className="button" onClick={() => setConfirming(true)}>
            Reset sample data
          </button>
        </>
      )}
    </section>
  )
}
