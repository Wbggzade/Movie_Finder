import { type FC, type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';
import { selectIsAdmin, selectUser } from '@/store/selectors';
import { ROUTE_PATHS } from '@/constants';

interface PrivateRouteProps {
	children: ReactNode;
}

export const PrivateRoute: FC<PrivateRouteProps> = ({ children }) => {
	const isAdmin = useAppSelector(selectIsAdmin);
	const { loading } = useAppSelector(selectUser);

	if (loading) return <p role='status'>Checking your session...</p>;

	if (!isAdmin) {
		return <Navigate to={ROUTE_PATHS.MOVIES} replace />;
	}

	return <>{children}</>;
};
