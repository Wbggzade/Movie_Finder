/**
 * The main application component that sets up routing and initializes the app state.
 *
 * This component:
 * - Fetches the list of movies and user data (if a token exists) on mount.
 * - Defines the application's routes using `react-router-dom`.
 * - Protects certain routes with authentication and role-based access using `PrivateRoute`.
 */

import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { MoviesList, Header, MovieDetails, MovieForm, UserForm } from './components';
import { Modal, PrivateRoute } from '@/common';
import { useAppDispatch } from '@/store/hooks';
import { getUserThunk } from './store/thunks';
import { ROUTE_PATHS, USER_FORM_MODES } from '@/constants';
import { authEnabled, movieProvider } from '@/services/api';
import { readSessionToken } from '@/services/session';
import styles from './App.module.scss';

function App() {
	const dispatch = useAppDispatch();

	useEffect(() => {
		const token = readSessionToken();
		if (token && authEnabled) {
			dispatch(getUserThunk({ token }));
		}
	}, [dispatch]);

	return (
		<div className={styles.app}>
			<Header />
			<Routes>
				<Route path={ROUTE_PATHS.HOME} element={<MoviesList />} />
				<Route path={ROUTE_PATHS.MOVIES} element={<MoviesList />} />
				<Route
					path={ROUTE_PATHS.ADD_MOVIE}
					element={
						<>
							<MoviesList />
							<Modal>
								<PrivateRoute>
									<MovieForm />
								</PrivateRoute>
							</Modal>
						</>
					}
				/>
				<Route
					path={ROUTE_PATHS.EDIT_MOVIE}
					element={
						<>
							<MoviesList />
							<Modal>
								<PrivateRoute>
									<MovieForm />
								</PrivateRoute>
							</Modal>
						</>
					}
				/>
				<Route
					path={`${ROUTE_PATHS.MOVIES}/${ROUTE_PATHS.MOVIE}`}
					element={
						<>
							<MoviesList />
							<Modal>
								<MovieDetails />
							</Modal>
						</>
					}
				/>
				<Route path={ROUTE_PATHS.LOGIN} element={<UserForm mode={USER_FORM_MODES.LOGIN} />} />
				<Route path={ROUTE_PATHS.REGISTRATION} element={<UserForm mode={USER_FORM_MODES.REGISTRATION} />} />
			</Routes>
			<footer className={styles.footer}>
				<span>Movie Finder</span>
				{movieProvider === 'tmdb' && (
					<section aria-label='Data credits'>
						<a href='https://www.themoviedb.org'>
							<img width='80' alt='TMDB' src='/tmdb-logo.svg' />
						</a>
						<small>This product uses the TMDB API but is not endorsed or certified by TMDB.</small>
					</section>
				)}
			</footer>
		</div>
	);
}

export default App;
