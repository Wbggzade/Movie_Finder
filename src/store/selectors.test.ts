import { configureStore } from '@reduxjs/toolkit';
import moviesReducer from './moviesSlice';
import userReducer from './userSlice';
import { selectIsAdmin, selectMovieById } from './selectors';

const store = () => configureStore({ reducer: { movies: moviesReducer, user: userReducer } });

describe('store selectors', () => {
	it('requires an authenticated admin session for management capability', () => {
		const testStore = store();
		testStore.dispatch({
			type: 'user/login/fulfilled',
			payload: { email: 'admin@example.test', name: 'Admin', role: 'admin', token: 'session-token' },
		});
		expect(selectIsAdmin(testStore.getState())).toBe(true);

		testStore.dispatch({ type: 'user/logout/pending' });
		expect(selectIsAdmin(testStore.getState())).toBe(false);
	});

	it('finds a directly loaded detail when it is outside the current catalogue page', () => {
		const testStore = store();
		const movie: Movie = {
			id: 88,
			title: 'Independent Detail',
			release_date: '2024-01-01',
			poster_path: 'https://images.example.test/poster.jpg',
			overview: 'Loaded by identifier.',
			genres: ['Drama'],
			runtime: 99,
			vote_average: 8,
		};
		testStore.dispatch({ type: 'movies/fetchMovieById/fulfilled', payload: movie });
		expect(selectMovieById('88')(testStore.getState())).toEqual(movie);
		expect(selectMovieById('404')(testStore.getState())).toBeUndefined();
	});
});
