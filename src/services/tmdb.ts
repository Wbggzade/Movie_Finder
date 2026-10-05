import { ApiError, apiRequest } from './api';
import type { MoviesPage, MoviesQuery } from '@/types';

type Genre = { id: number; name: string };
type RecordValue = Record<string, unknown>;
const record = (value: unknown): value is RecordValue => typeof value === 'object' && value !== null;
const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const invalid = () => new ApiError('TMDB returned invalid movie data. Please try again.');

const parseGenres = (value: unknown): Genre[] => {
	if (
		!Array.isArray(value) ||
		!value.every((item) => record(item) && finite(item.id) && typeof item.name === 'string')
	) {
		throw invalid();
	}
	return value as Genre[];
};

const toMovie = (value: unknown, genres: Genre[], summary: boolean): Movie => {
	if (
		!record(value) ||
		!finite(value.id) ||
		typeof value.title !== 'string' ||
		typeof value.overview !== 'string' ||
		typeof value.release_date !== 'string' ||
		!finite(value.vote_average) ||
		(value.poster_path !== null && typeof value.poster_path !== 'string')
	)
		throw invalid();
	let names: string[];
	if (summary) {
		if (!Array.isArray(value.genre_ids) || !value.genre_ids.every(finite)) throw invalid();
		names = genres.filter((genre) => (value.genre_ids as number[]).includes(genre.id)).map((genre) => genre.name);
	} else {
		names = parseGenres(value.genres).map((genre) => genre.name);
		if (value.runtime !== null && !finite(value.runtime)) throw invalid();
	}
	return {
		id: value.id,
		title: value.title,
		overview: value.overview,
		release_date: value.release_date,
		vote_average: value.vote_average,
		genres: names,
		poster_path: value.poster_path ? `https://image.tmdb.org/t/p/w500${value.poster_path}` : '/poster-unavailable.svg',
		runtime: summary ? 0 : ((value.runtime as number | null) ?? 0),
		isSummary: summary,
	};
};

// Each client owns a small, short-lived search cache. Aborted/partial searches are never cached.
export const createTmdbClient = (key: string) => {
	let genreCache: Genre[] | undefined;
	const searchCache = new Map<string, { items: Movie[]; expires: number }>();
	const request = async (path: string, params: Record<string, string>, signal: AbortSignal) => {
		if (!key.trim()) throw new ApiError('Set VITE_TMDB_API_KEY in .env.local and restart the app to load movies.');
		const query = new URLSearchParams({ ...params, api_key: key, language: 'en-US' });
		try {
			return await apiRequest<unknown>(`${path}?${query}`, { signal }, 'https://api.themoviedb.org/3');
		} catch (error) {
			if (error instanceof ApiError && error.status === 401)
				throw new ApiError('TMDB rejected the API key. Check VITE_TMDB_API_KEY and restart the app.', 401);
			if (error instanceof ApiError && error.status === 429)
				throw new ApiError('TMDB is rate limiting requests. Wait a moment and try again.', 429);
			throw error;
		}
	};
	const getGenres = async (signal: AbortSignal) => {
		if (!genreCache) {
			const result = await request('/genre/movie/list', {}, signal);
			if (!record(result)) throw invalid();
			genreCache = parseGenres(result.genres);
		}
		return genreCache;
	};
	const page = async (path: string, params: Record<string, string>, genres: Genre[], signal: AbortSignal) => {
		const result = await request(path, params, signal);
		if (
			!record(result) ||
			!Array.isArray(result.results) ||
			!Number.isInteger(result.total_pages) ||
			!finite(result.total_pages) ||
			result.total_pages < 0
		)
			throw invalid();
		return { items: result.results.map((item) => toMovie(item, genres, true)), pages: result.total_pages };
	};
	return {
		async list(query: MoviesQuery, signal: AbortSignal): Promise<MoviesPage> {
			if (query.limit !== 20 || query.offset < 0 || query.offset % 20 !== 0)
				throw new ApiError('TMDB pages require a limit of 20 and an aligned offset.');
			const genres = await getGenres(signal);
			const genreNames = genres.map((genre) => genre.name);
			const genre = genres.find((item) => item.name === query.filter);
			if (query.filter && query.filter !== 'all' && !genre) return { items: [], hasMore: false, genres: genreNames };
			const search = query.search.trim();
			if (!search) {
				const number = query.offset / 20 + 1;
				if (number > 500)
					throw new ApiError('TMDB limits discovery to 500 pages. Narrow the catalogue with a search or genre.');
				const result = await page(
					'/discover/movie',
					{
						page: String(number),
						include_adult: 'false',
						sort_by: query.sortBy === 'title' ? 'title.asc' : 'primary_release_date.asc',
						...(genre ? { with_genres: String(genre.id) } : {}),
					},
					genres,
					signal
				);
				return { items: result.items, hasMore: number < Math.min(result.pages, 500), genres: genreNames };
			}
			let cached = searchCache.get(search);
			if (!cached || cached.expires <= Date.now()) {
				const first = await page('/search/movie', { query: search, page: '1', include_adult: 'false' }, genres, signal);
				// Do not silently sort/filter only one page of a broader search.
				if (first.pages > 50)
					throw new ApiError(
						'This search has more than 1,000 results. ' +
							'Enter a more specific movie title to sort and filter the complete results.'
					);
				const items = [...first.items];
				for (let next = 2; next <= first.pages; next += 3) {
					const pages = await Promise.all(
						Array.from({ length: Math.min(3, first.pages - next + 1) }, (_, index) =>
							page(
								'/search/movie',
								{ query: search, page: String(next + index), include_adult: 'false' },
								genres,
								signal
							)
						)
					);
					items.push(...pages.flatMap((result) => result.items));
				}
				if (signal.aborted) throw new DOMException('Cancelled', 'AbortError');
				cached = {
					items: [...new Map(items.map((movie) => [movie.id, movie])).values()],
					expires: Date.now() + 300_000,
				};
				if (searchCache.size >= 3) searchCache.delete(searchCache.keys().next().value!);
				searchCache.set(search, cached);
			}
			const items = cached.items
				.filter((movie) => !genre || movie.genres.includes(genre.name))
				.sort(
					(a, b) =>
						(query.sortBy === 'title'
							? a.title.localeCompare(b.title, 'en')
							: a.release_date.localeCompare(b.release_date)) || a.id - b.id
				);
			return {
				items: items.slice(query.offset, query.offset + query.limit),
				hasMore: query.offset + query.limit < items.length,
				genres: genreNames,
			};
		},
		async detail(id: string, signal: AbortSignal): Promise<Movie> {
			return toMovie(await request(`/movie/${encodeURIComponent(id)}`, {}, signal), [], false);
		},
	};
};

export const tmdb = createTmdbClient(typeof __TMDB_API_KEY__ === 'undefined' ? '' : __TMDB_API_KEY__);
