/**
 * The `Panel` component provides a user interface for filtering and sorting movies.
 *
 * - Displays a list of genres dynamically from the movies currently shown.
 * - Allows users to filter movies by genre or reset the filter to "all".
 * - Provides a dropdown menu to sort movies by "release date" or "title".
 */
import { useState, type FC } from 'react';
import { useSearchParams } from 'react-router-dom';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { Button } from '@/common';
import { SORT_OPTIONS } from '@/constants';

const ALL = 'all';
const SORT_VALUES = [SORT_OPTIONS.RELEASE_DATE, SORT_OPTIONS.TITLE];

interface PanelProps {
	genres: string[];
}

export const Panel: FC<PanelProps> = ({ genres }) => {
	const [searchParams, setSearchParams] = useSearchParams();
	const [isSortOpen, setIsSortOpen] = useState(false);

	const activeGenre = searchParams.get('filter') ?? ALL;
	const activeSort = searchParams.get('sortBy') ?? SORT_OPTIONS.RELEASE_DATE;

	const updateParam = (key: string, value: string) => {
		const next = new URLSearchParams(searchParams);
		if (value) {
			next.set(key, value);
		} else {
			next.delete(key);
		}
		setSearchParams(next);
	};

	const handleGenreClick = (genre: string) => {
		updateParam('filter', genre === ALL ? '' : genre);
	};

	const handleSortSelect = (option: string) => {
		updateParam('sortBy', option === SORT_OPTIONS.RELEASE_DATE ? '' : option);
		setIsSortOpen(false);
	};

	return (
		<div className={styles.panelWrapper}>
			<div className={styles.genresContainer}>
				<Button
					className={clsx(styles.genreButton, { [styles.active]: activeGenre === ALL })}
					onClick={() => handleGenreClick(ALL)}
				>
					{ALL}
				</Button>
				{genres.map((genre) => (
					<Button
						key={genre}
						className={clsx(styles.genreButton, { [styles.active]: activeGenre === genre })}
						onClick={() => handleGenreClick(genre)}
					>
						{genre}
					</Button>
				))}
			</div>
			<div className={styles.sortControlContainer}>
				<span className={styles.sortLabel}>sort by</span>
				<Button className={styles.sortControl} onClick={() => setIsSortOpen((open) => !open)}>
					{activeSort}
					<span className={styles.caret}>&#9662;</span>
				</Button>
				{isSortOpen && (
					<ul className={styles.sortOptions}>
						{SORT_VALUES.filter((option) => option !== activeSort).map((option) => (
							<li key={option}>
								<Button className={styles.sortOption} onClick={() => handleSortSelect(option)}>
									{option}
								</Button>
							</li>
						))}
					</ul>
				)}
			</div>
		</div>
	);
};
