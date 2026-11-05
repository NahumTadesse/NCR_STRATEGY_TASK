# Harbor Street Kitchen: Store Menu Manager

A small app for a store manager at Harbor Street Kitchen (4 locations) to view
the menu and change an item's price or availability at their selected store.

All data is sample data, saved in this browser's localStorage. There is no backend.

## Run it

```bash
npm install
npm run dev      # start the app
npm test         # unit tests (Vitest)
npm run lint
npm run build
```

## Known limits

- **Last save wins across tabs.** If the app is open in two tabs, each tab picks
  up the other's saved changes. If both save around the same time, the later
  save replaces the earlier one.
