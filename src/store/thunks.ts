import { createAsyncThunk } from '@reduxjs/toolkit';
import type { LoginCredentials, MovieCreatePayload, MovieUpdatePayload, MoviesPage, MoviesQuery } from '@/types';
import {
	ApiError,
	apiRequest,
	authEnabled,
	movieManagementEnabled,
	requireMovie,
	requireMovies,
	requireUser,
} from '@/services/api';
import { clearSessionToken, readSessionToken, saveSessionToken } from '@/services/session';

const jsonHeaders = { 'Content-Type': 'application/json' };
type RejectConfig = { rejectValue: string };
const authenticatedHeaders = (): Record<string, string> => {
	const token = readSessionToken();
	return token ? { ...jsonHeaders, Authorization: `Bearer ${token}` } : jsonHeaders;
};

export const fetchMoviesThunk = createAsyncThunk<MoviesPage, MoviesQuery, RejectConfig>(
	'movies/fetchMovies',
	async (query, { rejectWithValue, signal }) => {
		try {
			const params = new URLSearchParams({
				offset: String(query.offset),
				limit: String(query.limit),
			});
			if (query.search) params.set('search', query.search);
			if (query.filter && query.filter !== 'all') params.set('filter', query.filter);
			if (query.sortBy) params.set('sortBy', query.sortBy);
			const movies = requireMovies(await apiRequest<unknown>(`/movies?${params}`, { signal }));
			return { items: movies, hasMore: movies.length === query.limit };
		} catch (error) {
			return rejectWithValue(error instanceof Error ? error.message : 'The movie service is unavailable.');
		}
	}
);

export const fetchMovieByIdThunk = createAsyncThunk<Movie, string, RejectConfig>(
	'movies/fetchMovieById',
	async (id, { rejectWithValue, signal }) => {
		try {
			return requireMovie(await apiRequest<unknown>(`/movies/${encodeURIComponent(id)}`, { signal }));
		} catch (error) {
			return rejectWithValue(error instanceof Error ? error.message : 'The movie could not be loaded.');
		}
	}
);

export const addMovieThunk = createAsyncThunk<Movie, MovieCreatePayload, RejectConfig>(
	'movies/addMovie',
	async (movie, { rejectWithValue }) => {
		try {
			if (!movieManagementEnabled) {
				throw new ApiError('Movie management is disabled. Enable it only for an API that enforces authorization.');
			}
			return requireMovie(
				await apiRequest<unknown>('/movies', {
					method: 'POST',
					headers: authenticatedHeaders(),
					body: JSON.stringify(movie),
				})
			);
		} catch (error) {
			return rejectWithValue(error instanceof Error ? error.message : 'The movie could not be added.');
		}
	}
);

export const updateMovieThunk = createAsyncThunk<Movie, MovieUpdatePayload, RejectConfig>(
	'movies/updateMovie',
	async (movie, { rejectWithValue }) => {
		try {
			if (!movieManagementEnabled) {
				throw new ApiError('Movie management is disabled. Enable it only for an API that enforces authorization.');
			}
			const response = await apiRequest<unknown>(`/movies/${movie.id}`, {
				method: 'PUT',
				headers: authenticatedHeaders(),
				body: JSON.stringify(movie),
			});
			return response === undefined ? movie : requireMovie(response);
		} catch (error) {
			return rejectWithValue(error instanceof Error ? error.message : 'The movie could not be updated.');
		}
	}
);

export const deleteMovieThunk = createAsyncThunk<number, number, RejectConfig>(
	'movies/deleteMovie',
	async (id, { rejectWithValue }) => {
		try {
			if (!movieManagementEnabled) {
				throw new ApiError('Movie management is disabled. Enable it only for an API that enforces authorization.');
			}
			await apiRequest<unknown>(`/movies/${id}`, { method: 'DELETE', headers: authenticatedHeaders() });
			return id;
		} catch (error) {
			return rejectWithValue(error instanceof Error ? error.message : 'The movie could not be deleted.');
		}
	}
);

export const loginUserThunk = createAsyncThunk<User, LoginCredentials, RejectConfig>(
	'user/login',
	async (credentials, { rejectWithValue }) => {
		try {
			if (!authEnabled) throw new ApiError('Authentication is disabled. Set VITE_ENABLE_AUTH=true to enable it.');
			const user = requireUser(
				await apiRequest<unknown>('/me/login', {
					method: 'POST',
					headers: jsonHeaders,
					body: JSON.stringify(credentials),
				})
			);
			if (!user.token) throw new ApiError('The authentication service did not return a session token.');
			saveSessionToken(user.token);
			return user;
		} catch (error) {
			return rejectWithValue(error instanceof Error ? error.message : 'Sign in failed. Please try again.');
		}
	}
);

export const getUserThunk = createAsyncThunk<User, { token: string }, RejectConfig>(
	'user/getUser',
	async ({ token }, { rejectWithValue, signal }) => {
		try {
			const user = requireUser(
				await apiRequest<unknown>('/me/user', {
					method: 'POST',
					headers: jsonHeaders,
					body: JSON.stringify({ token }),
					signal,
				}),
				token
			);
			return user;
		} catch (error) {
			if (
				error instanceof ApiError &&
				(error.status === 401 || error.status === 403 || error.message.includes('invalid session'))
			)
				clearSessionToken();
			return rejectWithValue(error instanceof Error ? error.message : 'The session could not be validated.');
		}
	}
);

// The registration endpoint is no longer used and has been removed.
export const logoutUserThunk = createAsyncThunk<string | undefined, void>('user/logout', async () => {
	const token = readSessionToken();
	clearSessionToken();
	let errorMessage: string | undefined;
	try {
		await apiRequest<unknown>('/me/logout', {
			method: 'POST',
			headers: token ? { ...jsonHeaders, Authorization: `Bearer ${token}` } : jsonHeaders,
		});
	} catch (error) {
		errorMessage = error instanceof Error ? error.message : 'Remote sign out failed.';
	}
	return errorMessage;
});
