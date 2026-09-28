import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@rhino-dev/rhino-react';
import { useUserRole } from '@/codalio/useUserRole';

/**
 * Authenticated route guard. Renders `<Outlet />` only — the owner context is
 * provided by `AppOwnerProvider` wrapping the Layout (flat routes carry no
 * `:baseOwnerId` segment, so upstream `BaseOwnerProvider` must not be mounted).
 */
export function AuthenticatedRoute() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}

/**
 * Role gate for a route subtree. Redirects to the dashboard when the signed-in
 * user holds none of the allowed roles. `isLoading` is treated as "not yet
 * privileged" so a privileged branch never renders before roles resolve.
 */
export function RoleProtectedRoute({ roles }: { roles: string[] }) {
  const { hasRole, isLoading } = useUserRole();

  if (isLoading) return null;
  if (roles.length > 0 && !roles.some((role) => hasRole(role))) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
