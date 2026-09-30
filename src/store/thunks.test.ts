import { configureStore } from '@reduxjs/toolkit';
import moviesReducer from './moviesSlice';
import userReducer from './userSlice';
import {
	addMovieThunk,
	fetchMovieByIdThunk,
	fetchMoviesThunk,
	getUserThunk,
	loginUserThunk,
	logoutUserThunk,
} from './thunks';

const testMovie: Movie = {
	id: 72,
	title: 'Test Feature',
	release_date: '2025-04-12',
	poster_path: 'https://images.example.test/poster.jpg',
	overview: 'A feature for request tests.',
	genres: ['Drama'],
	runtime: 104,
	vote_average: 7.4,
};

const response = (body: unknown, status = 200): Response =>
	({ ok: status >= 200 && status < 300, status, text: async () => JSON.stringify(body) }) as Response;

const makeStore = () =>
	configureStore({
		reducer: { movies: moviesReducer, user: userReducer },
	});

describe('API thunks and Redux integration', () => {
	beforeEach(() => {
		global.fetch = jest.fn();
	});

	it('requests the selected server-side page and appends it to the catalogue', async () => {
		const store = makeStore();
		const firstPage = Array.from({ length: 20 }, (_, index) => ({ ...testMovie, id: index + 1 }));
		const nextMovie = { ...testMovie, id: 21 };
		(global.fetch as jest.Mock)
			.mockResolvedValueOnce(response({ data: firstPage }))
			.mockResolvedValueOnce(response({ data: [nextMovie] }));
		await store.dispatch(
			fetchMoviesThunk({ search: 'feature', filter: 'Drama', sortBy: 'title', offset: 0, limit: 20 })
		);
		await store.dispatch(
			fetchMoviesThunk({ search: 'feature', filter: 'Drama', sortBy: 'title', offset: 20, limit: 20 })
		);

		const requestedUrl = new URL((global.fetch as jest.Mock).mock.calls[1][0]);
		expect(requestedUrl.pathname).toBe('/movies');
		expect(requestedUrl.searchParams.get('search')).toBe('feature');
		expect(requestedUrl.searchParams.get('filter')).toBe('Drama');
		expect(requestedUrl.searchParams.get('sortBy')).toBe('title');
		expect(requestedUrl.searchParams.get('offset')).toBe('20');
		expect(store.getState().movies.list).toHaveLength(21);
		expect(store.getState().movies.list[store.getState().movies.list.length - 1]).toEqual(nextMovie);
		expect(store.getState().movies.hasMore).toBe(false);
	});

	it('loads a direct detail URL without relying on the catalogue list', async () => {
		const store = makeStore();
		(global.fetch as jest.Mock).mockResolvedValueOnce(response({ data: testMovie }));
		await store.dispatch(fetchMovieByIdThunk('72')).unwrap();
		expect(store.getState().movies.list).toEqual([]);
		expect(store.getState().movies.detail).toEqual(testMovie);
		expect((global.fetch as jest.Mock).mock.calls[0][0]).toBe('http://localhost:4000/movies/72');
	});

	it('rejects invalid list data instead of treating it as an empty success', async () => {
		const store = makeStore();
		(global.fetch as jest.Mock).mockResolvedValueOnce(response({ data: [{ id: 72 }] }));
		await expect(
			store.dispatch(fetchMoviesThunk({ search: '', filter: 'all', sortBy: 'title', offset: 0, limit: 20 })).unwrap()
		).rejects.toMatch(/invalid movie list/i);
		expect(store.getState().movies.list).toEqual([]);
	});

	it('rejects 401 login and never stores a token', async () => {
		const store = makeStore();
		(global.fetch as jest.Mock).mockResolvedValueOnce(response({ message: 'No access' }, 401));
		await expect(
			store.dispatch(loginUserThunk({ email: 'a@example.test', password: 'not-persisted' })).unwrap()
		).rejects.toMatch(/sign in again/i);
		expect(localStorage.getItem('token')).toBeNull();
		expect(localStorage.getItem('user')).toBeNull();
		expect(store.getState().user.isAuth).toBe(false);
	});

	it('stores only the session token after a valid login response', async () => {
		const store = makeStore();
		(global.fetch as jest.Mock).mockResolvedValueOnce(
			response({ data: { email: 'viewer@example.test', name: 'Viewer', role: 'user', token: 'session-token' } })
		);
		await store.dispatch(loginUserThunk({ email: 'viewer@example.test', password: 'temporary-password' })).unwrap();
		expect(localStorage.getItem('token')).toBe('session-token');
		expect(localStorage.getItem('user')).toBeNull();
		expect(store.getState().user.isAuth).toBe(true);
	});

	it('clears an invalid restored session after current-user validation', async () => {
		const store = makeStore();
		localStorage.setItem('token', 'expired-token');
		(global.fetch as jest.Mock).mockResolvedValueOnce(response({}, 401));
		await expect(store.dispatch(getUserThunk({ token: 'expired-token' })).unwrap()).rejects.toMatch(/sign in again/i);
		expect(JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body)).toEqual({ token: 'expired-token' });
		expect(localStorage.getItem('token')).toBeNull();
		expect(store.getState().user.isAuth).toBe(false);
		expect(store.getState().user.loading).toBe(false);
	});

	it('distinguishes forbidden access and keeps local logout reliable when remote logout fails', async () => {
		const store = makeStore();
		localStorage.setItem('token', 'expired-token');
		(global.fetch as jest.Mock).mockResolvedValueOnce(response({}, 403));
		await expect(store.dispatch(getUserThunk({ token: 'expired-token' })).unwrap()).rejects.toMatch(/not allowed/i);
		expect(localStorage.getItem('token')).toBeNull();

		localStorage.setItem('token', 'session-token');
		(global.fetch as jest.Mock).mockResolvedValueOnce(response({}, 503));
		const action = await store.dispatch(logoutUserThunk());
		expect(action.meta.requestStatus).toBe('fulfilled');
		expect(localStorage.getItem('token')).toBeNull();
		expect(store.getState().user.isAuth).toBe(false);
		expect(store.getState().user.error).toMatch(/503/);
	});

	it('does not add a movie after a forbidden mutation', async () => {
		const store = makeStore();
		(global.fetch as jest.Mock).mockResolvedValueOnce(response({}, 403));
		await expect(
			store
				.dispatch(
					addMovieThunk({
						title: testMovie.title,
						release_date: testMovie.release_date,
						poster_path: testMovie.poster_path,
						overview: testMovie.overview,
						genres: testMovie.genres,
						runtime: testMovie.runtime,
						vote_average: testMovie.vote_average,
					})
				)
				.unwrap()
		).rejects.toMatch(/not allowed/i);
		expect(store.getState().movies.list).toEqual([]);
	});
});
