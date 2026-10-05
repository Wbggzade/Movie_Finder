import '@testing-library/jest-dom';

Object.assign(globalThis, {
	__MOVIE_PROVIDER__: 'custom',
	__TMDB_API_KEY__: '',
	__API_BASE_URL__: 'http://localhost:4000',
	__AUTH_ENABLED__: true,
	__MOVIE_MANAGEMENT_ENABLED__: true,
});

global.fetch = jest.fn();

afterEach(() => {
	localStorage.clear();
	jest.clearAllMocks();
});
