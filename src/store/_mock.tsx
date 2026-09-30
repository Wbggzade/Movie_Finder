import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import moviesReducer, { type MoviesState } from './moviesSlice';
import userReducer, { type UserState } from './userSlice';
import { render, type RenderOptions } from '@testing-library/react';
import { type PropsWithChildren, type ReactElement } from 'react';
import { MemoryRouter } from 'react-router-dom';

const rootReducer = combineReducers({
	user: userReducer,
	movies: moviesReducer,
});

type RootState = ReturnType<typeof rootReducer>;
type PartialState = { movies?: Partial<MoviesState>; user?: Partial<UserState> };

function mockStore(preloadedState?: PartialState) {
	const initialState = rootReducer(undefined, { type: 'test/init' });
	const mergedState: RootState = {
		movies: { ...initialState.movies, ...preloadedState?.movies },
		user: { ...initialState.user, ...preloadedState?.user },
	};
	return configureStore({
		reducer: rootReducer,
		preloadedState: mergedState,
	});
}

type AppStore = ReturnType<typeof mockStore>;

interface ExtendedRenderOptions extends Omit<RenderOptions, 'queries'> {
	preloadedState?: PartialState;
	store?: AppStore;
	route?: string;
}

export function renderWithProviders(ui: ReactElement, extendedRenderOptions: ExtendedRenderOptions = {}) {
	const { preloadedState = {}, store = mockStore(preloadedState), route, ...renderOptions } = extendedRenderOptions;

	const Wrapper = ({ children }: PropsWithChildren) => (
		<Provider store={store}>
			<MemoryRouter initialEntries={[route || '/']}>{children}</MemoryRouter>
		</Provider>
	);

	return {
		store,
		...render(ui, { wrapper: Wrapper, ...renderOptions }),
	};
}
