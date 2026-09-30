export const BUTTON_TYPE = {
	PRIMARY: 'primary',
	SECONDARY: 'secondary',
	REGULAR: 'regular',
	TRANSPARENT: 'transparent',
} as const;

export const USER_FORM_MODES = {
	LOGIN: 'login',
	REGISTRATION: 'registration',
} as const;

export type UserFormMode = (typeof USER_FORM_MODES)[keyof typeof USER_FORM_MODES];

export const SORT_OPTIONS = {
	RELEASE_DATE: 'release date',
	TITLE: 'title',
};

export const USER_ROLE = {
	ADMIN: 'admin',
	USER: 'user',
};

export const ROUTE_PATHS = {
	HOME: '/',
	MOVIES: '/movies',
	MOVIE: ':movieId',
	ADD_MOVIE: '/movies/add',
	EDIT_MOVIE: '/movies/edit/:movieId',
	REGISTRATION: '/registration',
	LOGIN: '/login',
} as const;
