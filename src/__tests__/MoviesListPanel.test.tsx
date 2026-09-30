import { screen, fireEvent } from '@testing-library/react';
import { MoviesList } from '../components/MoviesList/MoviesList';
import { renderWithProviders } from '@/store/_mock';
import * as thunks from '../store/thunks';

const fetchMoviesSpy = jest
	.spyOn(thunks, 'fetchMoviesThunk')
	.mockImplementation(() => (() => Promise.resolve({})) as unknown as ReturnType<typeof thunks.fetchMoviesThunk>);

jest.mock('../components/MoviesList/MovieTile/MovieTile', () => {
	return {
		MovieTile: ({ title }: { title: string }) => <div>{title}</div>,
	};
});

const preloadedState = {
	movies: {
		list: [
			{
				id: 1,
				title: 'Movie 1',
				genres: ['Action', 'Comedy'],
				release_date: '2023-01-01',
				poster_path: 'poster1.jpg',
				vote_average: 10,
				overview: 'overview',
				runtime: 240,
			},
			{
				id: 2,
				title: 'Movie 2',
				genres: ['Drama'],
				release_date: '2022-01-01',
				poster_path: 'poster2.jpg',
				vote_average: 10,
				overview: 'overview',
				runtime: 240,
			},
			{
				id: 3,
				title: 'Action Movie',
				genres: ['Action'],
				release_date: '2025-01-01',
				poster_path: 'poster3.jpg',
				vote_average: 10,
				overview: 'overview',
				runtime: 240,
			},
		],
		loading: false,
		error: '',
	},
};

describe('MoviesListPanel', () => {
	beforeEach(() => fetchMoviesSpy.mockClear());

	it('renders all genres including "all"', () => {
		renderWithProviders(<MoviesList />, { preloadedState });

		expect(screen.queryByText('all')).toBeInTheDocument();
		expect(screen.queryByText('Action')).toBeInTheDocument();
		expect(screen.queryByText('Comedy')).toBeInTheDocument();
		expect(screen.queryByText('Drama')).toBeInTheDocument();
	});

	it('render all movies when the "all" button is clicked', () => {
		renderWithProviders(<MoviesList />, { preloadedState });

		fireEvent.click(screen.getByText('all'));

		expect(screen.queryByText('Movie 1')).toBeInTheDocument();
		expect(screen.queryByText('Movie 2')).toBeInTheDocument();
		expect(screen.queryByText('Action Movie')).toBeInTheDocument();
	});

	it('requests the selected genre from the API', () => {
		renderWithProviders(<MoviesList />, { preloadedState });

		fireEvent.click(screen.getByRole('button', { name: /action/i }));

		expect(screen.getByText('Movie 1')).toBeInTheDocument();
		expect(screen.getByText('Movie 2')).toBeInTheDocument();
		expect(fetchMoviesSpy).toHaveBeenLastCalledWith(expect.objectContaining({ filter: 'Action' }));
	});

	it('renders the SortControl component with default option', () => {
		renderWithProviders(<MoviesList />, { preloadedState });

		expect(screen.queryByText('sort by')).toBeInTheDocument();
		expect(screen.queryByText('release date')).toBeInTheDocument();
	});

	it('toggles the dropdown menu on button click', () => {
		renderWithProviders(<MoviesList />, { preloadedState });

		const button = screen.getByText('release date');
		fireEvent.click(button);

		expect(screen.queryByText('title')).toBeInTheDocument();

		fireEvent.click(button);
		expect(screen.queryByText('title')).not.toBeInTheDocument();
	});

	it('sends sort changes to the API rather than sorting a partial page locally', () => {
		const mockedStore = {
			movies: {
				list: [
					{
						id: 1,
						title: 'Movie 1',
						genres: ['Action'],
						release_date: '2023-01-01',
						poster_path: 'poster1.jpg',
						vote_average: 10,
						overview: 'overview',
						runtime: 240,
					},
					{
						id: 2,
						title: 'Movie 2',
						genres: ['Drama'],
						release_date: '2022-01-01',
						poster_path: 'poster2.jpg',
						vote_average: 10,
						overview: 'overview',
						runtime: 240,
					},
				],
				loading: false,
				error: '',
			},
		};
		renderWithProviders(<MoviesList />, { preloadedState: mockedStore });

		const button = screen.getByText('release date');
		fireEvent.click(button);

		expect(screen.getByText('title')).toBeInTheDocument();

		const titleOption = screen.getByText(/title/i);

		fireEvent.click(titleOption);

		expect(fetchMoviesSpy).toHaveBeenLastCalledWith(expect.objectContaining({ sortBy: 'title' }));

		const titleOption1 = screen.getByText(/title/i);

		fireEvent.click(titleOption1);

		const releaseDate = screen.getByText(/release date/i);

		fireEvent.click(releaseDate);

		expect(fetchMoviesSpy).toHaveBeenLastCalledWith(expect.objectContaining({ sortBy: 'release date' }));
	});

	it('closes the dropdown menu after selecting an option', () => {
		renderWithProviders(<MoviesList />, { preloadedState });

		const button = screen.getByText('release date');
		fireEvent.click(button);

		const titleOption = screen.getByText('title');
		fireEvent.click(titleOption);

		expect(screen.queryByText('release date')).not.toBeInTheDocument();
	});
});
