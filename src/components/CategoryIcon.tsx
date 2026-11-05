/** Small single-stroke icons for the sample menu categories. Decorative only. */
const PATHS: Record<string, string[]> = {
  // Plate seen from above, with a rim.
  Mains: ['M10 2.5a7.5 7.5 0 1 0 0 15a7.5 7.5 0 1 0 0-15z', 'M10 5.5a4.5 4.5 0 1 0 0 9a4.5 4.5 0 1 0 0-9z'],
  // A small bowl.
  Sides: ['M3 9h14a7 7 0 0 1-14 0z', 'M7.5 16.5h5'],
  // A cup with a straw.
  Drinks: ['M5 6.5h10l-1.3 10.5H6.3z', 'M11 6.5l1.5-4.5h2.5'],
  // A slice, point down.
  Desserts: ['M3 6.5h14L10 17.5z', 'M3 6.5c2-3 12-3 14 0'],
}

export function CategoryIcon({ category }: { category: string }) {
  const paths = PATHS[category]
  if (!paths) return null
  return (
    <svg className="category-icon" width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
      {paths.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  )
}
