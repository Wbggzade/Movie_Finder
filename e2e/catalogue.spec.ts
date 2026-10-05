import { test, expect, movies } from './fixtures';

test.beforeEach(async ({ api }) => {
	// Install the API fixture before navigation in every scenario.
	expect(api.items).toHaveLength(2);
});

test('search, genre filtering and browser history preserve catalogue state', async ({ page }) => {
	await page.goto('/movies');
	await expect(page.getByRole('heading', { level: 3 })).toHaveText(['Interstellar', 'Arrival']);
	await page.getByRole('textbox', { name: 'Search movies' }).fill('Inter');
	await page.getByRole('button', { name: 'SEARCH', exact: true }).click();
	await expect(page).toHaveURL(/search=Inter/);
	await expect(page.getByRole('heading', { level: 3 })).toHaveText(['Interstellar']);
	await page.getByRole('button', { name: 'Action', exact: true }).click();
	await expect(page).toHaveURL(/search=Inter&filter=Action/);
	await expect(page.getByRole('heading', { level: 3 })).toHaveText(['Interstellar']);
	await page.goBack();
	await expect(page).toHaveURL(/\/movies\?search=Inter$/);
	await expect(page.getByRole('textbox', { name: 'Search movies' })).toHaveValue('Inter');
	await page.goBack();
	await expect(page).toHaveURL(/\/movies$/);
	await expect(page.getByRole('textbox', { name: 'Search movies' })).toHaveValue('');
	await expect(page.getByRole('heading', { level: 3 })).toHaveText(['Interstellar', 'Arrival']);
	await page.goForward();
	await expect(page.getByRole('heading', { level: 3 })).toHaveText(['Interstellar']);
});

test('sorting changes the visible order and survives a reload', async ({ page, api }) => {
	await page.goto('/movies');
	await expect(page.getByRole('heading', { level: 3 })).toHaveText(['Interstellar', 'Arrival']);
	await page.getByRole('button', { name: /release date/i }).click();
	await page.getByRole('button', { name: 'title', exact: true }).click();
	await expect(page).toHaveURL(/sortBy=title/);
	await expect(page.getByRole('heading', { level: 3 })).toHaveText(['Arrival', 'Interstellar']);
	expect(api.listRequests[api.listRequests.length - 1].searchParams.get('sort_by')).toBe('title.asc');
	await page.reload();
	await expect(page.getByRole('heading', { level: 3 })).toHaveText(['Arrival', 'Interstellar']);
	await page.getByRole('button', { name: /title/i }).click();
	await page.getByRole('button', { name: 'release date', exact: true }).click();
	await expect(page.getByRole('heading', { level: 3 })).toHaveText(['Interstellar', 'Arrival']);
});

test('genre selection excludes other genres and All restores the catalogue', async ({ page }) => {
	await page.goto('/movies');
	await page.getByRole('button', { name: 'Drama', exact: true }).click();
	await expect(page.getByRole('heading', { level: 3 })).toHaveText(['Arrival']);
	await page.getByRole('button', { name: 'all', exact: true }).click();
	await expect(page.getByRole('heading', { level: 3 })).toHaveText(['Interstellar', 'Arrival']);
	await expect(page).toHaveURL(/\/movies$/);
});

test('keyboard search shows an empty state and clearing it restores results', async ({ page }) => {
	await page.goto('/movies');
	const search = page.getByRole('textbox', { name: 'Search movies' });
	await search.fill('no-matching-film');
	await search.press('Enter');
	await expect(page.getByText('No movies found', { exact: true })).toBeVisible();
	await expect(page.getByRole('heading', { level: 3 })).toHaveCount(0);
	await expect(page.getByRole('button', { name: 'Load more' })).toHaveCount(0);
	await search.fill('');
	await search.press('Enter');
	await expect(page.getByRole('heading', { level: 3 })).toHaveText(['Interstellar', 'Arrival']);
});

test('load more appends the next page without duplicates and stops at the end', async ({ page, api }) => {
	api.items = Array.from({ length: 25 }, (_, index) => ({
		...movies[0],
		id: index + 1,
		title: `Film ${String(index + 1).padStart(2, '0')}`,
	}));
	await page.goto('/movies?sortBy=title');
	await expect(page.getByRole('heading', { level: 3 })).toHaveCount(20);
	await expect(page.getByText('20 movies loaded', { exact: true })).toBeVisible();
	await page.getByRole('button', { name: 'Load more', exact: true }).click();
	await expect(page.getByRole('heading', { level: 3 })).toHaveText(api.items.map((movie) => movie.title));
	await expect(page.getByText('25 movies found', { exact: true })).toBeVisible();
	await expect(page.getByRole('button', { name: 'Load more', exact: true })).toHaveCount(0);
	expect(api.listRequests.map((url) => url.searchParams.get('page'))).toEqual(['1', '2']);
});

test('a service error can be retried without reloading the page', async ({ page, api }) => {
	api.failNextList = true;
	await page.goto('/movies');
	await expect(page.getByRole('alert')).toContainText('503');
	await page.getByRole('button', { name: 'Retry', exact: true }).click();
	await expect(page.getByRole('heading', { level: 3 })).toHaveText(['Interstellar', 'Arrival']);
	await expect(page.getByRole('alert')).toHaveCount(0);
	expect(api.listRequests).toHaveLength(2);
});

test('malformed API data produces an error and a successful retry recovers', async ({ page, api }) => {
	api.invalidNextList = true;
	await page.goto('/movies');
	await expect(page.getByRole('alert')).toContainText('invalid movie data');
	await page.getByRole('button', { name: 'Retry', exact: true }).click();
	await expect(page.getByRole('heading', { level: 3 })).toHaveCount(2);
});

test('direct movie details load even when the catalogue has no matching results', async ({ page }) => {
	await page.goto('/movies/101?search=no-match&sortBy=title');
	const dialog = page.getByRole('dialog');
	await expect(dialog.getByRole('heading', { name: 'Arrival' })).toBeVisible();
	await expect(dialog.getByText(/linguist works to communicate/i)).toBeVisible();
	await expect(dialog.getByText('1h 56min')).toBeVisible();
	await page.reload();
	await expect(dialog.getByRole('heading', { name: 'Arrival' })).toBeVisible();
	await dialog.getByRole('button', { name: 'Close dialog' }).click();
	await expect(page).toHaveURL(/\/movies\?search=no-match&sortBy=title$/);
	await expect(dialog).toHaveCount(0);
});

test('movie details support keyboard focus containment and Escape dismissal', async ({ page }) => {
	await page.goto('/movies?search=Arrival');
	await page.getByRole('link', { name: /Arrival/ }).click();
	const close = page.getByRole('dialog').getByRole('button', { name: 'Close dialog' });
	await expect(close).toBeFocused();
	await page.keyboard.press('Tab');
	await expect(close).toBeFocused();
	await page.keyboard.press('Shift+Tab');
	await expect(close).toBeFocused();
	await page.keyboard.press('Escape');
	await expect(page.getByRole('dialog')).toHaveCount(0);
	await expect(page).toHaveURL(/\/movies\?search=Arrival$/);
	await expect(page.getByRole('heading', { level: 3 })).toHaveText(['Arrival']);
});

test('an unknown movie displays a not-found error and can be closed', async ({ page }) => {
	await page.goto('/movies/999?search=Arrival');
	await expect(page.getByRole('dialog').getByRole('alert')).toContainText('not found');
	await page.getByRole('button', { name: 'Close dialog' }).click();
	await expect(page).toHaveURL(/\/movies\?search=Arrival$/);
	await expect(page.getByRole('heading', { level: 3 })).toHaveText(['Arrival']);
});

test('authentication failure stays on the login form and preserves the email', async ({ page }) => {
	await page.goto('/login');
	await page.getByRole('textbox', { name: 'EMAIL' }).fill('viewer@example.test');
	await page.getByLabel('PASSWORD').fill('incorrect-password');
	await page.getByRole('button', { name: 'LOGIN', exact: true }).click();
	await expect(page.getByRole('alert')).toContainText('Authentication is required');
	await expect(page).toHaveURL(/\/login$/);
	await expect(page.getByRole('textbox', { name: 'EMAIL' })).toHaveValue('viewer@example.test');
});

test('search sorting and filtering include matches from later TMDB pages', async ({ page, api }) => {
	api.items = Array.from({ length: 25 }, (_, index) => ({
		...movies[0],
		id: index + 1,
		title: 'Film ' + String(25 - index).padStart(2, '0'),
		genres: index === 24 ? ['Action'] : ['Drama'],
	}));
	await page.goto('/movies?search=Film&sortBy=title');
	await expect(page.getByRole('heading', { level: 3 }).first()).toHaveText('Film 01');
	await expect(page.getByRole('heading', { level: 3 })).toHaveCount(20);
	await page.getByRole('button', { name: 'Action', exact: true }).click();
	await expect(page.getByRole('heading', { level: 3 })).toHaveText(['Film 01']);
	await expect(page.getByRole('button', { name: 'Load more', exact: true })).toHaveCount(0);
	expect(
		api.listRequests.filter((url) => url.pathname === '/3/search/movie').map((url) => url.searchParams.get('page'))
	).toEqual(['1', '2']);
});

test('opening a catalogue summary fetches the complete runtime', async ({ page }) => {
	await page.goto('/movies');
	await page.getByRole('link', { name: /Arrival/ }).click();
	await expect(page.getByRole('dialog').getByText('1h 56min')).toBeVisible();
});
