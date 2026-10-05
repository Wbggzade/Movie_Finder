import { RootState } from '../store';
import { movieManagementEnabled } from '@/services/api';

export const selectMovies = (state: RootState) => state.movies;

export const selectMoviesList = (state: RootState) => state.movies.list;

export const selectUser = (state: RootState) => state.user;

export const selectUserRole = (state: RootState) => state.user.role;

export const selectIsAdmin = (state: RootState) =>
	movieManagementEnabled && state.user.isAuth && state.user.role === 'admin';

export const selectIsAuth = (state: RootState) => state.user.isAuth;

export const selectUserToken = (state: RootState) => state.user.token;

export const selectMovieById = (id?: number | string) => (state: RootState) =>
	(state.movies.detail?.id === Number(id) ? state.movies.detail : undefined) ??
	state.movies.list.find((movie) => movie.id === Number(id));
