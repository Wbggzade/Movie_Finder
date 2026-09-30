import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/common';

describe('Button component', () => {
	it('renders with the provided data-testid attribute', () => {
		render(<Button data-testid='custom-button'>Test ID</Button>);

		expect(screen.queryByTestId('custom-button')).toBeInTheDocument();
	});

	it('renders the button with children', () => {
		render(<Button>Click me</Button>);

		expect(screen.queryByText('Click me')).toBeInTheDocument();
	});

	it('calls onClick when clicked', () => {
		const handleClick = jest.fn();
		render(<Button onClick={handleClick}>Click me</Button>);

		fireEvent.click(screen.getByText('Click me'));

		expect(handleClick).toHaveBeenCalledTimes(1);
	});
});
