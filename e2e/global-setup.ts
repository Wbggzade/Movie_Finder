import { fileURLToPath } from 'node:url';
import type { FullConfig } from '@playwright/test';
import { build, preview } from 'vite';
import configureVite from '../vite.config';

export default async function globalSetup(playwright: FullConfig) {
	Object.assign(process.env, {
		VITE_MOVIE_PROVIDER: 'tmdb',
		VITE_TMDB_API_KEY: 'fixture-key',
		VITE_API_BASE_URL: 'https://movie-finder-api.test',
		VITE_ENABLE_AUTH: 'true',
		VITE_ENABLE_MOVIE_MANAGEMENT: 'false',
	});
	const root = fileURLToPath(new URL('../', import.meta.url));
	const baseURL = new URL(playwright.projects[0].use.baseURL!);
	const config = {
		...configureVite({ command: 'build', mode: 'e2e' }),
		root,
		configFile: false as const,
		mode: 'e2e',
		build: { outDir: '.e2e-dist' },
	};

	// Use the shared Vite config without its separate configuration-bundling step.
	await build(config);
	const server = await preview({
		...config,
		preview: { host: baseURL.hostname, port: Number(baseURL.port), strictPort: true },
	});

	// Own the server in this process so cleanup does not depend on Windows taskkill.
	return async () => {
		if ('closeIdleConnections' in server.httpServer) server.httpServer.closeIdleConnections();
		await new Promise<void>((resolve, reject) => {
			server.httpServer.close((error) => (error ? reject(error) : resolve()));
		});
	};
}
