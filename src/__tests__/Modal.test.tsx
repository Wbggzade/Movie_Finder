import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Modal } from '@/common/Modal/Modal';

const navigateMock = jest.fn();
jest.mock('react-router-dom', () => ({
	...jest.requireActual('react-router-dom'),
	useNavigate: () => navigateMock,
}));

describe('Modal Component', () => {
	const mockOnClose = jest.fn();

	const renderModal = (onClose?: () => void) => {
		return render(
			<MemoryRouter>
				<Modal onClose={onClose}>
					<p>Modal Content</p>
				</Modal>
			</MemoryRouter>
		);
	};

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should render the modal with custom content', () => {
		renderModal();

		expect(screen.getByText('Modal Content')).toBeInTheDocument();
	});

	it('should render the close (×) button', () => {
		renderModal();

		const closeButton = screen.getByTestId('closeModal');
		expect(closeButton).toBeInTheDocument();
	});

	it('should call the onClose callback when the close button is clicked', () => {
		renderModal(mockOnClose);

		const closeButton = screen.getByTestId('closeModal');
		fireEvent.click(closeButton);

		expect(mockOnClose).toHaveBeenCalledTimes(1);
	});

	it('should close the modal and navigate to /movies when the close button is clicked and no onClose is provided', () => {
		renderModal();

		const closeButton = screen.getByTestId('closeModal');
		fireEvent.click(closeButton);

		expect(navigateMock).toHaveBeenCalledWith('/movies');
	});
});
