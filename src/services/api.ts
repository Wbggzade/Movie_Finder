export class ApiError extends Error {
	status?: number;

	constructor(message: string, status?: number) {
		super(message);
		this.name = 'ApiError';
		this.status = status;
	}
}

declare const __API_BASE_URL__: string;

export const apiBaseUrl = (typeof __API_BASE_URL__ === 'undefined' ? '' : __API_BASE_URL__).replace(/\/$/, '');
export const movieProvider = typeof __MOVIE_PROVIDER__ === 'undefined' ? 'tmdb' : __MOVIE_PROVIDER__;
export const authEnabled = typeof __AUTH_ENABLED__ !== 'undefined' && __AUTH_ENABLED__;
export const movieManagementEnabled =
	movieProvider === 'custom' &&
	typeof __MOVIE_MANAGEMENT_ENABLED__ !== 'undefined' &&
	__MOVIE_MANAGEMENT_ENABLED__ &&
	authEnabled;

export const apiRequest = async <T>(
	path: string,
	options: RequestInit = {},
	baseUrl = apiBaseUrl
): Promise<T | undefined> => {
	if (!baseUrl) {
		throw new ApiError('The movie service is not configured. Set VITE_API_BASE_URL and reload.');
	}

	let response: Response;
	try {
		response = await fetch(`${baseUrl}${path}`, options);
	} catch (error) {
		if (error instanceof DOMException && error.name === 'AbortError') {
			throw error;
		}
		throw new ApiError('The movie service could not be reached. Check the connection and try again.');
	}
	if (!response || typeof response.ok !== 'boolean' || typeof response.status !== 'number') {
		throw new ApiError('The movie service returned an invalid response.');
	}

	if (!response.ok) {
		const message =
			response.status === 404
				? 'The requested movie was not found.'
				: response.status === 401
					? 'Authentication is required. Please sign in again.'
					: response.status === 403
						? 'This account is not allowed to perform that action.'
						: `The movie service returned an error (${response.status}).`;
		throw new ApiError(message, response.status);
	}

	if (response.status === 204) {
		return undefined;
	}

	const text = await response.text();
	if (!text.trim()) {
		return undefined;
	}

	try {
		return JSON.parse(text) as T;
	} catch {
		throw new ApiError('The movie service returned an invalid response.');
	}
};

export const unwrapData = (response: unknown): unknown => {
	if (typeof response === 'object' && response !== null && 'data' in response) {
		return response.data;
	}
	return response;
};

export const isMovie = (value: unknown): value is Movie => {
	if (typeof value !== 'object' || value === null) return false;
	const movie = value as Record<string, unknown>;
	return (
		typeof movie.id === 'number' &&
		Number.isFinite(movie.id) &&
		typeof movie.title === 'string' &&
		typeof movie.release_date === 'string' &&
		typeof movie.poster_path === 'string' &&
		typeof movie.overview === 'string' &&
		Array.isArray(movie.genres) &&
		movie.genres.every((genre) => typeof genre === 'string') &&
		typeof movie.runtime === 'number' &&
		Number.isFinite(movie.runtime) &&
		typeof movie.vote_average === 'number' &&
		Number.isFinite(movie.vote_average)
	);
};

export const isUser = (value: unknown): value is User => {
	if (typeof value !== 'object' || value === null) return false;
	const user = value as Record<string, unknown>;
	return typeof user.email === 'string' && (user.role === undefined || user.role === 'user' || user.role === 'admin');
};

export const requireMovie = (value: unknown): Movie => {
	const movie = unwrapData(value);
	if (!isMovie(movie)) throw new ApiError('The movie service returned an invalid movie.');
	return movie;
};

export const requireMovies = (value: unknown): Movie[] => {
	const movies = unwrapData(value);
	if (!Array.isArray(movies) || !movies.every(isMovie)) {
		throw new ApiError('The movie service returned an invalid movie list.');
	}
	return movies;
};

export const requireUser = (value: unknown, token?: string): User => {
	const user = unwrapData(value);
	if (!isUser(user) || (token === undefined && typeof user.token !== 'string')) {
		throw new ApiError('The authentication service returned an invalid session.');
	}
	return { ...user, token: user.token ?? token };
};
