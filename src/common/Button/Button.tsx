import { type ButtonHTMLAttributes, type FC, type ReactNode } from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss'; // feel free to use provided styles or create new ones

type ButtonVariant = 'primary' | 'secondary' | 'transparent';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	children?: ReactNode;
	variant?: ButtonVariant;
	'data-testid'?: string;
}

export const Button: FC<ButtonProps> = ({ children, className, variant, type = 'button', ...rest }) => {
	return (
		<button type={type} className={clsx(styles.button, variant && styles[variant], className)} {...rest}>
			{children}
		</button>
	);
};
