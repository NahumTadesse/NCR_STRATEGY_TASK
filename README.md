# Harbor Street Kitchen: Store Menu Manager

A small app for a Harbor Street Kitchen store manager (4 locations) to view the
menu and change an item's price or availability at their store.

Live demo: https://harbor-street-kitchen-menu.vercel.app/

All data is sample data saved in this browser's localStorage. There is no backend.

## Run it

Needs Node 22.12 or later.

```bash
npm install
npm run dev      # start the app at the URL Vite prints
npm test         # unit tests (Vitest)
npm run lint
npm run build    # type check and production build into dist/
```

## What it does

- **Pick a store.** The header shows the store you are editing in large type, in
  that store's color. The table edge, dialog edge and main buttons use the same
  color, so the current store stays clear even after scrolling.
- **See the menu.** 8 sample items grouped by category, each with its price and
  availability at the selected store.
- **Change a price.** Click Edit, type a price, then Save. Prices must be between
  $0.01 and $99.99. A $0 price is rejected; mark the item unavailable instead.
  Mistakes show as an inline message next to the field.
- **Change availability.** A switch per item, for the selected store only.
- **Apply to other stores.** Copies the selected store's saved price for one item
  to stores you choose. See below.
- **Recent changes.** Each change in this session, with store, item, before,
  after and time. The most recent change can be undone.

## Demo tools

The "Demo tools" section at the bottom of the page has a "Reset sample data"
button. It puts all 4 stores back to the original sample data, after a confirm
step. It exists only so reviewers can start fresh. It is not a manager feature,
since it changes every store.

## The location conflict and how it is handled

A price or availability change could mean "this store" or "every store". Getting
that wrong silently changes prices at stores the manager does not run.

- **Every edit applies to the selected store only.** That is the safe default
  and matches what a store manager is responsible for.
- **Changing other stores is a separate, explicit action.** "Apply to other
  stores" opens a dialog where you tick stores yourself (none are preselected),
  see a before and after preview, and then confirm. Stores already at that price
  are disabled and labeled "Already $X.XX", so the count only shows real changes.
- **It uses the saved price.** You save the price at your store first, then copy
  it. The preview is recalculated when you confirm, so it cannot apply stale numbers.
- **Availability never spreads.** Running out of an item is a local fact, so
  there is no way to mark an item unavailable at another store.
- **One undo covers the whole batch.** An apply counts as one entry in recent
  changes, and undoing it puts every store in that batch back.

## Assumptions

- **The store picker stands in for a login.** In production, a manager's account
  would be tied to their store, and only an operations role would see "Apply to
  other stores".
- Every store carries every item. Stores differ only in price and availability.
- Prices are stored as whole cents per store, so there is no rounding drift.

## How it was tested

- **Unit tests (Vitest)** cover the logic in `src/domain/`. Run them with `npm test`.
  - price parsing and limits
  - edits that touch only the selected store and never change the input data
  - apply-to-stores preview and confirm, including recalculating at confirm time
  - undo, including whole batches and refusing when data changed since
  - saving and loading, including corrupt or missing data
- **Manual check in the browser** for layout, keyboard use and each flow. There
  are no automated screen tests; the screens are thin and call the tested logic.
- `npm run lint` and `npm run build` pass.

## Known limits

- **Last save wins across tabs.** If the app is open in two tabs, each tab picks
  up the other's saved changes. If both save around the same time, the later
  save replaces the earlier one. Undo refuses if the item changed since.
- **Recent changes last for the session only.** Reloading the page clears them.
  Only the most recent change can be undone.
- **Saved data is per browser.** Clearing site data or using another device
  starts again from the sample data. If saved data cannot be read, the app loads
  the sample data and shows a notice.
- **Switching stores discards a price you are still typing.** An open price edit
  is closed without saving when you pick another store, so it can never be saved
  to the wrong store. There is no warning first.
- **No item management.** Adding, removing or renaming items is out of scope.
