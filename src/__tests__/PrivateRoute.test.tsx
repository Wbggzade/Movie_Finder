import { screen } from '@testing-library/react';
import { PrivateRoute } from '@/common/PrivateRoute/PrivateRoute.tsx';
import { renderWithProviders } from '@/store/_mock';
import { UserState } from '@/store/userSlice';

const mockedRegularUser = { role: 'user', token: 'mockToken', isAuth: true, name: 'John Doe' };
const mockedAdminUser = { role: 'admin', token: 'mockToken', isAuth: true, name: 'John Doe' };

describe('PrivateRoute Component', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('renders children when user role is admin', () => {
		renderWithProviders(
			<PrivateRoute>
				<div>Protected Content</div>
			</PrivateRoute>,
			{ preloadedState: { user: mockedAdminUser as UserState }, route: '/protected' }
		);

		expect(screen.getByText('Protected Content')).toBeInTheDocument();
	});

	it('should not render protected content for regular user', () => {
		renderWithProviders(
			<PrivateRoute>
				<div>Protected Content</div>
			</PrivateRoute>,
			{ preloadedState: { user: mockedRegularUser as UserState }, route: '/protected' }
		);

		expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
	});
});
