import { configureStore } from '@reduxjs/toolkit';
import moviesReducer from './moviesSlice';

const movie: Movie = {
	id: 53,
	title: 'Current response',
	release_date: '2025-01-01',
	poster_path: 'https://images.example.test/movie.jpg',
	overview: 'Current result.',
	genres: ['Drama'],
	runtime: 95,
	vote_average: 7.1,
};

describe('movies reducer', () => {
	it('ignores a stale catalogue response after a newer request starts', () => {
		const store = configureStore({ reducer: { movies: moviesReducer } });
		const query = { search: '', filter: 'all', sortBy: 'title', offset: 0, limit: 20 };
		store.dispatch({ type: 'movies/fetchMovies/pending', meta: { requestId: 'newer', arg: query } });
		store.dispatch({
			type: 'movies/fetchMovies/fulfilled',
			payload: { items: [movie], hasMore: false },
			meta: { requestId: 'older', arg: query },
		});

		expect(store.getState().movies.list).toEqual([]);
		expect(store.getState().movies.loading).toBe(true);

		store.dispatch({
			type: 'movies/fetchMovies/fulfilled',
			payload: { items: [movie], hasMore: false },
			meta: { requestId: 'newer', arg: query },
		});
		expect(store.getState().movies.list).toEqual([movie]);
		expect(store.getState().movies.genres).toEqual(['Drama']);
	});
});
