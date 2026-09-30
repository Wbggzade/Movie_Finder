/**
 * @component MovieForm
 * @description Renders a form to add or edit a movie. Accessible to admin users and wrapped
 * with the `PrivateRoute` component. The form is displayed inside a `Modal` and supports both
 * "add" and "edit" modes based on the route (`useParams`).
 *
 * - Add mode (`/movies/add`): empty form, title "ADD MOVIE".
 * - Edit mode (`/movies/edit/:movieId`): pre-filled form, title "EDIT MOVIE".
 * - Submit validates all fields, showing "ALL FIELDS ARE REQUIRED" when invalid.
 * - On success, shows a "CONGRATULATIONS!" notification inside a `Modal` that navigates to /movies on close.
 */

import { useEffect, useState, type FC, type FormEvent } from 'react';
import { useParams } from 'react-router-dom'; // use useParams hook to get the movieId from the URL
import { useAppDispatch, useAppSelector } from '@/store/hooks.ts'; // use useAppSelector hook get movie data from the store by id
import { selectMovieById } from '@/store/selectors';
import { addMovieThunk, updateMovieThunk } from '@/store/thunks';
import type { MovieCreatePayload, MovieUpdatePayload } from '@/types';
import { Input, Button, Modal } from '@/common';
import styles from './styles.module.scss'; // feel free to add any styles you need

const VALIDATION_MESSAGE = 'ALL FIELDS ARE REQUIRED';

const isValidDate = (value: string): boolean => {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
	const date = new Date(`${value}T00:00:00Z`);
	return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

const isHttpUrl = (value: string): boolean => {
	try {
		const url = new URL(value);
		return url.protocol === 'http:' || url.protocol === 'https:';
	} catch {
		return false;
	}
};

export const MovieForm: FC = () => {
	const { movieId } = useParams();
	const isEditMode = Boolean(movieId);
	const movie = useAppSelector(selectMovieById(movieId));
	const dispatch = useAppDispatch();

	const [isNotification, setIsNotification] = useState(false);
	const [error, setError] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);

	const [title, setTitle] = useState('');
	const [releaseDate, setReleaseDate] = useState('');
	const [posterPath, setPosterPath] = useState('');
	const [rating, setRating] = useState('');
	const [genres, setGenres] = useState('');
	const [runtime, setRuntime] = useState('');
	const [overview, setOverview] = useState('');

	useEffect(() => {
		if (isEditMode && movie) {
			setTitle(movie.title);
			setReleaseDate(movie.release_date);
			setPosterPath(movie.poster_path);
			setRating(String(movie.vote_average));
			setGenres(movie.genres.join(', '));
			setRuntime(String(movie.runtime));
			setOverview(movie.overview);
		}
	}, [isEditMode, movie]);

	const resetForm = () => {
		setTitle('');
		setReleaseDate('');
		setPosterPath('');
		setRating('');
		setGenres('');
		setRuntime('');
		setOverview('');
		setError('');
	};

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();

		if (isSubmitting) return;
		const trimmedTitle = title.trim();
		const trimmedOverview = overview.trim();
		const ratingValue = Number(rating);
		const runtimeValue = Number(runtime);
		const parsedGenres = genres
			.split(',')
			.map((genre) => genre.trim())
			.filter(Boolean);
		if (
			!trimmedTitle ||
			!releaseDate.trim() ||
			!posterPath.trim() ||
			!rating.trim() ||
			!genres.trim() ||
			!runtime.trim() ||
			!trimmedOverview
		) {
			setError(VALIDATION_MESSAGE);
			return;
		}
		if (!isValidDate(releaseDate.trim())) {
			setError('Enter a valid release date in YYYY-MM-DD format.');
			return;
		}
		if (!isHttpUrl(posterPath.trim())) {
			setError('Poster URL must use http or https.');
			return;
		}
		if (!Number.isFinite(ratingValue) || ratingValue < 0 || ratingValue > 10) {
			setError('Rating must be a number from 0 to 10.');
			return;
		}
		if (!Number.isFinite(runtimeValue) || runtimeValue <= 0 || !Number.isInteger(runtimeValue)) {
			setError('Runtime must be a positive whole number of minutes.');
			return;
		}
		if (parsedGenres.length === 0) {
			setError('Enter at least one genre.');
			return;
		}
		setError('');

		const payload: MovieCreatePayload = {
			title: trimmedTitle,
			release_date: releaseDate.trim(),
			poster_path: posterPath.trim(),
			vote_average: ratingValue,
			runtime: runtimeValue,
			overview: trimmedOverview,
			genres: parsedGenres,
		};

		setIsSubmitting(true);
		try {
			if (isEditMode && movieId) {
				await dispatch(updateMovieThunk({ ...payload, id: Number(movieId) } satisfies MovieUpdatePayload)).unwrap();
			} else {
				await dispatch(addMovieThunk(payload)).unwrap();
			}
			setIsNotification(true);
		} catch (requestError) {
			setError(
				typeof requestError === 'string'
					? requestError
					: requestError instanceof Error
						? requestError.message
						: 'The movie could not be saved. Please try again.'
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<>
			{isNotification ? (
				<Modal>
					<div className={styles.notification}>
						<h2>CONGRATULATIONS!</h2>
						<p>The movie has been {isEditMode ? 'updated' : 'added'} successfully.</p>
					</div>
				</Modal>
			) : (
				<form className={styles.movieForm} onSubmit={handleSubmit}>
					<h2 className={styles.title}>{isEditMode ? 'EDIT MOVIE' : 'ADD MOVIE'}</h2>

					<Input
						labelText='TITLE'
						placeholderText='enter title'
						value={title}
						onChange={(e) => setTitle(e.target.value)}
					/>
					<Input
						labelText='RELEASE DATE'
						placeholderText='select date'
						type='date'
						value={releaseDate}
						onChange={(e) => setReleaseDate(e.target.value)}
					/>
					<Input
						labelText='POSTER URL'
						placeholderText='https://'
						value={posterPath}
						onChange={(e) => setPosterPath(e.target.value)}
					/>
					<Input
						labelText='RATING'
						placeholderText='7.8'
						type='number'
						step='0.1'
						min='0'
						max='10'
						value={rating}
						onChange={(e) => setRating(e.target.value)}
					/>
					<Input
						labelText='GENRE'
						placeholderText='enter genres'
						value={genres}
						onChange={(e) => setGenres(e.target.value)}
					/>
					<Input
						labelText='RUNTIME'
						placeholderText='minutes'
						type='number'
						min='1'
						step='1'
						value={runtime}
						onChange={(e) => setRuntime(e.target.value)}
					/>

					<label className={styles.overviewLabel} htmlFor='movie-overview'>
						OVERVIEW
						<textarea
							className={styles.overview}
							id='movie-overview'
							placeholder='Movie description'
							value={overview}
							onChange={(e) => setOverview(e.target.value)}
						/>
					</label>

					{error && (
						<p className={styles.error} role='alert'>
							{error}
						</p>
					)}

					<div className={styles.actions}>
						<Button variant='secondary' type='button' onClick={resetForm}>
							RESET
						</Button>
						<Button variant='primary' type='submit' disabled={isSubmitting}>
							{isSubmitting ? 'SAVING...' : 'SUBMIT'}
						</Button>
					</div>
				</form>
			)}
		</>
	);
};
