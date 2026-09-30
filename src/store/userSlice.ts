import { createSlice } from '@reduxjs/toolkit';
import type { UserRole } from '@/types';
import { loginUserThunk, logoutUserThunk, getUserThunk } from './thunks';
import { readSessionToken } from '@/services/session';
import { authEnabled } from '@/services/api';

export interface UserState {
	name: string;
	isAuth: boolean;
	error: null | string;
	email: string;
	token: string;
	role: UserRole;
	loading: boolean;
}

const initialState: UserState = {
	name: '',
	email: '',
	role: 'user',
	token: readSessionToken(),
	isAuth: false,
	error: null,
	loading: Boolean(readSessionToken() && authEnabled),
};

const userSlice = createSlice({
	name: 'user',
	initialState,
	reducers: {
		clearUser: (state: UserState) => {
			state.name = '';
			state.email = '';
			state.role = 'user';
			state.token = '';
			state.isAuth = false;
			state.error = null;
			state.loading = false;
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(loginUserThunk.pending, (state: UserState) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(loginUserThunk.fulfilled, (state: UserState, { payload }) => {
				state.loading = false;
				state.isAuth = true;
				state.name = payload.name ?? '';
				state.email = payload.email ?? '';
				state.role = payload.role ?? 'user';
				state.token = payload.token ?? '';
			})
			.addCase(loginUserThunk.rejected, (state: UserState, action) => {
				state.loading = false;
				state.error = action.payload ?? action.error.message ?? 'Login failed';
			})
			.addCase(getUserThunk.fulfilled, (state: UserState, { payload }) => {
				state.loading = false;
				state.isAuth = true;
				state.name = payload.name ?? state.name;
				state.email = payload.email ?? state.email;
				state.role = payload.role ?? state.role;
				state.token = payload.token ?? state.token;
			})
			.addCase(getUserThunk.pending, (state: UserState) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(getUserThunk.rejected, (state: UserState, action) => {
				state.loading = false;
				state.isAuth = false;
				state.name = '';
				state.email = '';
				state.role = 'user';
				state.token = '';
				state.error = action.payload ?? action.error.message ?? 'Failed to fetch user';
			})
			.addCase(logoutUserThunk.pending, (state: UserState) => {
				state.name = '';
				state.email = '';
				state.role = 'user';
				state.token = '';
				state.isAuth = false;
				state.error = null;
			})
			.addCase(logoutUserThunk.fulfilled, (state: UserState, action) => {
				state.name = '';
				state.email = '';
				state.role = 'user';
				state.token = '';
				state.isAuth = false;
				state.error = action.payload ?? null;
			});
	},
});

export const { clearUser } = userSlice.actions;
export default userSlice.reducer;
