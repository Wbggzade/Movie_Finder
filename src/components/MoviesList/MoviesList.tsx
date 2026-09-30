/**
 * The `MoviesList` component is responsible for displaying a list of movies
 * based on the current search, filter, and sort parameters from the URL.
 * It gets the movie data from the Redux store and dynamically updates
 * the rendered list based on user interactions.
 */

import { type FC, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchMoviesThunk } from '@/store/thunks';
import { selectMovies } from '@/store/selectors';
import { useSearchParams } from 'react-router-dom';
import { MovieTile } from './MovieTile/MovieTile';
import { Panel } from './Panel/Panel';
import { SORT_OPTIONS } from '@/constants';

import styles from './styles.module.scss'; // feel free to add any styles you need

export const MoviesList: FC = () => {
	const { list, loading, error, hasMore, genres } = useAppSelector(selectMovies);
	const [searchParams] = useSearchParams();
	const dispatch = useAppDispatch();
	const search = searchParams.get('search') ?? '';
	const filter = searchParams.get('filter') ?? 'all';
	const sortBy = searchParams.get('sortBy') ?? SORT_OPTIONS.RELEASE_DATE;

	useEffect(() => {
		const request = dispatch(fetchMoviesThunk({ search, filter, sortBy, offset: 0, limit: 20 }));
		return () => {
			if (typeof request.abort === 'function') request.abort();
		};
	}, [dispatch, search, filter, sortBy]);

	if (loading) {
		return <div className={styles.moviesListWrapper}>Loading movies...</div>;
	}

	if (error) {
		return (
			<div className={styles.moviesListWrapper}>
				<p role='alert'>{error}</p>
				<button
					type='button'
					className={styles.loadMore}
					onClick={() => dispatch(fetchMoviesThunk({ search, filter, sortBy, offset: 0, limit: 20 }))}
				>
					Retry
				</button>
			</div>
		);
	}

	const availableGenres = genres.length ? genres : Array.from(new Set(list.flatMap((movie) => movie.genres)));
	const displayedMovies = list;

	const count = displayedMovies.length;
	const countText = `${count} movie${count === 1 ? '' : 's'} ${hasMore ? 'loaded' : 'found'}`;

	return (
		<div className={styles.moviesListWrapper}>
			<Panel genres={availableGenres} />
			<div className={styles.moviesListContainer}>
				<p className={styles.movieCount}>{count ? countText : 'No movies found'}</p>
				<ul className={styles.list}>
					{displayedMovies.map((movie) => (
						<MovieTile
							key={movie.id}
							id={movie.id}
							title={movie.title}
							genres={movie.genres}
							release_date={movie.release_date}
							poster_path={movie.poster_path}
						/>
					))}
				</ul>
				{hasMore && (
					<button
						type='button'
						className={styles.loadMore}
						disabled={loading}
						onClick={() => dispatch(fetchMoviesThunk({ search, filter, sortBy, offset: list.length, limit: 20 }))}
					>
						{loading ? 'Loading...' : 'Load more'}
					</button>
				)}
			</div>
		</div>
	);
};
