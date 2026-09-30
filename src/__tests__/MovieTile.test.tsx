import { screen, fireEvent } from '@testing-library/react';
import { MovieTile } from '../components/MoviesList/MovieTile/MovieTile.tsx';
import { renderWithProviders } from '@/store/_mock.tsx';
import { UserState } from '@/store/userSlice.ts';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
	...jest.requireActual('react-router-dom'),
	useNavigate: () => mockNavigate,
}));

const mockedRegularUser = { role: 'user', token: 'mockToken', isAuth: true, name: 'John Doe' };
const mockedAdminUser = { role: 'admin', token: 'mockToken', isAuth: true, name: 'John Doe' };

describe('MovieTile Component', () => {
	const mockProps = {
		poster_path: 'test-poster.jpg',
		title: 'Test Movie',
		genres: ['Action', 'Adventure'],
		release_date: '2023-01-01',
		id: 123,
	};

	it('renders the movie details correctly', () => {
		renderWithProviders(<MovieTile {...mockProps} />, { preloadedState: { user: mockedAdminUser as UserState } });

		expect(screen.queryByAltText('Test Movie')).toHaveAttribute('src', 'test-poster.jpg');
		expect(screen.queryByText('Test Movie')).toBeInTheDocument();
		expect(screen.queryByText('Action, Adventure')).toBeInTheDocument();
		expect(screen.queryByText('2023')).toBeInTheDocument();
	});

	it('exposes movie details as a semantic navigation link', () => {
		renderWithProviders(<MovieTile {...mockProps} />, { preloadedState: { user: mockedAdminUser as UserState } });

		expect(screen.getByRole('link', { name: /test movie/i })).toHaveAttribute('href', '/movies/123');
	});

	it('open the context menu on menu button click', () => {
		renderWithProviders(<MovieTile {...mockProps} />, { preloadedState: { user: mockedAdminUser as UserState } });

		fireEvent.click(screen.getByTestId('menu-button'));

		expect(screen.queryByTestId('context-menu')).toBeInTheDocument();
	});

	it('should render contextual menu button when user is admin', () => {
		renderWithProviders(<MovieTile {...mockProps} />, { preloadedState: { user: mockedAdminUser as UserState } });

		const menuButton = screen.queryByTestId('menu-button');

		expect(menuButton).toBeInTheDocument();
	});

	it('should not render contextual menu button when user is not admin', () => {
		renderWithProviders(<MovieTile {...mockProps} />, { preloadedState: { user: mockedRegularUser as UserState } });

		const menuButton = screen.queryByTestId('menu-button');

		expect(menuButton).not.toBeInTheDocument();
	});

	it('renders the context menu with buttons', () => {
		renderWithProviders(<MovieTile {...mockProps} />, { preloadedState: { user: mockedAdminUser as UserState } });

		fireEvent.click(screen.getByTestId('menu-button'));

		expect(screen.getByText('Edit')).toBeInTheDocument();
		expect(screen.getByText('Delete')).toBeInTheDocument();
	});

	it('hide the context menu by close button click', () => {
		renderWithProviders(<MovieTile {...mockProps} />, { preloadedState: { user: mockedAdminUser as UserState } });

		fireEvent.click(screen.getByTestId('menu-button'));

		expect(screen.getByText('Edit')).toBeInTheDocument();
		expect(screen.getByText('Delete')).toBeInTheDocument();

		const closeButton = screen.getByTestId('close-button');
		fireEvent.click(closeButton);

		expect(screen.queryByText('Edit')).not.toBeInTheDocument();
		expect(screen.queryByText('Delete')).not.toBeInTheDocument();
	});

	it('navigates to the edit page when the Edit button is clicked', () => {
		renderWithProviders(<MovieTile {...mockProps} />, { preloadedState: { user: mockedAdminUser as UserState } });
		fireEvent.click(screen.getByTestId('menu-button'));
		const editButton = screen.getByTestId('edit-button');

		fireEvent.click(editButton);

		expect(mockNavigate).toHaveBeenCalledWith('/movies/edit/123');
	});

	it('shows the DELETE MOVIE notification on Delete button click', () => {
		renderWithProviders(<MovieTile {...mockProps} />, { preloadedState: { user: mockedAdminUser as UserState } });

		fireEvent.click(screen.getByTestId('menu-button'));

		fireEvent.click(screen.getByTestId('delete-button'));

		expect(screen.getByText('DELETE MOVIE')).toBeInTheDocument();
		expect(screen.getByText('Are you sure you want to delete this movie?')).toBeInTheDocument();
		expect(screen.getByText('CONFIRM')).toBeInTheDocument();
	});
	it('does not delete the movie on Modal CLOSE button click', () => {
		renderWithProviders(<MovieTile {...mockProps} />, { preloadedState: { user: mockedAdminUser as UserState } });

		fireEvent.click(screen.getByTestId('menu-button'));

		fireEvent.click(screen.getByTestId('delete-button'));

		fireEvent.click(screen.getByTestId('closeModal'));

		expect(screen.queryByText('DELETE MOVIE')).not.toBeInTheDocument();
		expect(screen.queryByText('Test Movie')).toBeInTheDocument();
	});

	it('deletes the movie and navigates to /movies on CONFIRM button click', () => {});
});
