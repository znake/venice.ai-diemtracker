# Learnings - Venice Balance Tracker

## Project Conventions

Created useLocalStorage hook in src/hooks/useLocalStorage.js. Removed unnecessary comments to comply with project rules.
## useInterval Hook Implementation
- Implemented the declarative `useInterval` hook pattern by Dan Abramov.
- Used `useRef` to store the latest callback to avoid stale closures without re-triggering the interval effect.
- The hook supports pausing by passing `null` as the delay.
- Proper cleanup is handled via `clearInterval` in the `useEffect` cleanup function.
## Venice API Implementation
- Implemented fetchBalance in src/api/venice.js
- Uses native fetch() to call /models endpoint
- Extracts balance from x-venice-balance-* headers
- Handles 401, 429, and network errors

## Component Implementation: KeyForm
- **Pattern**: Controlled inputs with local state for form fields.
- **Validation**: Simple manual validation in `handleSubmit` avoids external libraries for simple forms.
- **UX**: 
  - Password toggle for API keys is essential.
  - distinct "Add" vs "Save" button text clarifies context.
  - Error messages placed prominently in red.
- **Styling**: 
  - Used `zinc` scale for a neutral, modern dark mode look.
  - Added a subtle decorative gradient corner for visual interest without clutter.
  - Input focus states use `emerald-500` to match the "money/finance" theme of the app.

## Component Implementation: KeyCard
- Created `src/components/KeyCard.jsx`
- Implemented props: `{ keyData, onEdit, onDelete, onRefresh }`
- Added masking for API key (first 3, last 3)
- Added balance display for USD, DIEM, VCU
- Added error state handling
- Added loading state with pulse animation
- Added hover effects for actions
- Used Tailwind for styling (dark theme compatible)

## App.jsx Integration Notes
- `App.jsx` uses `useLocalStorage('venice-keys', [])` to persist keys in the browser.
- Auto-refresh uses `useInterval(callback, 60000)` and pauses with `null` when no keys exist.
- `refreshAll` runs sequential refresh with a small delay (150ms) to be gentle on rate limits.
- `refreshSingle` supports an `apiKeyOverride` to avoid stale-closure issues when a key is edited and immediately refreshed.
- KeyCard props confirmed: `{ keyData, onEdit, onDelete, onRefresh }`; KeyForm props: `{ onSubmit, initialData, onCancel }`.
