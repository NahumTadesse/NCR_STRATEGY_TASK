/**
 * Harbor Street Kitchen mark: an "H" whose crossbar is a wave, like a pier
 * over water. Same drawing as public/favicon.svg.
 */
export function BrandMark({ size = 32 }: { size?: number }) {
  return (
    <svg className="brand-mark" width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="7" className="brand-mark__tile" />
      <path d="M9.5 8v16M22.5 8v16" className="brand-mark__glyph" strokeWidth="3" />
      <path
        d="M9.5 17c2.2-2.6 4.3-2.6 6.5 0s4.3 2.6 6.5 0"
        className="brand-mark__glyph"
        strokeWidth="2.4"
        fill="none"
      />
    </svg>
  )
}
