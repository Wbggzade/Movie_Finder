# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start Vite dev server (http://localhost:5173)
npm run build        # tsc + vite build → dist/
npm run lint         # ESLint strict (max-warnings: 0)
npm test             # Run all tests once (jest-junit reporter)
npm run test:local   # Run tests in watch mode
npm run coverage     # Tests with coverage
```

**Run a single test file:**

```bash
npm test -- src/__tests__/MovieTile.test.tsx
```

## Architecture

**Stack**: React 19 + TypeScript + Redux Toolkit + React Router v6 + SCSS Modules + Vite

### State Management

Two Redux slices in `src/store/`:

- `moviesSlice.ts` — `{ list: Movie[], loading, error }`
- `userSlice.ts` — `{ name, email, token, role, isAuth, error }`

Async API calls are all in `src/store/thunks.ts` (fetch movies, add/update/delete movie, login/logout/getUser). Typed hooks `useAppDispatch`/`useAppSelector` are in `src/store/hooks.ts`. Selectors live in `src/store/selectors.ts`.

### Routing

Routes are defined as constants in `src/constants.ts`. `App.tsx` defines the route tree. `src/common/PrivateRoute/` is a HOC that gates routes based on `isAuth`/`token` in the Redux store.

Role-based UI: users with `role: 'admin'` see add/edit/delete controls.

### Component Organization

- `src/common/` — generic UI primitives (Button, Input, Modal, PrivateRoute)
- `src/components/` — feature components (Header, MoviesList, MovieDetails, forms/)
- Both directories export via barrel `index.ts`

### Path Aliases

`@/*` resolves to `src/*` (configured in `tsconfig.json` and `vite.config.ts`). Use `@/store`, `@/components`, etc. throughout.

### Styling

All component styles use `.module.scss` files. `clsx` is used for conditional class composition.

## Testing

Tests live in `src/__tests__/`. The setup file is `jest.setup.ts` (imports jest-dom, mocks `global.fetch`).

**Key test utility**: `renderWithProviders()` from `@/store/_mock` — wraps a component in a Redux Provider with a configurable mock store. Use this instead of plain `render` whenever the component reads from Redux.

CSS modules are mocked via `identity-obj-proxy`; SVGs via `jest-transformer-svg`.

## Code Style

Prettier enforces: 120-char print width, tabs (not spaces), single quotes, `trailingComma: "es5"`, `endOfLine: "auto"`. ESLint treats all warnings as errors — run `npm run lint` before committing.
