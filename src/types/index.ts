export type UserRole = 'user' | 'admin';

export interface LoginCredentials {
	email: string;
	password: string;
}

export interface RegistrationCredentials {
	name: string;
	email: string;
	password: string;
}

export type MovieCreatePayload = Omit<Movie, 'id'>;
export type MovieUpdatePayload = MovieCreatePayload & Pick<Movie, 'id'>;

export interface MoviesQuery {
	search: string;
	filter: string;
	sortBy: string;
	offset: number;
	limit: number;
}

export interface MoviesPage {
	items: Movie[];
	hasMore: boolean;
}

declare global {
	interface Movie {
		id: number;
		title: string;
		vote_average: number;
		release_date: string;
		poster_path: string;
		overview: string;
		genres: string[];
		runtime: number;
		tagline?: string;
		vote_count?: number;
		budget?: number;
		revenue?: number;
	}

	interface User {
		email: string;
		password?: string;
		name?: string;
		role?: UserRole;
		id?: number;
		token?: string;
	}
}
