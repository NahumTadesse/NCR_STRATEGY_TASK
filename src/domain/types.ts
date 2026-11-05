export const STORE_IDS = ['downtown', 'harborfront', 'uptown', 'westside'] as const

export type StoreId = (typeof STORE_IDS)[number]

export interface Store {
  id: StoreId
  name: string
}

export type ItemId = string

/** Fields shared by every store. Every store carries every item. */
export interface MenuItem {
  id: ItemId
  name: string
  category: string
}

/** Per-store fields. Price is always integer cents. */
export interface StoreItemState {
  priceCents: number
  available: boolean
}

export type StoreMenu = Record<ItemId, StoreItemState>

export interface AppState {
  version: 1
  selectedStoreId: StoreId
  items: MenuItem[]
  byStore: Record<StoreId, StoreMenu>
}

export interface PricePreviewRow {
  storeId: StoreId
  beforeCents: number
  afterCents: number
}
