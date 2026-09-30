import { defineConfig } from '@playwright/test';

export default defineConfig({
	testDir: './e2e',
	fullyParallel: false,
	reporter: 'list',
	use: {
		baseURL: 'http://127.0.0.1:5173',
		trace: 'retain-on-failure',
	},
	webServer: {
		command: 'npm run dev -- --host 127.0.0.1',
		url: 'http://127.0.0.1:5173',
		reuseExistingServer: !process.env.CI,
		timeout: 60_000,
		env: {
			...process.env,
			VITE_API_BASE_URL: 'https://framefinder-api.test',
			VITE_ENABLE_AUTH: 'true',
			VITE_ENABLE_MOVIE_MANAGEMENT: 'false',
		},
	},
});
