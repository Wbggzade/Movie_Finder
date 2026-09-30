import { screen } from '@testing-library/react';
import { MovieDetails } from '../components/MovieDetails/MovieDetails';
import { renderWithProviders } from '@/store/_mock';

const mockMovie = {
	id: '1',
	title: 'Inception',
	overview: 'A mind-bending thriller.',
	release_date: '2010-07-16',
	poster_path: '/inception.jpg',
	genres: ['Action', 'Sci-Fi'],
	runtime: 148,
	vote_average: 8.8,
};

jest.mock('@/store/hooks', () => ({
	useAppSelector: () => mockMovie,
	useAppDispatch: () => jest.fn(),
}));

describe('MovieDetails Component', () => {
	it('renders the MovieDetails component with all required elements', () => {
		renderWithProviders(<MovieDetails />, { route: '/movies/1' });

		// Check poster
		const poster = screen.queryByAltText('Inception');
		expect(poster).toBeInTheDocument();
		expect(poster).toHaveAttribute('src', '/inception.jpg');

		// Check movie name
		expect(screen.queryByText('Inception')).toBeInTheDocument();

		// Check genre
		expect(screen.queryByText('Action & Sci-Fi')).toBeInTheDocument();

		// Check release year
		expect(screen.queryByText('2010')).toBeInTheDocument();

		// Check rating
		expect(screen.queryByText('8.8')).toBeInTheDocument();

		// Check duration
		expect(screen.queryByText('2h 28min')).toBeInTheDocument();

		// Check description
		expect(screen.queryByText('A mind-bending thriller.')).toBeInTheDocument();
	});
});
