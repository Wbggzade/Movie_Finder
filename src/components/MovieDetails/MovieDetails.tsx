/**
 * Component to display detailed information about a selected movie.
 *
 * This component gets the movie details based on the `movieId` parameter
 * from the URL from the store and displays information such as the title, overview,
 * release date, poster, genres, runtime, and average vote.
 */

import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectMovieById, selectMovies } from '@/store/selectors';
import { fetchMovieByIdThunk } from '@/store/thunks';
import { Button } from '@/common';
import styles from './styles.module.scss';

const formatRuntime = (runtime: number): string => {
	const hours = Math.floor(runtime / 60);
	const minutes = runtime % 60;
	return `${hours}h ${minutes}min`;
};

export const MovieDetails = () => {
	const { movieId } = useParams(); // get movieId from the URL
	const movie = useAppSelector(selectMovieById(movieId));
	const { detailLoading, detailError } = useAppSelector(selectMovies);
	const dispatch = useAppDispatch();

	useEffect(() => {
		if (movieId && !movie) dispatch(fetchMovieByIdThunk(movieId));
	}, [dispatch, movieId, movie]);

	if (detailLoading && !movie) return <p role='status'>Loading movie details...</p>;
	if (detailError && !movie) {
		return (
			<div className={styles.movieDetails}>
				<p role='alert'>{detailError}</p>
				<Button variant='secondary' onClick={() => movieId && dispatch(fetchMovieByIdThunk(movieId))}>
					RETRY
				</Button>
			</div>
		);
	}

	if (!movie) {
		return (
			<div className={styles.movieDetails} role='status'>
				Movie not found
			</div>
		);
	}

	const { title, overview, release_date, poster_path, genres, runtime, vote_average } = movie;

	return (
		<div className={styles.movieDetails}>
			<img
				className={styles.poster}
				src={poster_path}
				alt={title}
				loading='lazy'
				onError={(event) => {
					event.currentTarget.src = '/poster-unavailable.svg';
				}}
			/>
			<div className={styles.info}>
				<div className={styles.heading}>
					<h2 className={styles.title}>{title}</h2>
					<span className={styles.rating}>{vote_average}</span>
				</div>
				<p className={styles.genres}>{genres.join(' & ')}</p>
				<div className={styles.meta}>
					<span className={styles.year}>{release_date?.slice(0, 4)}</span>
					<span className={styles.runtime}>{formatRuntime(runtime)}</span>
				</div>
				<p className={styles.overview}>{overview}</p>
			</div>
		</div>
	);
};
