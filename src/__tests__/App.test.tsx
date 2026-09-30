import { screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';
import { renderWithProviders } from '@/store/_mock';
import { mockedMoviesList } from '../mockedMoviesListForTests.ts';
import { AppDispatch } from '@/store';
import { UserState } from '@/store/userSlice';
import * as thunks from '../store/thunks';

const mockedUserDataResponse = {
	role: 'user',
	name: 'John Doe',
	token: 'mockToken',
	email: 'John_Doe@mail.com',
	isAuth: true,
} as UserState;

describe('Search', () => {
	beforeEach(() => {
		jest.spyOn(thunks, 'fetchMoviesThunk').mockImplementation(
			(query) =>
				(async (dispatch: AppDispatch) => {
					const filteredMovies = mockedMoviesList
						.filter((movie) => !query.search || movie.title.toLowerCase().includes(query.search.toLowerCase()))
						.filter((movie) => query.filter === 'all' || movie.genres.includes(query.filter))
						.sort((left, right) =>
							query.sortBy === 'title'
								? left.title.localeCompare(right.title)
								: left.release_date.localeCompare(right.release_date)
						);
					const items = filteredMovies.slice(query.offset, query.offset + query.limit);
					dispatch({
						type: 'movies/fetchMovies/fulfilled',
						payload: { items: items as Movie[], hasMore: filteredMovies.length > query.offset + items.length },
						meta: { arg: query },
					});
				}) as unknown as ReturnType<typeof thunks.fetchMoviesThunk>
		);

		jest.spyOn(thunks, 'logoutUserThunk').mockImplementation(
			() =>
				(async (dispatch: AppDispatch) => {
					dispatch({ type: 'user/logout/fulfilled' });
				}) as unknown as ReturnType<typeof thunks.logoutUserThunk>
		);
	});

	beforeAll(() => {
		localStorage.setItem('token', 'mockToken');
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	const preloadedState = {
		movies: {
			list: mockedMoviesList,
			loading: false,
			error: null,
		},
		user: mockedUserDataResponse,
	};

	it('requests and renders the selected search from the API', async () => {
		renderWithProviders(<App />, { preloadedState });

		expect(screen.getByText('Movie 1')).toBeInTheDocument();
		expect(screen.getByText('Movie 2')).toBeInTheDocument();

		const searchInput = screen.getByPlaceholderText(/what do you want to watch/i);
		const searchButton = screen.getByRole('button', { name: /search/i });

		fireEvent.change(searchInput as HTMLInputElement, { target: { value: 'Movie 1' } });
		fireEvent.click(searchButton);

		await waitFor(() => expect(screen.getByText('Movie 1')).toBeInTheDocument());
		expect(screen.queryByText('Movie 2')).not.toBeInTheDocument();
	});

	it('requests and renders the selected genre from the API', async () => {
		renderWithProviders(<App />, { preloadedState });

		await waitFor(() => {
			expect(screen.getByText('Movie 1')).toBeInTheDocument();
			expect(screen.getByText('Movie 2')).toBeInTheDocument();
		});

		const filterButton = screen.getByRole('button', { name: /drama/i });

		fireEvent.click(filterButton);

		await waitFor(() => expect(screen.queryByText('Movie 1')).not.toBeInTheDocument());
		expect(screen.getByText('Movie 2')).toBeInTheDocument();
	});
});
