import { useSession, type SessionUser } from '@/codalio/session';

export interface AppRole {
  id: number;
  name: string;
  slug: string;
}

export type AppMe = SessionUser;

/**
 * Host-owned role hook.
 *
 * The library's `useUserRole` resolves roles through a Laravel-shaped
 * `organizations?include=users` payload (`users[].pivot.role_id`) that the
 * rhino-rails backend does not serve, so it always resolves to no roles. This
 * reads the host-owned `GET /api/{org}/me` endpoint instead, which returns the
 * signed-in user's roles in the resolved organization.
 */
export function useUserRole() {
  const { user, isLoading } = useSession();

  const roles = user?.roles ?? [];

  return {
    user,
    roles,
    roleIds: roles.map((role) => role.id),
    isLoading,
    hasRole: (name: string) => {
      if (!name) return false;
      const target = name.toLowerCase();
      return roles.some(
        (role) =>
          role.slug?.toLowerCase() === target || role.name?.toLowerCase() === target,
      );
    },
  };
}
