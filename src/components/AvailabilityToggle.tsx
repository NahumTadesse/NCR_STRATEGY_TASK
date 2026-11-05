interface Props {
  itemName: string
  storeName: string
  available: boolean
  onChange: (available: boolean) => void
}

/** On/off switch for one item at one store. The visible text always says the current state. */
export function AvailabilityToggle({ itemName, storeName, available, onChange }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={available}
      aria-label={`${itemName} available at ${storeName}`}
      className={available ? 'switch switch--on' : 'switch switch--off'}
      onClick={() => onChange(!available)}
    >
      <span className="switch__track" aria-hidden="true">
        <span className="switch__thumb" />
      </span>
      {/* The state text is styled as a pill, so the row shows it once, not twice. */}
      <span className="switch__text">
        <span className="switch__dot" aria-hidden="true" />
        {available ? 'Available' : 'Unavailable'}
      </span>
    </button>
  )
}
