import { screen, fireEvent, waitFor } from '@testing-library/react';
import { MovieForm } from '../components/forms/MovieForm/MovieForm';
import { renderWithProviders } from '@/store/_mock';
import { useParams } from 'react-router-dom';

jest.mock('react-router-dom', () => ({
	...jest.requireActual('react-router-dom'),
	useParams: jest.fn(),
}));

const mockedUseParams = useParams as jest.MockedFunction<typeof useParams>;

// Set default mock to return empty object (add mode)
mockedUseParams.mockReturnValue({});

const mockResponseData = {
	data: {
		id: 2,
		title: 'New Movie',
		release_date: '2025-05-14',
		poster_path: 'https://movie.png',
		vote_average: 10,
		genres: ['Action', 'Drama'],
		runtime: 120,
		overview: 'Movie description',
	},
};

global.fetch = jest.fn().mockResolvedValue({
	ok: true,
	status: 200,
	text: async () => JSON.stringify(mockResponseData),
} as Response);

const preloadedState = {
	movies: {
		list: [
			{
				id: 1,
				title: 'Test Movie',
				genres: ['Drama'],
				overview: 'Test overview',
				release_date: '2023-01-01',
				vote_average: 8,
				runtime: 120,
				poster_path: 'https://example.com/poster.jpg',
			},
		],
		fetchedMovies: [
			{
				id: 1,
				title: 'Test Movie',
				genres: ['Drama'],
				overview: 'Test overview',
				release_date: '2023-01-01',
				vote_average: 8,
				runtime: 120,
				poster_path: 'https://example.com/poster.jpg',
			},
		],
		loading: false,
		error: null,
	},
};

describe('MovieForm Component', () => {
	describe('ADD MOVIE', () => {
		it('renders in add mode for movies/add route', () => {
			renderWithProviders(<MovieForm />, {
				preloadedState,
				route: '/movies/add',
			});

			expect(screen.getByText(/add movie/i)).toBeInTheDocument();
			expect(screen.getByPlaceholderText(/enter title/i)).toBeInTheDocument();
		});

		it('shows validation message', async () => {
			renderWithProviders(<MovieForm />, {
				preloadedState,
				route: '/movies/add',
			});

			fireEvent.change(screen.getByPlaceholderText(/enter title/i), {
				target: { value: 'New Movie' },
			});
			fireEvent.click(screen.getByText(/submit/i));
			await waitFor(() => {
				expect(screen.getByText(/ALL FIELDS ARE REQUIRED/i)).toBeInTheDocument();
			});
		});

		it('rejects an unsupported poster URL before making a request', async () => {
			renderWithProviders(<MovieForm />, { preloadedState, route: '/movies/add' });
			fireEvent.change(screen.getByPlaceholderText(/enter title/i), { target: { value: 'New Movie' } });
			fireEvent.change(screen.getByPlaceholderText(/select date/i), { target: { value: '2025-05-14' } });
			fireEvent.change(screen.getByPlaceholderText(/HTTPS:/i), { target: { value: 'ftp://movie.png' } });
			fireEvent.change(screen.getByPlaceholderText(/7.8/i), { target: { value: '7.8' } });
			fireEvent.change(screen.getByPlaceholderText(/minutes/i), { target: { value: '120' } });
			fireEvent.change(screen.getByPlaceholderText(/Movie description/i), { target: { value: 'Feature overview' } });
			fireEvent.change(screen.getByPlaceholderText(/enter genres/i), { target: { value: 'Drama' } });
			fireEvent.click(screen.getByRole('button', { name: /submit/i }));

			expect(await screen.findByRole('alert')).toHaveTextContent('Poster URL must use http or https');
			expect(global.fetch).not.toHaveBeenCalled();
			expect(screen.getByPlaceholderText(/enter title/i)).toHaveValue('New Movie');
		});

		it('shows SUCCESS notification after successful creation', async () => {
			renderWithProviders(<MovieForm />, {
				preloadedState,
				route: '/movies/add',
			});

			fireEvent.change(screen.getByPlaceholderText(/enter title/i), {
				target: { value: 'New Movie' },
			});
			fireEvent.change(screen.getByPlaceholderText(/select date/i), {
				target: { value: '2025-05-14' },
			});
			fireEvent.change(screen.getByPlaceholderText(/HTTPS:/i), {
				target: { value: 'HTTPS://movie.png' },
			});
			fireEvent.change(screen.getByPlaceholderText(/7.8/i), {
				target: { value: '10.0' },
			});
			fireEvent.change(screen.getByPlaceholderText(/minutes/i), {
				target: { value: '120' },
			});
			fireEvent.change(screen.getByPlaceholderText(/Movie description/i), {
				target: { value: 'Movie description' },
			});
			fireEvent.change(screen.getByPlaceholderText(/enter genres/i), {
				target: { value: 'Action, Drama' },
			});

			fireEvent.click(screen.getByText(/submit/i));
			await waitFor(() => {
				expect(screen.getByText(/congratulations!/i)).toBeInTheDocument();
				expect(screen.getByText(/the movie has been added successfully/i)).toBeInTheDocument();
			});
		});

		it('handles comma-separated genres correctly', async () => {
			renderWithProviders(<MovieForm />, {
				preloadedState,
				route: '/movies/add',
			});

			fireEvent.change(screen.getByPlaceholderText(/enter title/i), {
				target: { value: 'New Movie' },
			});
			fireEvent.change(screen.getByPlaceholderText(/select date/i), {
				target: { value: '2025-05-14' },
			});
			fireEvent.change(screen.getByPlaceholderText(/HTTPS:/i), {
				target: { value: 'HTTPS://movie.png' },
			});
			fireEvent.change(screen.getByPlaceholderText(/7.8/i), {
				target: { value: '10.0' },
			});
			fireEvent.change(screen.getByPlaceholderText(/minutes/i), {
				target: { value: '120' },
			});
			fireEvent.change(screen.getByPlaceholderText(/Movie description/i), {
				target: { value: 'Movie description' },
			});

			const genreInput = screen.getByPlaceholderText(/enter genres/i) as HTMLInputElement;
			fireEvent.change(genreInput, {
				target: { value: 'Action, Drama, Comedy' },
			});

			expect(genreInput.value).toBe('Action, Drama, Comedy');

			fireEvent.click(screen.getByText(/submit/i));
			await waitFor(() => {
				expect(screen.getByText(/congratulations!/i)).toBeInTheDocument();
			});
			expect(global.fetch).toHaveBeenCalledWith(
				'http://localhost:4000/movies',
				expect.objectContaining({ method: 'POST' })
			);
			expect(JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body)).toEqual({
				title: 'New Movie',
				release_date: '2025-05-14',
				poster_path: 'HTTPS://movie.png',
				vote_average: 10,
				runtime: 120,
				overview: 'Movie description',
				genres: ['Action', 'Drama', 'Comedy'],
			});
		});
	});

	describe('EDIT MOVIE', () => {
		beforeEach(() => {
			mockedUseParams.mockReturnValue({ movieId: '1' });
		});

		afterEach(() => {
			jest.clearAllMocks();
		});

		it('renders in edit mode for movies/edit/:movieId route', () => {
			renderWithProviders(<MovieForm />, {
				preloadedState,
			});

			expect(screen.getByText(/edit movie/i)).toBeInTheDocument();
		});

		it('saves edits through PUT and updates Redux with the returned movie', async () => {
			const updated = { ...preloadedState.movies.list[0], title: 'Updated title' };
			(global.fetch as jest.Mock).mockResolvedValueOnce({
				ok: true,
				status: 200,
				text: async () => JSON.stringify(updated),
			});
			const { store } = renderWithProviders(<MovieForm />, { preloadedState });
			fireEvent.change(screen.getByDisplayValue('Test Movie'), { target: { value: 'Updated title' } });
			fireEvent.click(screen.getByRole('button', { name: /submit/i }));
			await screen.findByText(/congratulations/i);
			expect(global.fetch).toHaveBeenCalledWith(
				'http://localhost:4000/movies/1',
				expect.objectContaining({ method: 'PUT' })
			);
			expect(JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body)).toEqual(updated);
			expect(store.getState().movies.list[0]).toEqual(updated);
		});

		it('preserves input and the original Redux movie after a failed edit', async () => {
			(global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 403 });
			const { store } = renderWithProviders(<MovieForm />, { preloadedState });
			fireEvent.change(screen.getByDisplayValue('Test Movie'), { target: { value: 'Unsaved title' } });
			fireEvent.click(screen.getByRole('button', { name: /submit/i }));
			expect(await screen.findByRole('alert')).toHaveTextContent('not allowed');
			expect(screen.getByDisplayValue('Unsaved title')).toBeInTheDocument();
			expect(store.getState().movies.list[0]).toEqual(preloadedState.movies.list[0]);
			expect(screen.queryByText(/congratulations/i)).not.toBeInTheDocument();
		});

		it('pre-fills form with existing movie data', () => {
			renderWithProviders(<MovieForm />, {
				preloadedState,
			});

			const titleInput = screen.getByDisplayValue('Test Movie') as HTMLInputElement;
			expect(titleInput).toBeInTheDocument();

			const genreInput = screen.getByDisplayValue('Drama') as HTMLInputElement;
			expect(genreInput).toBeInTheDocument();
		});
	});
});
