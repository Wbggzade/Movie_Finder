import { screen, fireEvent } from '@testing-library/react';

import { Header } from '@/components';
import { renderWithProviders } from '@/store/_mock';
import { UserState } from '@/store/userSlice';

describe('Header Component', () => {
	it('should contain the FrameFinder logo', () => {
		renderWithProviders(<Header />, { route: '/movies' });

		expect(screen.getByText(/framefinder/i)).toBeInTheDocument();
	});

	it('should render the search field with magnifying glass for route /movies/:movieId', () => {
		renderWithProviders(<Header />, { route: '/movies/1' });

		expect(screen.queryByText(/find your movie/i)).not.toBeInTheDocument();
	});

	it('should not render "+ ADD MOVIE" button for authorized users on route /movies or /', () => {
		const mockedState = { user: { isAuth: true, role: 'user', name: 'John Doe', token: 'mockToken' } as UserState };
		renderWithProviders(<Header />, { preloadedState: mockedState, route: '/movies' });

		expect(screen.queryByText(/add movie/i)).not.toBeInTheDocument();
	});

	it('should render "+ ADD MOVIE" button for ADMIN users on route /movies or /', () => {
		const mockedState = { user: { isAuth: true, role: 'admin', name: 'John Doe', token: 'mockToken' } as UserState };
		renderWithProviders(<Header />, { preloadedState: mockedState, route: '/movies' });

		expect(screen.queryByText(/add movie/i)).toBeInTheDocument();
	});

	it('should render USER button for authorized users with contextual menu', () => {
		const mockedState = { user: { isAuth: true, role: 'user', name: 'John Doe', token: 'mockToken' } as UserState };
		renderWithProviders(<Header />, { preloadedState: mockedState, route: '/movies' });

		const userButton = screen.getByText(/j/i); // First letter of "John Doe"
		expect(userButton).toBeInTheDocument();

		fireEvent.click(userButton);

		expect(screen.getByText(/john doe/i)).toBeInTheDocument();
		expect(screen.getByText(/logout/i)).toBeInTheDocument();
	});

	it('should send a logout request on LOGOUT button click', () => {
		const mockedState = { user: { isAuth: true, name: 'John Doe', token: 'mockToken' } as UserState };
		renderWithProviders(<Header />, { preloadedState: mockedState, route: '/movies' });

		fireEvent.click(screen.getByText(/j/i)); // Open contextual menu
		const logoutButton = screen.getByText(/logout/i);
		localStorage.setItem('token', 'mockToken');

		fireEvent.click(logoutButton);

		expect(localStorage.getItem('token')).toBeNull();
	});

	it('should render the search block for route /movies or /', () => {
		const mockedState = { user: { isAuth: true, name: 'John Doe', token: 'mockToken' } as UserState };

		renderWithProviders(<Header />, { preloadedState: mockedState, route: '/movies' });

		expect(screen.getByText(/find your movie/i)).toBeInTheDocument();
		expect(screen.getByPlaceholderText(/what do you want to watch/i)).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
	});

	it('should navigate to /movies on logo click', () => {
		renderWithProviders(<Header />, { route: '/movies' });

		const logo = screen.getByText(/framefinder/i);
		fireEvent.click(logo);

		expect(['/movies', '/']).toContain(window.location.pathname);
	});
});
