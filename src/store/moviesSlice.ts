import { createSlice } from '@reduxjs/toolkit';
import { fetchMoviesThunk, fetchMovieByIdThunk, deleteMovieThunk, addMovieThunk, updateMovieThunk } from './thunks';

export interface MoviesState {
	list: Movie[];
	loading: boolean;
	error: null | string;
	hasMore: boolean;
	detail: Movie | null;
	detailLoading: boolean;
	detailError: string | null;
	currentRequestId: string | null;
	genres: string[];
}

// this InitialState is required to be used in the slice. Please add any keys but don't delete any existing ones

const initialState: MoviesState = {
	list: [], // list of movies to be displayed in the app
	loading: false, // set to true when fetching movies, set to false when done
	error: null, // set to an error message if there is an error while fetching movies
	hasMore: false,
	detail: null,
	detailLoading: false,
	detailError: null,
	currentRequestId: null,
	genres: [],
};

const moviesSlice = createSlice({
	name: 'movies',
	initialState,
	reducers: {},
	extraReducers: (builder) => {
		builder
			.addCase(fetchMoviesThunk.pending, (state: MoviesState, action) => {
				state.loading = true;
				state.error = null;
				state.currentRequestId = action.meta.requestId;
			})
			.addCase(fetchMoviesThunk.fulfilled, (state: MoviesState, action) => {
				if (state.currentRequestId !== action.meta.requestId) return;
				state.loading = false;
				state.currentRequestId = null;
				state.list =
					action.meta.arg.offset === 0
						? action.payload.items
						: [
								...state.list,
								...action.payload.items.filter((movie) => !state.list.some((item) => item.id === movie.id)),
							];
				state.hasMore = action.payload.hasMore;
				if (action.payload.genres) {
					state.genres = action.payload.genres;
				} else if (action.meta.arg.filter === 'all') {
					state.genres = Array.from(
						new Set([...state.genres, ...action.payload.items.flatMap((movie) => movie.genres)])
					);
				}
			})
			.addCase(fetchMoviesThunk.rejected, (state: MoviesState, action) => {
				if (state.currentRequestId !== action.meta.requestId) return;
				state.loading = false;
				state.currentRequestId = null;
				if (!action.meta.aborted) state.error = action.payload ?? action.error.message ?? 'Failed to fetch movies';
			})
			.addCase(fetchMovieByIdThunk.pending, (state: MoviesState) => {
				state.detailLoading = true;
				state.detailError = null;
			})
			.addCase(fetchMovieByIdThunk.fulfilled, (state: MoviesState, action) => {
				state.detailLoading = false;
				state.detail = action.payload;
			})
			.addCase(fetchMovieByIdThunk.rejected, (state: MoviesState, action) => {
				state.detailLoading = false;
				state.detailError = action.payload ?? action.error.message ?? 'The movie could not be loaded.';
			})
			.addCase(deleteMovieThunk.fulfilled, (state: MoviesState, action) => {
				state.list = state.list.filter((movie) => movie.id !== action.payload);
			})
			.addCase(deleteMovieThunk.rejected, (state: MoviesState, action) => {
				state.error = action.payload ?? action.error.message ?? 'Failed to delete movie';
			})
			.addCase(addMovieThunk.fulfilled, (state: MoviesState, action) => {
				state.list.push(action.payload);
			})
			.addCase(updateMovieThunk.fulfilled, (state: MoviesState, action) => {
				if (state.detail?.id === action.payload.id) state.detail = action.payload;
				const index = state.list.findIndex((movie) => movie.id === action.payload.id);
				if (index !== -1) {
					state.list[index] = action.payload;
				}
			})
			.addCase(addMovieThunk.rejected, (state: MoviesState, action) => {
				state.error = action.payload ?? action.error.message ?? 'Failed to add movie';
			})
			.addCase(updateMovieThunk.rejected, (state: MoviesState, action) => {
				state.error = action.payload ?? action.error.message ?? 'Failed to update movie';
			});
	},
});

export default moviesSlice.reducer;
