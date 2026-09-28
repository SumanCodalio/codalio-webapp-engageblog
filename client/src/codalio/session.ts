import { useQuery } from '@tanstack/react-query';
import { api, useOrganization } from '@rhino-dev/rhino-react';

export interface SessionUser {
  id: number;
  email: string;
  name: string;
  first_name?: string | null;
  last_name?: string | null;
  approved?: boolean;
  avatar_url?: string | null;
  organization?: { id: number; slug: string; name: string } | null;
  roles: { id: number; name: string; slug: string }[];
}

/**
 * Host-owned session hook.
 *
 * The installed `@rhino-dev/rhino-react` build exposes `useAuth`/`useOrganization`
 * but not `useUser`/`useBaseOwnerId`, and the login response carries no user
 * object. This reads the host-owned `GET /api/{org}/me` endpoint, which returns
 * the signed-in user together with their roles in the resolved organization.
 */
export function useSession() {
  const organization = useOrganization();

  const { data, isLoading } = useQuery<SessionUser | null>({
    queryKey: ['me', organization],
    queryFn: async () => {
      const response = await api.get(`/${organization}/me`);
      return response.data ?? null;
    },
    enabled: !!organization,
  });

  return { user: data ?? null, organization, isLoading };
}

/** The signed-in user, or null while the session is still resolving. */
export function useUser(): SessionUser | null {
  return useSession().user;
}

/**
 * The current base owner (organization) id.
 *
 * Flat routes carry no `:baseOwnerId` URL segment, so the owner comes from the
 * session's organization rather than `useParams()`.
 */
export function useBaseOwnerId(): number | null {
  const { user, organization } = useSession();
  return user?.organization?.id ?? null;
}