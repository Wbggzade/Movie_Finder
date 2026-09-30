const TOKEN_KEY = 'token';

export const readSessionToken = (): string => localStorage.getItem(TOKEN_KEY) ?? '';

export const saveSessionToken = (token: string): void => {
	localStorage.setItem(TOKEN_KEY, token);
};

export const clearSessionToken = (): void => {
	localStorage.removeItem(TOKEN_KEY);
};
