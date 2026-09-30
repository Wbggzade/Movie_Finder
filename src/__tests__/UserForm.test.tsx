import { screen, fireEvent, waitFor } from '@testing-library/react';
import { UserForm } from '@/components';
import { ROUTE_PATHS } from '@/constants';
import { renderWithProviders } from '@/store/_mock';
import { createUser } from '@/services';

jest.mock('@/services', () => ({
	createUser: jest.fn().mockResolvedValue(undefined),
}));

const mockDispatch = jest.fn();
jest.mock('@/store/hooks.ts', () => ({
	useAppDispatch: () => mockDispatch,
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
	...jest.requireActual('react-router-dom'),
	useNavigate: () => mockNavigate,
}));

describe('UserForm Component', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockDispatch.mockReturnValue({ unwrap: () => Promise.resolve({}) });
	});

	describe('login form', () => {
		it('renders the form correctly', () => {
			renderWithProviders(<UserForm mode='login' />);

			expect(screen.getAllByText(/login/i).length).toBe(2);
			expect(screen.getByPlaceholderText('enter email')).toBeInTheDocument();
			expect(screen.getByPlaceholderText('enter password')).toBeInTheDocument();
			expect(screen.getByText(/registration/i)).toBeInTheDocument();
			expect(screen.getByText(/reset/i)).toBeInTheDocument();
			expect(screen.getByText(/Do not have an account/i)).toBeInTheDocument();
		});

		it('validates empty fields on form submission', () => {
			renderWithProviders(<UserForm mode='login' />);

			fireEvent.click(screen.getByRole('button', { name: /login/i }));

			expect(screen.getAllByText(/is required/)).toHaveLength(2);
		});

		it('clears fields and errors on reset button click', () => {
			renderWithProviders(<UserForm mode='login' />);

			fireEvent.change(screen.getByPlaceholderText('enter email'), {
				target: { value: 'john@example.com' },
			});
			fireEvent.change(screen.getByPlaceholderText('enter password'), {
				target: { value: 'password123' },
			});

			expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();
			expect(screen.getByDisplayValue('password123')).toBeInTheDocument();

			fireEvent.click(screen.getByText(/reset/i));

			expect(screen.getByPlaceholderText('enter email')).toHaveValue('');
			expect(screen.getByPlaceholderText('enter password')).toHaveValue('');
			expect(screen.queryByText(/is required/)).not.toBeInTheDocument();
		});

		it('navigates to the registration page on registration link click', () => {
			renderWithProviders(<UserForm mode='login' />);

			const registrationLink = screen.getByText('registration');
			expect(registrationLink).toHaveAttribute('href', ROUTE_PATHS.REGISTRATION);
		});

		it('navigates to /movies route on successful login', async () => {
			mockDispatch.mockReturnValueOnce({ unwrap: () => Promise.resolve({}) });

			renderWithProviders(<UserForm mode='login' />);

			fireEvent.change(screen.getByPlaceholderText('enter email'), {
				target: { value: 'john@example.com' },
			});
			fireEvent.change(screen.getByPlaceholderText('enter password'), {
				target: { value: 'password123' },
			});

			fireEvent.click(screen.getByRole('button', { name: /login/i }));

			await waitFor(() => {
				expect(mockNavigate).toHaveBeenCalledWith(ROUTE_PATHS.MOVIES);
			});
		});

		it('shows authentication failure and stays on the form', async () => {
			mockDispatch.mockReturnValueOnce({ unwrap: () => Promise.reject(new Error('Invalid email or password')) });

			renderWithProviders(<UserForm mode='login' />);
			fireEvent.change(screen.getByPlaceholderText('enter email'), { target: { value: 'john@example.com' } });
			fireEvent.change(screen.getByPlaceholderText('enter password'), { target: { value: 'wrong-password' } });
			fireEvent.click(screen.getByRole('button', { name: /login/i }));

			expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password');
			expect(mockNavigate).not.toHaveBeenCalled();
			expect(screen.getByPlaceholderText('enter email')).toHaveValue('john@example.com');
		});
	});

	describe('registration form', () => {
		it('renders the form correctly', () => {
			renderWithProviders(<UserForm mode='registration' />);

			expect(screen.getByText(/registration/i)).toBeInTheDocument();
			expect(screen.getByPlaceholderText('enter name')).toBeInTheDocument();
			expect(screen.getByPlaceholderText('enter email')).toBeInTheDocument();
			expect(screen.getByPlaceholderText('create password')).toBeInTheDocument();
			expect(screen.getByText(/login/i)).toBeInTheDocument();
			expect(screen.getByText(/reset/i)).toBeInTheDocument();
			expect(screen.getByText(/Already registered/)).toBeInTheDocument();
		});

		it('validates empty fields on form submission', () => {
			renderWithProviders(<UserForm mode='registration' />);

			fireEvent.click(screen.getByRole('button', { name: /register/i }));

			expect(screen.getAllByText(/is required/)).toHaveLength(3);
		});

		it('clears fields and errors on reset button click', () => {
			renderWithProviders(<UserForm mode='registration' />);

			fireEvent.change(screen.getByPlaceholderText('enter name'), {
				target: { value: 'John' },
			});
			fireEvent.change(screen.getByPlaceholderText('enter email'), {
				target: { value: 'john@example.com' },
			});
			fireEvent.change(screen.getByPlaceholderText('create password'), {
				target: { value: 'password123' },
			});

			expect(screen.getByDisplayValue('John')).toBeInTheDocument();
			expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();
			expect(screen.getByDisplayValue('password123')).toBeInTheDocument();

			fireEvent.click(screen.getByText(/reset/i));

			expect(screen.getByPlaceholderText('enter name')).toHaveValue('');
			expect(screen.getByPlaceholderText('enter email')).toHaveValue('');
			expect(screen.getByPlaceholderText('create password')).toHaveValue('');
			expect(screen.queryByText(/is required/)).not.toBeInTheDocument();
		});

		it('navigates to the login page on login link click', () => {
			renderWithProviders(<UserForm mode='registration' />);

			const loginLink = screen.getByText(/login/i);
			expect(loginLink).toHaveAttribute('href', ROUTE_PATHS.LOGIN);
		});

		it('navigates to the login page on successful registration', async () => {
			(createUser as jest.Mock).mockResolvedValueOnce(undefined);

			renderWithProviders(<UserForm mode='registration' />);

			fireEvent.change(screen.getByPlaceholderText('enter name'), {
				target: { value: 'John' },
			});
			fireEvent.change(screen.getByPlaceholderText('enter email'), {
				target: { value: 'john@example.com' },
			});
			fireEvent.change(screen.getByPlaceholderText('create password'), {
				target: { value: 'password123' },
			});

			fireEvent.click(screen.getByRole('button', { name: /register/i }));

			await waitFor(() => {
				expect(createUser).toHaveBeenCalledWith({
					name: 'John',
					email: 'john@example.com',
					password: 'password123',
				});
				expect(mockNavigate).toHaveBeenCalledWith(ROUTE_PATHS.LOGIN);
			});
		});

		it('shows registration failure without navigating or clearing entered values', async () => {
			(createUser as jest.Mock).mockRejectedValueOnce(new Error('Email is already registered'));
			renderWithProviders(<UserForm mode='registration' />);
			fireEvent.change(screen.getByPlaceholderText('enter name'), { target: { value: 'Jane' } });
			fireEvent.change(screen.getByPlaceholderText('enter email'), { target: { value: 'jane@example.com' } });
			fireEvent.change(screen.getByPlaceholderText('create password'), {
				target: { value: 'temporary-password' },
			});
			fireEvent.click(screen.getByRole('button', { name: /register/i }));

			expect(await screen.findByRole('alert')).toHaveTextContent('Email is already registered');
			expect(mockNavigate).not.toHaveBeenCalled();
			expect(screen.getByPlaceholderText('enter email')).toHaveValue('jane@example.com');
		});
	});

	it('resets form when mode changes', () => {
		const { rerender } = renderWithProviders(<UserForm mode='login' />);

		fireEvent.change(screen.getByPlaceholderText('enter email'), {
			target: { value: 'test@example.com' },
		});

		expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();

		rerender(<UserForm mode='registration' />);

		expect(screen.getByPlaceholderText('enter email')).toHaveValue('');
	});
});
