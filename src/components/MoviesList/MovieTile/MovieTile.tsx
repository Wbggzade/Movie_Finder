/**
 * A React functional component that represents a movie tile in a list.
 * Displays movie details such as poster, title, genres, and release year.
 * Provides an admin menu for users with the 'admin' role.
 *
 * - Clicking on the tile navigates to the movie details page.
 * - Admin users can access a context menu by clicking the menu button.
 * - data-testid attributes:
 *   - admin menu button: `data-testid="menu-button"`
 *   - edit button: `data-testid="edit-button"`
 *   - delete button: `data-testid="delete-button"`
 *   - context menu close button: `data-testid="close-button"`
 *   - context menu wrapper: `data-testid="context-menu"`
 */

declare interface MovieTileProps {
	id: number;
	title: string;
	release_date: string;
	poster_path: string;
	genres: string[];
}

import { useState, type FC, type MouseEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button, Modal } from '@/common';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectIsAdmin } from '@/store/selectors';
import { deleteMovieThunk } from '@/store/thunks';
import { ROUTE_PATHS } from '@/constants';
import styles from './styles.module.scss'; //use provided styles OR create new ones

export const MovieTile: FC<MovieTileProps> = ({
	poster_path: poster,
	title,
	genres,
	release_date: releaseDate,
	id,
}) => {
	const navigate = useNavigate();
	const location = useLocation();
	const dispatch = useAppDispatch();
	const isAdmin = useAppSelector(selectIsAdmin);

	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [deleteError, setDeleteError] = useState('');

	const releaseYear = releaseDate?.slice(0, 4);

	const detailPath = `${ROUTE_PATHS.MOVIES}/${id}${location.search}`;

	const handleMenuToggle = (event: MouseEvent) => {
		event.stopPropagation();
		setIsMenuOpen((open) => !open);
	};

	const handleEdit = (event: MouseEvent) => {
		event.stopPropagation();
		setIsMenuOpen(false);
		navigate(`${ROUTE_PATHS.MOVIES}/edit/${id}${location.search}`);
	};

	const handleDeleteClick = (event: MouseEvent) => {
		event.stopPropagation();
		setIsMenuOpen(false);
		setIsDeleteModalOpen(true);
	};

	const handleConfirmDelete = async () => {
		if (isDeleting) return;
		setIsDeleting(true);
		setDeleteError('');
		try {
			await dispatch(deleteMovieThunk(id)).unwrap();
			setIsDeleteModalOpen(false);
			navigate(`${ROUTE_PATHS.MOVIES}${location.search}`);
		} catch (error) {
			setDeleteError(
				typeof error === 'string' ? error : error instanceof Error ? error.message : 'The movie could not be deleted.'
			);
		} finally {
			setIsDeleting(false);
		}
	};

	return (
		<li className={styles.movieTileWrapper}>
			<Link className={styles.tileLink} to={detailPath}>
				<img
					className={styles.poster}
					src={poster}
					alt={title}
					loading='lazy'
					onError={(event) => {
						event.currentTarget.src = '/poster-unavailable.svg';
					}}
				/>
				<div className={styles.info}>
					<h3 className={styles.title}>{title}</h3>
					<span className={styles.year}>{releaseYear}</span>
				</div>
				<p className={styles.genres}>{genres.join(', ')}</p>
			</Link>

			{isAdmin && (
				<>
					<Button
						data-testid='menu-button'
						aria-label={`Actions for ${title}`}
						className={styles.menuButton}
						onClick={handleMenuToggle}
					>
						&#8942;
					</Button>
					{isMenuOpen && (
						<div data-testid='context-menu' className={styles.contextMenu} onClick={(e) => e.stopPropagation()}>
							<Button
								data-testid='close-button'
								aria-label='Close movie actions'
								className={styles.closeButton}
								onClick={handleMenuToggle}
							>
								&times;
							</Button>
							<Button data-testid='edit-button' className={styles.contextItem} onClick={handleEdit}>
								Edit
							</Button>
							<Button data-testid='delete-button' className={styles.contextItemDanger} onClick={handleDeleteClick}>
								Delete
							</Button>
						</div>
					)}
				</>
			)}

			{isDeleteModalOpen && (
				<Modal onClose={() => setIsDeleteModalOpen(false)}>
					<div className={styles.deleteModal} onClick={(e) => e.stopPropagation()}>
						<h2>DELETE MOVIE</h2>
						<p>Are you sure you want to delete this movie?</p>
						{deleteError && <p role='alert'>{deleteError}</p>}
						<Button
							variant='primary'
							className={styles.confirmButton}
							disabled={isDeleting}
							onClick={handleConfirmDelete}
						>
							{isDeleting ? 'DELETING...' : 'CONFIRM'}
						</Button>
					</div>
				</Modal>
			)}
		</li>
	);
};
