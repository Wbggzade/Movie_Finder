import { expect, test, type Page } from '@playwright/test';

const movies = [
	{
		id: 101,
		title: 'Arrival',
		release_date: '2016-11-11',
		poster_path: 'https://images.example.test/arrival.jpg',
		overview: 'A linguist works to communicate with visitors from beyond Earth.',
		genres: ['Drama', 'Science Fiction'],
		runtime: 116,
		vote_average: 7.9,
	},
	{
		id: 102,
		title: 'Interstellar',
		release_date: '2014-11-07',
		poster_path: 'https://images.example.test/interstellar.jpg',
		overview: 'Explorers travel beyond this world to secure humanity’s future.',
		genres: ['Adventure', 'Action', 'Science Fiction'],
		runtime: 169,
		vote_average: 8.7,
	},
];

const installMoviesApi = async (page: Page) => {
	await page.route('https://framefinder-api.test/**', async (route) => {
		const requestUrl = new URL(route.request().url());
		if (requestUrl.pathname === '/movies' && route.request().method() === 'GET') {
			const search = requestUrl.searchParams.get('search')?.toLowerCase() ?? '';
			const filter = requestUrl.searchParams.get('filter');
			const sortBy = requestUrl.searchParams.get('sortBy');
			const offset = Number(requestUrl.searchParams.get('offset') ?? 0);
			const limit = Number(requestUrl.searchParams.get('limit') ?? 20);
			const results = movies
				.filter((movie) => !search || movie.title.toLowerCase().includes(search))
				.filter((movie) => !filter || movie.genres.includes(filter))
				.sort((left, right) =>
					sortBy === 'title'
						? left.title.localeCompare(right.title)
						: left.release_date.localeCompare(right.release_date)
				);
			await route.fulfill({ json: { data: results.slice(offset, offset + limit) } });
			return;
		}

		const detailMatch = requestUrl.pathname.match(/^\/movies\/(\d+)$/);
		if (detailMatch && route.request().method() === 'GET') {
			const movie = movies.find((candidate) => candidate.id === Number(detailMatch[1]));
			await route.fulfill(movie ? { json: { data: movie } } : { status: 404, json: { message: 'Not found' } });
			return;
		}

		if (requestUrl.pathname === '/me/login' && route.request().method() === 'POST') {
			await route.fulfill({ status: 401, json: { message: 'Invalid email or password' } });
			return;
		}

		await route.fulfill({ status: 404, json: { message: 'Unmocked API request' } });
	});
};

test('search and filter navigation keeps query state in the URL', async ({ page }) => {
	await installMoviesApi(page);
	await page.goto('/movies');
	await expect(page.getByRole('link', { name: /arrival/i })).toBeVisible();
	await expect(page.getByRole('link', { name: /interstellar/i })).toBeVisible();

	await page.getByRole('textbox', { name: 'Search movies' }).fill('Inter');
	await page.getByRole('button', { name: 'SEARCH' }).click();
	await expect(page).toHaveURL(/search=Inter/);
	await expect(page.getByRole('link', { name: /interstellar/i })).toBeVisible();
	await expect(page.getByRole('link', { name: /arrival/i })).toHaveCount(0);

	await page.getByRole('button', { name: 'Action' }).click();
	await expect(page).toHaveURL(/search=Inter.*filter=Action/);
	await expect(page.getByRole('link', { name: /interstellar/i })).toBeVisible();

	await page.goBack();
	await expect(page).toHaveURL(/search=Inter/);
	await expect(page.getByRole('textbox', { name: 'Search movies' })).toHaveValue('Inter');
	await page.goBack();
	await expect(page).toHaveURL(/\/movies$/);
	await expect(page.getByRole('textbox', { name: 'Search movies' })).toHaveValue('');
});

test('a direct detail URL loads independently from the catalogue page', async ({ page }) => {
	await installMoviesApi(page);
	await page.goto('/movies/101?search=Arrival&sortBy=title');
	await expect(page.getByRole('dialog')).toBeVisible();
	await expect(page.getByRole('dialog').getByRole('heading', { name: 'Arrival' })).toBeVisible();
	await expect(page.getByText(/linguist works to communicate/i)).toBeVisible();
});

test('authentication failure stays on the login form and preserves input', async ({ page }) => {
	await installMoviesApi(page);
	await page.goto('/login');
	await page.getByRole('textbox', { name: 'EMAIL' }).fill('viewer@example.test');
	await page.getByLabel('PASSWORD').fill('incorrect-password');
	await page.getByRole('button', { name: 'LOGIN' }).click();

	await expect(page.getByRole('alert')).toContainText('Authentication is required');
	await expect(page).toHaveURL(/\/login$/);
	await expect(page.getByRole('textbox', { name: 'EMAIL' })).toHaveValue('viewer@example.test');
});
