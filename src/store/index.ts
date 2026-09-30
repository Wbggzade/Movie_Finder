import { configureStore } from '@reduxjs/toolkit';
import moviesReducer from './moviesSlice';
import userReducer from './userSlice';

const store = configureStore({
	reducer: {
		movies: moviesReducer,
		user: userReducer,
	},
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
