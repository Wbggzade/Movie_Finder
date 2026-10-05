import { createTmdbClient } from './tmdb';

const genres = [
	{ id: 18, name: 'Drama' },
	{ id: 28, name: 'Action' },
];
const movie = {
	id: 1,
	title: 'Zulu',
	release_date: '2020-01-01',
	overview: 'A film.',
	poster_path: null,
	vote_average: 7,
	genre_ids: [18],
};
const query = { search: '', filter: 'all', sortBy: 'title', offset: 0, limit: 20 };
const reply = (data: unknown) =>
	(global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, text: async () => JSON.stringify(data) });
const signal = () => new AbortController().signal;
beforeEach(() => (global.fetch as jest.Mock).mockReset());

it('reports missing configuration without making a request', async () => {
	await expect(createTmdbClient('').list(query, signal())).rejects.toThrow('VITE_TMDB_API_KEY');
	expect(fetch).not.toHaveBeenCalled();
});
it('maps discovery genres, sorting, pagination and missing posters', async () => {
	reply({ genres });
	reply({ results: [movie], total_pages: 3 });
	const result = await createTmdbClient('fixture-key').list({ ...query, filter: 'Drama', offset: 20 }, signal());
	const url = new URL((fetch as jest.Mock).mock.calls[1][0]);
	expect(url.pathname).toBe('/3/discover/movie');
	expect(Object.fromEntries(url.searchParams)).toMatchObject({
		page: '2',
		with_genres: '18',
		sort_by: 'title.asc',
		include_adult: 'false',
	});
	expect(result).toMatchObject({
		hasMore: true,
		genres: ['Drama', 'Action'],
		items: [{ id: 1, genres: ['Drama'], poster_path: '/poster-unavailable.svg', isSummary: true }],
	});
});
it('uses total pages rather than guessing from a full final page', async () => {
	reply({ genres });
	reply({ results: Array.from({ length: 20 }, (_, id) => ({ ...movie, id })), total_pages: 1 });
	expect((await createTmdbClient('key').list(query, signal())).hasMore).toBe(false);
});
it('sorts and filters across every search page and reuses the complete cached search', async () => {
	reply({ genres });
	reply({ results: [movie], total_pages: 2 });
	reply({ results: [{ ...movie, id: 2, title: 'Alpha', genre_ids: [28] }], total_pages: 2 });
	const client = createTmdbClient('key');
	expect((await client.list({ ...query, search: 'film' }, signal())).items.map((item) => item.title)).toEqual([
		'Alpha',
		'Zulu',
	]);
	const filtered = await client.list({ ...query, search: 'film', filter: 'Action' }, signal());
	expect(filtered.items.map((item) => item.title)).toEqual(['Alpha']);
	expect(filtered.hasMore).toBe(false);
	expect(fetch).toHaveBeenCalledTimes(3);
	expect(new URL((fetch as jest.Mock).mock.calls[2][0]).searchParams.get('page')).toBe('2');
});
it('paginates the globally sorted search', async () => {
	reply({ genres });
	reply({
		results: Array.from({ length: 20 }, (_, id) => ({ ...movie, id: id + 2, title: `Zulu ${id}` })),
		total_pages: 2,
	});
	reply({ results: [{ ...movie, title: 'Alpha' }], total_pages: 2 });
	const client = createTmdbClient('key');
	const first = await client.list({ ...query, search: 'film' }, signal());
	const second = await client.list({ ...query, search: 'film', offset: 20 }, signal());
	expect(first.items[0].title).toBe('Alpha');
	expect(first.hasMore).toBe(true);
	expect(second.hasMore).toBe(false);
	expect(new Set([...first.items, ...second.items].map((item) => item.id)).size).toBe(21);
});
it('asks for a narrower title instead of silently truncating a broad search', async () => {
	reply({ genres });
	reply({ results: [movie], total_pages: 51 });
	await expect(createTmdbClient('key').list({ ...query, search: 'the' }, signal())).rejects.toThrow('more specific');
	expect(fetch).toHaveBeenCalledTimes(2);
});
it('does not cache failed searches and successfully retries', async () => {
	reply({ genres });
	reply({ results: [movie], total_pages: 2 });
	(global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 503 });
	const client = createTmdbClient('key');
	await expect(client.list({ ...query, search: 'film' }, signal())).rejects.toThrow('503');
	reply({ results: [{ ...movie, title: 'Recovered' }], total_pages: 1 });
	expect((await client.list({ ...query, search: 'film' }, signal())).items[0].title).toBe('Recovered');
	expect(fetch).toHaveBeenCalledTimes(4);
});
it('passes cancellation through without turning it into a service error', async () => {
	const controller = new AbortController();
	controller.abort();
	(global.fetch as jest.Mock).mockRejectedValueOnce(new DOMException('Cancelled', 'AbortError'));
	await expect(createTmdbClient('key').list(query, controller.signal)).rejects.toMatchObject({ name: 'AbortError' });
	expect(fetch).toHaveBeenCalledWith(expect.any(String), { signal: controller.signal });
});
it.each([401, 429])('explains TMDB status %i', async (status) => {
	(global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status });
	await expect(createTmdbClient('key').list(query, signal())).rejects.toThrow(
		status === 401 ? 'API key' : 'rate limiting'
	);
});
it('rejects malformed results', async () => {
	reply({ genres });
	reply({ results: [{ id: 1 }], total_pages: 1 });
	await expect(createTmdbClient('key').list(query, signal())).rejects.toThrow('invalid movie data');
});
it('maps full details and nullable runtime independently of the list', async () => {
	reply({ ...movie, genres, runtime: 116, poster_path: '/poster.jpg' });
	const client = createTmdbClient('key');
	expect(await client.detail('1', signal())).toMatchObject({
		runtime: 116,
		isSummary: false,
		poster_path: 'https://image.tmdb.org/t/p/w500/poster.jpg',
	});
	reply({ ...movie, genres, runtime: null });
	expect((await client.detail('1', signal())).runtime).toBe(0);
});
