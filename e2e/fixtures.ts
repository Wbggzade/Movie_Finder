import { test as base, expect } from '@playwright/test';

export const movies = [
	{
		id: 101,
		title: 'Arrival',
		release_date: '2016-11-11',
		poster_path: '/poster-unavailable.svg',
		overview: 'A linguist works to communicate with visitors from beyond Earth.',
		genres: ['Drama', 'Science Fiction'],
		runtime: 116,
		vote_average: 7.9,
	},
	{
		id: 102,
		title: 'Interstellar',
		release_date: '2014-11-07',
		poster_path: '/poster-unavailable.svg',
		overview: 'Explorers travel beyond this world to secure humanity’s future.',
		genres: ['Adventure', 'Action', 'Science Fiction'],
		runtime: 169,
		vote_average: 8.7,
	},
];

type ApiFixture = {
	items: typeof movies;
	listRequests: URL[];
	failNextList: boolean;
	invalidNextList: boolean;
};

const genres = [
	{ id: 18, name: 'Drama' },
	{ id: 878, name: 'Science Fiction' },
	{ id: 12, name: 'Adventure' },
	{ id: 28, name: 'Action' },
	{ id: 35, name: 'Comedy' },
];
const summary = (movie: (typeof movies)[number]) => ({
	...movie,
	poster_path: null,
	genres: undefined,
	runtime: undefined,
	genre_ids: genres.filter((genre) => movie.genres.includes(genre.name)).map((genre) => genre.id),
});

// Run the real frontend and replace only the external HTTP boundary.
export const test = base.extend<{ api: ApiFixture }>({
	api: async ({ page }, provide) => {
		const api: ApiFixture = {
			items: structuredClone(movies),
			listRequests: [],
			failNextList: false,
			invalidNextList: false,
		};
		await page.route(/^https:\/\/(api\.themoviedb\.org|movie-finder-api\.test)\//, async (route) => {
			const url = new URL(route.request().url());
			const method = route.request().method();
			if (url.pathname === '/3/genre/movie/list') {
				await route.fulfill({ json: { genres } });
				return;
			}
			if (['/3/discover/movie', '/3/search/movie'].includes(url.pathname) && method === 'GET') {
				api.listRequests.push(url);
				if (api.failNextList) {
					api.failNextList = false;
					await route.fulfill({ status: 503, json: { message: 'Temporarily unavailable' } });
					return;
				}
				if (api.invalidNextList) {
					api.invalidNextList = false;
					await route.fulfill({ json: { results: [{ id: 101 }], total_pages: 1 } });
					return;
				}
				const search = url.searchParams.get('query')?.toLowerCase() ?? '';
				const filter = genres.find((genre) => String(genre.id) === url.searchParams.get('with_genres'))?.name;
				const offset = (Number(url.searchParams.get('page') ?? 1) - 1) * 20;
				const limit = 20;
				const results = api.items
					.filter((movie) => !search || movie.title.toLowerCase().includes(search))
					.filter((movie) => !filter || movie.genres.includes(filter))
					.sort((left, right) =>
						url.searchParams.get('sort_by') === 'title.asc'
							? left.title.localeCompare(right.title)
							: left.release_date.localeCompare(right.release_date)
					);
				await route.fulfill({
					json: {
						results: results.slice(offset, offset + limit).map(summary),
						total_pages: Math.ceil(results.length / 20),
						total_results: results.length,
						page: offset / 20 + 1,
					},
				});
				return;
			}
			const match = url.pathname.match(/^\/3\/movie\/(\d+)$/);
			if (match && method === 'GET') {
				const movie = api.items.find((item) => item.id === Number(match[1]));
				await route.fulfill(
					movie
						? {
								json: {
									...movie,
									poster_path: null,
									genres: genres.filter((genre) => movie.genres.includes(genre.name)),
								},
							}
						: { status: 404, json: { message: 'Not found' } }
				);
				return;
			}
			if (url.pathname === '/me/login' && method === 'POST') {
				await route.fulfill({ status: 401, json: { message: 'Invalid email or password' } });
				return;
			}
			await route.fulfill({ status: 404, json: { message: 'Unmocked API request' } });
		});
		await provide(api);
	},
});

export { expect };
