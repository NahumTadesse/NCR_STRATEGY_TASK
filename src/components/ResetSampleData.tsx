import { useRef, useState } from 'react'

interface Props {
  storeCount: number
  onReset: () => void
}

/**
 * Demo tool for reviewers, not a manager feature: it changes all stores.
 * Two-step reset: the first click asks, the second one does it.
 */
export function ResetSampleData({ storeCount, onReset }: Props) {
  const [confirming, setConfirming] = useState(false)
  // After Reset or Cancel, put focus back on the Reset sample data button.
  const focusResetOnMount = useRef(false)

  function close() {
    focusResetOnMount.current = true
    setConfirming(false)
  }

  return (
    <section className="panel panel--quiet" aria-labelledby="demo-tools-title">
      <h2 id="demo-tools-title" className="panel__title">Demo tools</h2>
      {confirming ? (
        <div className="confirm" role="group" aria-label="Confirm reset">
          <p className="confirm__text">
            This replaces prices and availability at all {storeCount} stores with the original
            sample data and clears recent changes. It cannot be undone.
          </p>
          <div className="confirm__actions">
            <button type="button" className="button" onClick={close} autoFocus>
              Cancel
            </button>
            <button
              type="button"
              className="button button--danger"
              onClick={() => {
                onReset()
                close()
              }}
            >
              Reset all stores
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="panel__empty">
            For reviewers trying out this demo. Not part of a store manager's tools. All
            data is sample data saved in this browser only.
          </p>
          <button
            type="button"
            className="button"
            onClick={() => setConfirming(true)}
            ref={(el) => {
              if (el && focusResetOnMount.current) {
                focusResetOnMount.current = false
                el.focus()
              }
            }}
          >
            Reset sample data
          </button>
        </>
      )}
    </section>
  )
}
