import { screen, fireEvent } from '@testing-library/react';
import { Routes, Route } from 'react-router-dom';
import { MovieDetails } from '../components/MovieDetails/MovieDetails';
import { renderWithProviders } from '@/store/_mock';

const movie: Movie = {
	id: 1,
	title: 'Inception',
	overview: 'A mind-bending thriller.',
	release_date: '2010-07-16',
	poster_path: '/inception.jpg',
	genres: ['Action', 'Sci-Fi'],
	runtime: 148,
	vote_average: 8.8,
};
const renderDetails = (list: Movie[] = []) =>
	renderWithProviders(
		<Routes>
			<Route path='/movies/:movieId' element={<MovieDetails />} />
		</Routes>,
		{ route: '/movies/1', preloadedState: { movies: { list } } }
	);
it('renders complete cached details using real Redux selectors', () => {
	renderDetails([movie]);
	expect(screen.getByRole('heading', { name: 'Inception' })).toBeInTheDocument();
	expect(screen.getByAltText('Inception')).toHaveAttribute('src', '/inception.jpg');
	expect(screen.getByText('Action & Sci-Fi')).toBeInTheDocument();
	expect(screen.getByText('2h 28min')).toBeInTheDocument();
	expect(screen.getByText(movie.overview)).toBeInTheDocument();
	expect(fetch).not.toHaveBeenCalled();
});
it('loads full details when the catalogue contains only a summary', async () => {
	(global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, text: async () => JSON.stringify(movie) });
	const { store } = renderDetails([{ ...movie, runtime: 0, isSummary: true }]);
	expect(screen.getByRole('status')).toHaveTextContent('Loading movie details');
	expect(await screen.findByText('2h 28min')).toBeInTheDocument();
	expect(store.getState().movies.detail).toEqual(movie);
	expect(fetch).toHaveBeenCalledTimes(1);
});
it('shows a detail error and retries', async () => {
	(global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 503 });
	renderDetails();
	expect(await screen.findByRole('alert')).toHaveTextContent('503');
	(global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, text: async () => JSON.stringify(movie) });
	fireEvent.click(screen.getByRole('button', { name: 'RETRY' }));
	expect(await screen.findByText('2h 28min')).toBeInTheDocument();
	expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});
