import type { AppState, MenuItem, Store, StoreId, StoreMenu } from './types'

/** Sample data only. Not real Harbor Street Kitchen prices. */
export const STORES: readonly Store[] = [
  { id: 'downtown', name: 'Downtown' },
  { id: 'harborfront', name: 'Harborfront' },
  { id: 'uptown', name: 'Uptown' },
  { id: 'westside', name: 'Westside' },
]

export const DEFAULT_STORE_ID: StoreId = STORES[0].id

export const SEED_ITEMS: readonly MenuItem[] = [
  { id: 'fish-tacos', name: 'Grilled Fish Tacos', category: 'Mains' },
  { id: 'harbor-burger', name: 'Harbor Burger', category: 'Mains' },
  { id: 'grain-bowl', name: 'Roasted Veggie Grain Bowl', category: 'Mains' },
  { id: 'chowder', name: 'Clam Chowder Cup', category: 'Sides' },
  { id: 'fries', name: 'Sea Salt Fries', category: 'Sides' },
  { id: 'lemonade', name: 'Fresh Lemonade', category: 'Drinks' },
  { id: 'cold-brew', name: 'Cold Brew', category: 'Drinks' },
  { id: 'key-lime', name: 'Key Lime Bar', category: 'Desserts' },
]

// Base prices in cents. Each store gets a small offset so stores differ.
const BASE_PRICE_CENTS: Record<string, number> = {
  'fish-tacos': 1395,
  'harbor-burger': 1450,
  'grain-bowl': 1225,
  chowder: 650,
  fries: 495,
  lemonade: 425,
  'cold-brew': 475,
  'key-lime': 550,
}

const STORE_OFFSET_CENTS: Record<StoreId, number> = {
  downtown: 0,
  harborfront: 50,
  uptown: 25,
  westside: 0,
}

// A few items start unavailable so the UI shows both states.
const SEED_UNAVAILABLE: Partial<Record<StoreId, string[]>> = {
  harborfront: ['key-lime'],
  westside: ['chowder', 'cold-brew'],
}

function buildStoreMenu(storeId: StoreId): StoreMenu {
  const menu: StoreMenu = {}
  for (const item of SEED_ITEMS) {
    menu[item.id] = {
      priceCents: BASE_PRICE_CENTS[item.id] + STORE_OFFSET_CENTS[storeId],
      available: !(SEED_UNAVAILABLE[storeId] ?? []).includes(item.id),
    }
  }
  return menu
}

/** Returns a fresh copy each call, so callers can never mutate shared seed data. */
export function createSeedState(): AppState {
  return {
    version: 1,
    selectedStoreId: DEFAULT_STORE_ID,
    items: SEED_ITEMS.map((item) => ({ ...item })),
    byStore: {
      downtown: buildStoreMenu('downtown'),
      harborfront: buildStoreMenu('harborfront'),
      uptown: buildStoreMenu('uptown'),
      westside: buildStoreMenu('westside'),
    },
  }
}
