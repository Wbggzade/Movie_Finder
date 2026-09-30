import { render, screen, fireEvent } from '@testing-library/react';
import { Input } from '@/common';

describe('Input Component', () => {
	it('renders the input with the correct placeholder text', () => {
		render(<Input placeholderText='Enter your name' onChange={() => {}} labelText='Name' value='' />);

		const inputElement = screen.queryByPlaceholderText('Enter your name');

		expect(inputElement).toBeInTheDocument();
	});

	it('renders the label with the correct label', () => {
		const labelText = 'Name';

		render(<Input placeholderText='Enter your name' onChange={() => {}} labelText={labelText} value='' />);

		const labelElement = screen.queryByText(labelText);

		expect(labelElement).toBeInTheDocument();
	});

	it('calls the onChange handler when the input value changes', () => {
		const handleChange = jest.fn();
		render(
			<Input
				placeholderText='Enter your name'
				onChange={handleChange}
				labelText='Name'
				value=''
				data-testid='input-field'
			/>
		);

		const inputElement = screen.queryByPlaceholderText('Enter your name');

		expect(inputElement).not.toBeNull();

		fireEvent.change(inputElement as HTMLElement, { target: { value: 'John' } });

		expect(handleChange).toHaveBeenCalledTimes(1);
	});

	it('renders the input with the correct value', () => {
		const value = 'John';
		render(<Input placeholderText='Enter your name' onChange={() => {}} labelText='Name' value={value} />);

		const inputElement = screen.queryByPlaceholderText('Enter your name');

		expect(inputElement).toHaveValue(value);
	});
});
