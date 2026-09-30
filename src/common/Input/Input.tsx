/**
 * A reusable input component for React applications.
 *
 * @component
 * @param {string} placeholderText - The placeholder text displayed inside the input field.
 * @param {React.ChangeEventHandler<HTMLInputElement>} onChange - The event handler for the input's `onChange` event.
 * @param {string} labelText - The text displayed as the label for the input field.
 * @param {string} value - The current value of the input field.
 */

import { type ChangeEventHandler, type FC, type InputHTMLAttributes, useId } from 'react';
import styles from './styles.module.scss'; // feel free to use provided styles or create new ones

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'placeholder'> {
	placeholderText: string;
	onChange: ChangeEventHandler<HTMLInputElement>;
	labelText: string;
	value: string;
}

export const Input: FC<InputProps> = ({ placeholderText, onChange, labelText, value, id, ...rest }) => {
	const generatedId = useId();
	const inputId = id ?? generatedId;
	return (
		<div className={styles.inputWrapper}>
			<label className={styles.label} htmlFor={inputId}>
				{labelText}
			</label>
			<input id={inputId} placeholder={placeholderText} onChange={onChange} value={value} {...rest} />
		</div>
	);
};
