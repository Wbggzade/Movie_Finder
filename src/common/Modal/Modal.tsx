/**
 * Modal component that renders its children inside a modal overlay using React Portal.
 *
 * ## Features:
 * - Displays a modal overlay with customizable content.
 * - Closes the modal when the close button inside the modal is clicked.
 * - Supports an optional `onClose` callback for custom close behavior.
 * - Falls back to navigating to the `ROUTE_PATHS.MOVIES` route if `onClose` is not provided.
 *
 * ## Props:
 * - `children` (React.ReactNode): The content to display inside the modal.
 * - `onClose` (optional) (() => void): Callback function triggered when the modal is closed.
 *
 * ## Requirements:
 * - Add data-testid='closeModal' to the close button.
 *
 * ## Usage:
 * This component is designed to be used as a wrapper for modal content and should be rendered
 * at the root level of the DOM using React Portal.
 */
import { type FC, type ReactNode, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { ROUTE_PATHS } from '@/constants';
import { Button } from '@/common/Button/Button';
import styles from './styles.module.scss'; // feel free to use provided styles or create new ones

interface ModalProps {
	children: ReactNode;
	onClose?: () => void;
}

export const Modal: FC<ModalProps> = ({ children, onClose }) => {
	const navigate = useNavigate();
	const location = useLocation();
	const modalRef = useRef<HTMLDivElement>(null);
	const handleClose = () => {
		if (onClose) {
			onClose();
		} else {
			navigate(`${ROUTE_PATHS.MOVIES}${location.search}`);
		}
	};
	const handleCloseRef = useRef(handleClose);
	handleCloseRef.current = handleClose;

	useEffect(() => {
		const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
		const modal = modalRef.current;
		const closeButton = modal?.querySelector<HTMLElement>('button');
		closeButton?.focus();

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				if (!modal?.contains(document.activeElement)) return;
				handleCloseRef.current();
				return;
			}
			if (event.key !== 'Tab' || !modal) return;
			const focusable = Array.from(
				modal.querySelectorAll<HTMLElement>(
					[
						'button:not([disabled])',
						'a[href]',
						'input:not([disabled])',
						'textarea:not([disabled])',
						'select:not([disabled])',
						'[tabindex]:not([tabindex="-1"])',
					].join(', ')
				)
			);
			if (!focusable.length) return;
			const first = focusable[0];
			const last = focusable[focusable.length - 1];
			if (event.shiftKey && document.activeElement === first) {
				event.preventDefault();
				last.focus();
			} else if (!event.shiftKey && document.activeElement === last) {
				event.preventDefault();
				first.focus();
			}
		};

		document.addEventListener('keydown', handleKeyDown);
		return () => {
			document.removeEventListener('keydown', handleKeyDown);
			previouslyFocused?.focus();
		};
	}, []);

	return createPortal(
		<div className={styles.overlay}>
			<div ref={modalRef} className={styles.modal} role='dialog' aria-modal='true' aria-label='Dialog'>
				<Button data-testid='closeModal' aria-label='Close dialog' className={styles.closeButton} onClick={handleClose}>
					&times;
				</Button>
				{children}
			</div>
		</div>,
		document.body
	);
};
