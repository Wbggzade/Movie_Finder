import { ApiError, apiRequest, authEnabled } from './api';

export interface RegistrationData {
	name: string;
	email: string;
	password: string;
}

export const createUser = async (data: RegistrationData) => {
	if (!authEnabled) throw new ApiError('Authentication is disabled. Set VITE_ENABLE_AUTH=true to enable it.');
	await apiRequest<unknown>('/me/register', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data),
	});
};
