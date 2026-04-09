# AGENTS.md - Developer Guide for Diemtracker

This file provides context for AI agents operating in this repository.

---

## Project Overview

**Diemtracker** is a React 19 SPA that tracks Venice.ai API balances (USD/DIEM) across multiple API keys with usage analytics, per-wallet/per-API-key breakdowns, and filtering. It's a client-side-only application with no backend.

- **Tech Stack**: React 19, Vite 7, Tailwind CSS 4, ESLint
- **Language**: JavaScript (JSX)
- **Package Manager**: npm

---

## Build & Development Commands

### Development
```bash
npm run dev          # Start Vite dev server (http://localhost:5173)
```

### Production
```bash
npm run build        # Build for production (outputs to dist/)
npm run preview      # Preview production build locally
```

### Linting
```bash
npm run lint         # Run ESLint on entire project
```

### Testing
**No test framework is configured.** Do not add tests unless explicitly requested.

---

## Code Style Guidelines

### General Conventions
- **Language**: JavaScript with JSX (no TypeScript, despite typescript-language-server in deps)
- **File Extension**: `.jsx` for React components, `.js` for utilities/hooks
- **ES Version**: ES2020 (set in ESLint config)
- **Module System**: ES Modules (`import`/`export`, `"type": "module"` in package.json)

### Formatting & Layout
- **Indentation**: 2 spaces (Tailwind default)
- **Line Length**: No strict limit; use reasonable line lengths (~80-120 chars)
- **Trailing Commas**: Optional in JSX props
- **Quotes**: Double quotes for strings in JS (consistent with existing code)
- **Semicolons**: Yes (default ESLint behavior)

### Imports
```javascript
// Group imports by type (React, then local, then components)
import { useCallback, useEffect, useMemo, useState } from 'react';

import useLocalStorage from './hooks/useLocalStorage';
import { aggregateUsage, fetchBalance } from './api/venice';
import KeyCard from './components/KeyCard';
```

### Naming Conventions
- **Components**: PascalCase (e.g., `KeyCard`, `UsageDashboard`)
- **Hooks**: camelCase starting with `use` (e.g., `useLocalStorage`, `useInterval`)
- **Functions/Variables**: camelCase (e.g., `fetchBalance`, `sortedKeys`)
- **Constants**: UPPER_SNAKE_CASE for module-level constants (e.g., `STORAGE_KEY`, `AUTO_REFRESH_MS`)
- **Files**: kebab-case for utilities, PascalCase for components

### React Patterns
- Use functional components with arrow functions
- Destructure props explicitly
- Use `useCallback` for callback functions passed to child components
- Use `useMemo` for expensive computations
- Use `useRef` for mutable values that don't trigger re-renders
- Include `key` prop in list mappings

### Error Handling
- Return error state as part of result objects (not thrown exceptions)
- Handle all API errors gracefully with user-friendly messages
- Use try/catch for async operations, return error in response object
- Avoid empty catch blocks

```javascript
// Good pattern (from venice.js)
try {
  const response = await fetch(...);
  if (!response.ok) {
    return { usd: null, diem: null, error: `HTTP error! status: ${response.status}` };
  }
  return { usd, diem, error: null };
} catch {
  return { usd: null, diem: null, error: "Network error" };
}
```

### CSS & Styling
- Use **Tailwind CSS 4** exclusively for styling
- Use the zinc/emerald color scheme (matching existing design)
- Prefer Tailwind's utility classes over custom CSS
- Use semantic class names that describe the content, not the styling
- Follow Tailwind's responsive prefixes (`sm:`, `md:`, `lg:`, `xl:`)

```jsx
// Example from existing code
<div className="min-h-screen bg-zinc-950 text-zinc-100">
  <button className="rounded-lg bg-emerald-500 hover:bg-emerald-400 ...">
</div>
```

### ESLint Rules
The project uses:
- `@eslint/js` - Base ESLint recommended rules
- `eslint-plugin-react-hooks` - React Hooks rules
- `eslint-plugin-react-refresh` - HMR-safe component checks
- Custom rule: `no-unused-vars` with `varsIgnorePattern: '^[A-Z_]'` (allows uppercase constants)

Run `npm run lint` before committing. Fix all errors; warnings are acceptable but should be minimized.

---

## Project Structure

```
src/
├── api/
│   └── venice.js           # Venice API client (balance, usage, analytics)
├── components/
│   ├── KeyCard.jsx         # API key display card (with wallet badge)
│   ├── KeyForm.jsx         # Add/edit key modal form (with wallet field)
│   └── UsageDashboard.jsx  # Usage dashboard (model breakdown, API key breakdown, filters)
├── hooks/
│   ├── useInterval.js      # Interval hook for auto-refresh
│   └── useLocalStorage.js  # Persistence hook for API keys
├── App.jsx                 # Main app: state management, data fetching, filtering
├── main.jsx                # Entry point
└── index.css               # Global styles (Tailwind directives)
```

---

## Working with Venice API

- **Base URL**: `https://api.venice.ai/api/v1`
- **Authentication**: Bearer token in `Authorization` header
- **Rate Limits**: Handle 429 responses gracefully
- **Balance Endpoint**: `/api_keys/rate_limits`
- **Usage Endpoint**: `/billing/usage` (paginated, no API key attribution per record)
- **Analytics Endpoint**: `/billing/usage-analytics` (aggregated, provides `byKey` breakdown with `apiKeyId`, `description`, `totalDiem`, `totalUsd`, `totalUnits`)

---

## Common Patterns

### Adding a New Component
1. Create file in `src/components/`
2. Use functional component with arrow function
3. Export as default
4. Import in parent with PascalCase name
5. Use Tailwind classes matching existing design system

### Adding a New Hook
1. Create file in `src/hooks/`
2. Name with `use` prefix (e.g., `useXxx.js`)
3. Export as default
4. Document dependencies in useCallback/useEffect

### Modifying the API
1. Edit `src/api/venice.js`
2. Return error objects, don't throw
3. Handle all HTTP status codes
4. Add appropriate delays between requests to avoid rate limits

---

## What NOT To Do

- Do NOT add TypeScript (project uses JS)
- Do NOT add testing frameworks (none exist)
- Do NOT remove Tailwind CSS (required for styling)
- Do NOT change the color scheme (zinc/emerald is intentional)
- Do NOT add a backend or server-side code (static SPA)
- Do NOT commit without running `npm run lint`

---

## Dependencies

**Production**:
- `react` ^19.2.0
- `react-dom` ^19.2.0
- `tailwindcss` ^4.1.18
- `@tailwindcss/vite` ^4.1.18

**Development**:
- `vite` ^7.2.4
- `eslint` ^9.39.1
- `@vitejs/plugin-react` ^5.1.1
- `typescript-language-server` ^5.1.3

---

Last updated: April 2026