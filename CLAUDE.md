# Harbor Street Kitchen: Store Menu Manager

Job application exercise. A store manager views the menu and changes an item's
price or availability for their selected store. 4 locations, sample data only.

## Working rules
- Replies ≤ 40 lines (tables excluded). Never paste full files in chat;
  summarize what changed and where (`path:line`).
- Work in small slices. After each slice run `npm run lint` and `npm run build`
  (and `npm test` once Vitest exists) and report results honestly.
- Ask before deleting files or installing new packages. Also ask before npm
  override flags such as `--legacy-peer-deps` or `--force`, and before running
  `npx` or any temporary install.
- The 40-line limit covers the whole turn, including tool output. Trim command
  output with `tail`, `head` or `--stat`.
- Work only inside this project folder.
- After a slice passes lint, build and tests, commit with a short, clear
  message. Never push; the user pushes.
- README and UI text: plain language, no em dashes.
- Sample data only, persisted in localStorage. No real data, no backend, no network calls.

## Requirements
1. The selected location is always easy to identify (persistent, prominent indicator).
2. At least 5 menu items, each with name, category, price, availability.
3. Change an item's price at the selected location.
4. Mark an item available/unavailable at the selected location.

## Decisions
- **Location scope:** edits apply only to the selected store by default.
- **"Apply to other stores"** is a separate, explicit action for **price only**:
  pick target stores explicitly (none preselected) → before/after preview → confirm.
  Cancel leaves all data untouched.
- **Availability is store-only.** Never propagated to other stores.
- **Every store carries every item.** Stores differ only in price and availability.
- **Valid price:** $0.01 to $99.99 (1 to 9999 cents). $0 is rejected (use
  unavailable instead). Show invalid input as an inline error, never an alert.
- **Apply dialog** uses the selected store's *saved* price: save first, then open.
  Recompute the preview at confirm time.
- **Selected store** is remembered in localStorage; defaults to the first store.
- **Recent changes** list (store, item, before, after, time) with undo for the
  most recent change only (slice 8).
- **Saved data problems:** if saved data was invalid and replaced with sample
  data, show a small notice. Slice 8 adds a "Reset sample data" button.
- **Price input** also accepts a trailing dot ("4.") and a space after "$" ("$ 4.50").
- **Money:** prices are integer cents, stored per store. Never use floats for
  stored values; parse/format only at the UI boundary.

## Stack
- Vite + React + TypeScript. TypeScript pinned to `~6.0.0` for typescript-eslint
  compatibility. Do not bump it.
- Vitest for unit tests of pure update logic (install only after approval).

## Code conventions
- Keep domain logic (updates, validation, price parsing, persistence) in pure
  functions under `src/domain/`, separate from React components, so it is unit-testable.
- Update functions are immutable: return new state, never mutate input.
- localStorage access goes through one module with a versioned key and safe
  fallback to seed data on missing/corrupt data.
