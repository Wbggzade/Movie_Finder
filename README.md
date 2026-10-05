# Movie Finder

A frontend-only movie catalogue built with React 19, TypeScript, Redux Toolkit, React Router 6, Vite, and SCSS modules. It connects directly to The Movie Database (TMDB) for title search, genre filtering, sorting, pagination, posters, and movie details. No backend or database is included.

## Features

- Search by title, filter by the complete TMDB movie genre list, and sort by title (A–Z) or release date (oldest first).
- Preserve search, genre, and sort choices in URLs, reloads, and browser back/forward navigation.
- Load pages of 20 movies and open shareable detail URLs with full runtime and overview.
- Handle loading, empty results, missing posters, invalid responses, and service failures with retry controls.
- Cancel catalogue requests when queries change and ignore stale responses in Redux.
- Display details in modals with keyboard focus containment and Escape dismissal.
- Retain optional login, registration, sessions, protected routes, and admin CRUD for a compatible external service.

## Setup

Use Node.js 20 or newer and npm. Run commands in the directory containing `package.json`.

```sh
npm ci
```

Copy `.env.example` to `.env.local`:

```powershell
Copy-Item .env.example .env.local
```

On macOS/Linux, use `cp .env.example .env.local` instead. Obtain an **API key (v3 auth)** from your [TMDB account API settings](https://www.themoviedb.org/settings/api), then configure:

```dotenv
VITE_MOVIE_PROVIDER=tmdb
VITE_TMDB_API_KEY=your_tmdb_api_key
VITE_API_BASE_URL=
VITE_ENABLE_AUTH=false
VITE_ENABLE_MOVIE_MANAGEMENT=false
```

Use the API key, not the API Read Access Token. TMDB is [free for noncommercial use with attribution](https://developer.themoviedb.org/docs/faq). The app includes its official logo and attribution notice.

Keep `.env.local` out of Git; it is ignored. Vite embeds these settings in the browser bundle, so this frontend API key is visible to visitors. Never put account passwords or private server credentials in Vite variables. Restart Vite after configuration changes and rebuild before deployment.

```sh
npm run dev
```

Open the URL printed by Vite, normally `http://localhost:5173`. Without a key, the catalogue shows a configuration error. Automated tests use fixtures and need no real key.

## TMDB integration

`src/services/tmdb.ts` translates TMDB responses into the app's movie model and validates them before Redux stores them.

| Operation | Behaviour |
| --- | --- |
| Browse/filter/sort | `/discover/movie` handles genre selection, title/release-date sorting, and pagination on TMDB's servers. |
| Search | `/search/movie` searches titles. The adapter fetches all matching pages, deduplicates IDs, filters by genre, sorts the complete set, and paginates locally. |
| Genres | `/genre/movie/list` provides the complete genre filter options, independently of the loaded movies. |
| Details | `/movie/:id` loads full details even if a catalogue summary is already available. |

TMDB's search endpoint does not expose discovery's genre and sort parameters. Fetching all search pages prevents incorrect results from sorting or filtering only the visible page. To bound network work, searches above 50 pages (approximately 1,000 results) request a more specific title; results are never silently truncated. Up to three pages are fetched concurrently.

The adapter caches up to three completed searches in memory for five minutes. Filtering, sorting, and loading more reuse those results. Failed/cancelled searches are not cached; refreshing clears the cache. Discovery exposes at most TMDB's first 500 pages; narrow the catalogue with a genre or search when needed.

The app requests English metadata and excludes adult movies from catalogue queries. Missing posters use a local fallback; unknown runtimes display “Runtime unavailable”. Missing/invalid keys, rate limits, network failures, malformed data, and unavailable movies produce explanatory errors.

Provider documentation: [search](https://developer.themoviedb.org/reference/search-movie), [discovery](https://developer.themoviedb.org/reference/discover-movie), and [genres](https://developer.themoviedb.org/reference/genre-movie-list).

## Playwright end-to-end tests

These are **frontend end-to-end tests with mocked API responses**. They exercise the built React application, routing, Redux, the TMDB adapter, and fetch together in a real Chromium browser. HTTP interception supplies deterministic TMDB/account responses. They do not verify live TMDB availability or server-side authentication/authorization.

After installing dependencies:

```sh
npx playwright install chromium
npm run test:e2e
```

On Linux systems that need browser dependencies, use `npx playwright install --with-deps chromium`.

No separate dev server is needed. The script type-checks E2E files, builds into `.e2e-dist/`, starts a preview at `http://127.0.0.1:4173`, runs tests, and closes the server. Port **4173 must be free**. Test setup uses a fixture key, enables the login-error scenario, and disables movie management independently of normal deployment settings.

| Task | Command |
| --- | --- |
| Run headlessly | `npm run test:e2e` |
| Run in a visible browser | `npm run test:e2e -- --headed` |
| Run sorting scenarios | `npm run test:e2e -- --grep "sorting"` |
| Debug a scenario | `npm run test:e2e -- --debug --grep "sorting"` |
| Limit parallel workers | `npm run test:e2e -- --workers=2` |
| List tests | `npm run test:e2e -- --list` |
| Open the HTML report | `npx playwright show-report` |

The suite covers 13 browser scenarios:

1. Search, genre selection, and browser back/forward navigation.
2. Visible sorting order and reload persistence.
3. Genre filtering and restoring all results.
4. Enter-key search, empty results, and query clearing.
5. Paginated loading, ordered results, TMDB page numbers, and the end of the list.
6. HTTP 503 errors and retry recovery.
7. Malformed response rejection and recovery.
8. Direct detail links and reloads independently of catalogue matches.
9. Modal keyboard focus containment and Escape dismissal.
10. Missing movies and returning to the catalogue.
11. Rejected login while preserving the entered email.
12. Search sorting/filtering using matches from later TMDB pages.
13. Loading full runtime details when opening a catalogue summary.

Each test uses its own browser context and API fixture. The login-error test passes when rejected credentials are handled correctly.

Reports are written to `playwright-report/index.html`. Failure screenshots and traces are in `test-results/` and accessible through the report. Reinstall Chromium if its executable is missing. For restricted cache permissions, set `PLAYWRIGHT_BROWSERS_PATH` to a writable directory for both installation and execution. Stop your own server on port 4173 if it is occupied.

The setup loads the shared Vite configuration directly and owns the preview server in-process, avoiding separate configuration-bundling and Windows process-tree shutdown issues in restricted environments.

## Jest tests and quality checks

```sh
npm test
npm run coverage
npm run lint
```

Jest and React Testing Library provide unit, component, and integration tests in jsdom with mocked HTTP responses. Tests cover controls, validation, routing, selectors, reducers, async thunks, sessions, and API validation. Strengthened regressions check add/edit/delete request payloads and Redux outcomes, preservation of input after failures, navigation through the actual router, detail loading through real selectors/thunks, and stale catalogue responses after the latest request completes.

TMDB adapter tests cover multi-page sorting/filtering, pagination, caching, failed-search recovery, cancellation, malformed responses, nullable fields, and key/rate-limit errors. These complement the browser scenarios; passing tests does not prove every possible interaction is covered.

`npm test` writes `junit.xml`. `npm run coverage` writes `coverage/`; no minimum coverage threshold is configured. Use `npm run test:local` for Jest watch mode.

## Optional login and admin features

TMDB provides the read-only public catalogue; it does **not** implement this app's login or admin API. The existing account and movie-management code is retained. Authentication is disabled by default and is unnecessary for browsing.

To enable accounts, set `VITE_API_BASE_URL` to a compatible external service and `VITE_ENABLE_AUTH=true`. Account routes are `/login` and `/registration`. Sessions store a token in `localStorage`, not passwords.

Admin editing additionally requires `VITE_MOVIE_PROVIDER=custom`, `VITE_ENABLE_MOVIE_MANAGEMENT=true`, and an authenticated `admin` role. Custom mode replaces TMDB with the compatible service's catalogue; the app does not edit public TMDB data. Client-side flags/route guards control the UI, while the external service must enforce authorization.

### Custom API contract

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/movies` | List/search/filter/sort/page through movies |
| GET | `/movies/:id` | Retrieve one movie |
| POST | `/movies` | Create a movie |
| PUT | `/movies/:id` | Update a movie |
| DELETE | `/movies/:id` | Delete a movie |
| POST | `/me/register` | Register with name, email, password |
| POST | `/me/login` | Return a user and session token |
| POST | `/me/user` | Validate a saved session token |
| POST | `/me/logout` | Request remote logout |

List queries include `offset`, `limit`, and optional `search`, `filter`, and `sortBy` (`title` or `release date`). Sort direction depends on the custom service. Responses are arrays/objects or `{ "data": ... }` wrappers. A movie requires numeric `id`, `runtime`, `vote_average`; string `title`, `release_date`, `poster_path`, `overview`; and string-array `genres`. Custom-mode genres are derived from loaded results. Mutation requests use a bearer token. See `src/services/` and `src/store/thunks.ts` for payload validation. The service must allow the frontend origin through CORS.

## Project structure

```text
src/
  common/           Controls, modal, route guard
  components/       Catalogue, header, details, forms
  services/         TMDB/custom adapters, validation, sessions
  store/            Redux slices, selectors, typed hooks, thunks
  types/            Shared TypeScript models
  __tests__/        Component/application tests
public/             Poster fallback and official TMDB logo
e2e/                Browser scenarios, HTTP fixtures, build/server setup
.github/workflows/  CI checks and test artifacts
```

Additional tests are colocated with store and service modules.

## Build, deployment, and CI

```sh
npm run build
npm run preview
```

Builds type-check application code and generate `dist/`. Set Vite environment values before building. Deploy `dist/` to a static host with an SPA fallback to `index.html` for routes such as `/movies/101`. Do not deploy `.e2e-dist/`; it is a fixture-configured test build.

GitHub Actions runs dependency installation, production build, lint, Jest, browser installation, and Playwright on pushes to `main` and pull requests. CI uses one browser worker and retries failures up to twice. Playwright reports and failure artifacts are retained for 14 days. Generated builds/reports and local environment files are excluded from Git.

## Attribution

The official logo in `public/tmdb-logo.svg` comes from [TMDB's approved logos](https://www.themoviedb.org/about/logos-attribution). This product uses the TMDB API but is not endorsed or certified by TMDB. Movie metadata/artwork belong to their respective owners; see [TMDB attribution requirements](https://developer.themoviedb.org/docs/faq).
