# FrameFinder — Movie Discovery & Catalogue

FrameFinder is a static React frontend for discovering, searching, filtering, sorting, and viewing movies. It uses React, TypeScript, Redux Toolkit, React Router, Vite, and the repository's Jest/React Testing Library setup.

This project is based on the React Global course final-task template. The catalogue UI and its component structure retain that foundation.

## Run Locally

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

Set `VITE_API_BASE_URL` in `.env.local` to the origin of a compatible external API. The API base URL must be reachable by the browser and allow the frontend origin through CORS. No API secret belongs in a Vite variable: frontend environment values are included in the browser bundle.

## API Contract

The frontend currently targets these external routes:

| Method | Route | Use |
| --- | --- | --- |
| `GET` | `/movies?search=&filter=&sortBy=&offset=&limit=` | Server-side catalogue query and pagination |
| `GET` | `/movies/:id` | Movie detail, including direct links |
| `POST` | `/me/login` | Sign in; expected response includes a user and session token |
| `POST` | `/me/register` | Register with name, email, and password |
| `POST` | `/me/user` | Validate a session; token is sent in the request body |
| `POST` | `/me/logout` | Request remote logout |
| `POST`, `PUT`, `DELETE` | `/movies` and `/movies/:id` | Movie management when explicitly enabled |

List/detail responses may be raw values or wrapped in `{ "data": ... }`. A movie must include a numeric `id`, string title/release date/poster/overview, string-array genres, and finite numeric runtime/rating. Empty successful mutation responses are supported where the route does not return an entity. Pagination uses `offset` and `limit`; the UI does not trust an undocumented total-count field.

The companion API contract was not available in this frontend repository for independent verification. Confirm its query parameter names, response envelopes, required movie fields, and mutation response behavior before connecting a live deployment.

## Configuration and Security

Copy `.env.example` to `.env.local` and configure:

- `VITE_API_BASE_URL`: external API origin.
- `VITE_ENABLE_AUTH`: opt in to the API's authentication UI.
- `VITE_ENABLE_MOVIE_MANAGEMENT`: opt in to management UI. This only takes effect when auth is also enabled.

Authentication and management are disabled by default. These flags and frontend route guards only control UI visibility and navigation; they are not authorization boundaries. The existing companion API has insecure authentication/session storage and unprotected movie write routes. This frontend cannot repair those server-side weaknesses. Enabling movie management against that API does not make writes secure. The frontend stores only the returned token in `localStorage`; it never stores passwords, provides token refresh, or claims secure-cookie behavior.

## Checks

```powershell
npm run build
npm run lint
npm test
npm run coverage
npm run test:e2e
```

Jest runs once by default. Coverage is collected without watch mode. `npm run test:local` remains available for interactive local development. The Playwright browser suite intercepts API requests and tests frontend behavior only; it is not full-stack security verification. Run `npx playwright install chromium` once before the browser suite on a new local machine.

Latest local Jest coverage: 81.21% statements, 64.91% branches, 79.13% functions, and 82.79% lines across 82 passing tests. Remaining gaps include broader mutation success/failure combinations and live external API compatibility; the companion API was not available for contract verification.

## Static Hosting

Build with `npm run build` and publish the generated `dist/` directory to a static host. Configure the host to serve `index.html` as the fallback for application routes such as `/movies/:id`, while continuing to serve existing static assets normally. The API is external; this repository does not contain a backend, database, proxy, or serverless function.

Live deployment requires selecting and operating a compatible API that supports the routes above, CORS for the deployed frontend origin, and secure server-side authentication/authorization before enabling management.