/**
 * The `Header` component represents the top navigation bar of the application.
 * It dynamically renders content based on the user's authentication status, role, and the current route.
 *
 * - Displays the application logo that links to the movies page.
 * - Shows a search bar, which adjusts its size based on the current route.
 * - Provides an "+ ADD MOVIE" button for admin users.
 * - Displays a user menu with the user's initials and a logout option when authenticated.
 */

import { useEffect, useState, type KeyboardEvent } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Input } from '@/common';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectUser } from '@/store/selectors';
import { logoutUserThunk } from '@/store/thunks';
import { ROUTE_PATHS } from '@/constants';
import styles from './styles.module.scss'; // feel free to add any styles you need

export const Header = () => {
	const dispatch = useAppDispatch();
	const navigate = useNavigate();
	const location = useLocation();
	const [searchParams, setSearchParams] = useSearchParams();
	const { name, isAuth, role } = useAppSelector(selectUser);

	const [query, setQuery] = useState(searchParams.get('search') ?? '');
	const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

	const isMoviesListPage = location.pathname === ROUTE_PATHS.HOME || location.pathname === ROUTE_PATHS.MOVIES;
	const isAdmin = role === 'admin';

	useEffect(() => {
		setQuery(searchParams.get('search') ?? '');
	}, [searchParams]);

	const submitSearch = () => {
		const next = new URLSearchParams(searchParams);
		if (query.trim()) {
			next.set('search', query.trim());
		} else {
			next.delete('search');
		}
		if (isMoviesListPage) {
			setSearchParams(next);
		} else {
			const queryString = next.toString();
			navigate(`${ROUTE_PATHS.MOVIES}${queryString ? `?${queryString}` : ''}`);
		}
	};

	const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
		if (event.key === 'Enter') {
			submitSearch();
		}
	};

	const handleAddMovie = () => navigate(`${ROUTE_PATHS.ADD_MOVIE}${location.search}`);

	const handleLogout = () => {
		dispatch(logoutUserThunk());
		setIsUserMenuOpen(false);
		navigate(ROUTE_PATHS.LOGIN);
	};

	return (
		<div className={styles.headerContainer}>
			<div className={styles.topBar}>
				<Link className={styles.logo} to={`${ROUTE_PATHS.MOVIES}${location.search}`}>
					FrameFinder
				</Link>

				<div className={styles.topActions}>
					{isAuth && isAdmin && isMoviesListPage && (
						<Button variant='transparent' className={styles.addButton} onClick={handleAddMovie}>
							+ ADD MOVIE
						</Button>
					)}

					{isAuth && (
						<div className={styles.userMenu}>
							<Button className={styles.userButton} onClick={() => setIsUserMenuOpen((open) => !open)}>
								{name ? name.charAt(0).toUpperCase() : 'U'}
							</Button>
							{isUserMenuOpen && (
								<div className={styles.userDropdown}>
									<span className={styles.userName}>{name}</span>
									<Button className={styles.logoutButton} onClick={handleLogout}>
										LOGOUT
									</Button>
								</div>
							)}
						</div>
					)}
				</div>
			</div>

			<div className={styles.searchBar}>
				{isMoviesListPage ? (
					<>
						<h1 className={styles.heroTitle}>FIND YOUR MOVIE</h1>
						<div className={styles.searchRow}>
							<Input
								labelText=''
								aria-label='Search movies'
								placeholderText='What do you want to watch?'
								value={query}
								onChange={(e) => setQuery(e.target.value)}
								onKeyDown={handleSearchKeyDown}
							/>
							<Button variant='primary' className={styles.searchButton} onClick={submitSearch}>
								SEARCH
							</Button>
						</div>
					</>
				) : (
					<div className={styles.smallSearch}>
						<input
							aria-label='Search movies'
							className={styles.smallSearchInput}
							placeholder='What do you want to watch?'
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							onKeyDown={handleSearchKeyDown}
						/>
						<Button className={styles.searchIcon} aria-label='Search movies' onClick={submitSearch}>
							&#128269;
						</Button>
					</div>
				)}
			</div>
		</div>
	);
};
