import { screen } from '@testing-library/react';
import { MoviesList } from '../components/MoviesList/MoviesList';
import { renderWithProviders } from '@/store/_mock';
import { mockedMoviesList } from '../mockedMoviesListForTests.ts';
import * as thunks from '../store/thunks';

jest
	.spyOn(thunks, 'fetchMoviesThunk')
	.mockImplementation(() => (() => Promise.resolve({})) as unknown as ReturnType<typeof thunks.fetchMoviesThunk>);

jest.mock('../components/MoviesList/MovieTile/MovieTile', () => {
	return {
		MovieTile: ({ title }: { title: string }) => <div>{title}</div>,
	};
});

describe('MoviesList Component', () => {
	it('renders loading state', () => {
		renderWithProviders(<MoviesList />, {
			preloadedState: {
				movies: {
					list: [],
					loading: true,
					error: '',
				},
			},
		});

		expect(screen.getByText('Loading movies...')).toBeInTheDocument();
	});

	it('renders error state', () => {
		renderWithProviders(<MoviesList />, {
			preloadedState: {
				movies: {
					list: [],
					loading: false,
					error: 'Failed to fetch movies',
				},
			},
		});

		expect(screen.getByRole('alert')).toHaveTextContent('Failed to fetch movies');
	});

	it('renders movies list', () => {
		renderWithProviders(<MoviesList />, {
			preloadedState: {
				movies: {
					list: mockedMoviesList,
					loading: false,
					error: '',
				},
			},
		});

		expect(screen.getByText('Movie 1')).toBeInTheDocument();
		expect(screen.getByText('Movie 2')).toBeInTheDocument();
	});

	it('renders movieCount element with text for 2 movie', () => {
		renderWithProviders(<MoviesList />, {
			preloadedState: {
				movies: {
					list: mockedMoviesList,
					loading: false,
					error: '',
				},
			},
		});

		expect(screen.getByText('2 movies found')).toBeInTheDocument();
	});

	it('renders movieCount element with text for 1 movie', () => {
		renderWithProviders(<MoviesList />, {
			preloadedState: {
				movies: {
					list: [mockedMoviesList[0]],
					loading: false,
					error: '',
				},
			},
		});

		expect(screen.getByText('1 movie found')).toBeInTheDocument();
	});
});
