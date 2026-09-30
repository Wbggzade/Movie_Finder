import '@testing-library/jest-dom';

Object.assign(globalThis, {
	__API_BASE_URL__: 'http://localhost:4000',
	__AUTH_ENABLED__: true,
	__MOVIE_MANAGEMENT_ENABLED__: true,
});

global.fetch = jest.fn();

afterEach(() => {
	localStorage.clear();
	jest.clearAllMocks();
});
