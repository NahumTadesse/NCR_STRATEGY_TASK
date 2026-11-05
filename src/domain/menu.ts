import type { MenuItem } from './types'

export interface CategoryGroup {
  category: string
  items: MenuItem[]
}

/** Group items by category, keeping first-seen order for both categories and items. */
export function groupByCategory(items: readonly MenuItem[]): CategoryGroup[] {
  const groups = new Map<string, MenuItem[]>()
  for (const item of items) {
    const list = groups.get(item.category)
    if (list) list.push(item)
    else groups.set(item.category, [item])
  }
  return [...groups].map(([category, list]) => ({ category, items: list }))
}
