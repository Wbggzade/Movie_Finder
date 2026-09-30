import { ApiError, apiRequest, isMovie, requireMovies, unwrapData } from './api';

describe('api request boundary', () => {
	it('reports missing configuration without making a request', async () => {
		const fetchSpy = jest.spyOn(global, 'fetch');
		await expect(apiRequest('/movies', {}, '')).rejects.toThrow(/VITE_API_BASE_URL/);
		expect(fetchSpy).not.toHaveBeenCalled();
	});

	it('distinguishes authorization statuses', async () => {
		jest.spyOn(global, 'fetch').mockResolvedValueOnce({ ok: false, status: 401 } as Response);
		await expect(apiRequest('/movies', {}, 'https://api.example.test')).rejects.toMatchObject({ status: 401 });

		jest.spyOn(global, 'fetch').mockResolvedValueOnce({ ok: false, status: 403 } as Response);
		await expect(apiRequest('/movies', {}, 'https://api.example.test')).rejects.toMatchObject({ status: 403 });
	});

	it('accepts empty successful responses and unwraps response data', () => {
		expect(unwrapData({ data: [{ id: 1 }] })).toEqual([{ id: 1 }]);
		expect(unwrapData([{ id: 1 }])).toEqual([{ id: 1 }]);
		expect(isMovie({})).toBe(false);
		expect(new ApiError('bad', 500).status).toBe(500);
	});

	it('accepts a 204 empty response and rejects invalid movie shapes', async () => {
		jest.spyOn(global, 'fetch').mockResolvedValueOnce({ ok: true, status: 204 } as Response);
		await expect(apiRequest('/movies/1', {}, 'https://api.example.test')).resolves.toBeUndefined();
		expect(() => requireMovies({ data: [{ id: 1 }] })).toThrow(/invalid movie list/i);
	});
});
