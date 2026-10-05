import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), 'VITE_');
	return {
		plugins: [react(), tsconfigPaths()],
		define: {
			__MOVIE_PROVIDER__: JSON.stringify(env.VITE_MOVIE_PROVIDER ?? 'tmdb'),
			__TMDB_API_KEY__: JSON.stringify(env.VITE_TMDB_API_KEY ?? ''),
			__API_BASE_URL__: JSON.stringify(env.VITE_API_BASE_URL ?? ''),
			__AUTH_ENABLED__: JSON.stringify(env.VITE_ENABLE_AUTH === 'true'),
			__MOVIE_MANAGEMENT_ENABLED__: JSON.stringify(env.VITE_ENABLE_MOVIE_MANAGEMENT === 'true'),
		},
	};
});
