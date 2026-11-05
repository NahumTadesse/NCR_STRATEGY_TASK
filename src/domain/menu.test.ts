import { describe, expect, it } from 'vitest'
import { groupByCategory } from './menu'
import { SEED_ITEMS } from './seed'

describe('groupByCategory', () => {
  it('groups seed items in first-seen order', () => {
    const groups = groupByCategory(SEED_ITEMS)
    expect(groups.map((g) => g.category)).toEqual(['Mains', 'Sides', 'Drinks', 'Desserts'])
    expect(groups[0].items.map((i) => i.id)).toEqual(['fish-tacos', 'harbor-burger', 'grain-bowl'])
  })

  it('keeps every item exactly once', () => {
    const ids = groupByCategory(SEED_ITEMS).flatMap((g) => g.items.map((i) => i.id))
    expect(ids.sort()).toEqual(SEED_ITEMS.map((i) => i.id).sort())
  })

  it('returns no groups for no items', () => {
    expect(groupByCategory([])).toEqual([])
  })
})
