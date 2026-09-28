/**
 * Test double for `@/codalio/session`.
 *
 * The host-owned session hook reads `GET /api/{org}/me`; the client-only
 * acceptance criteria only care about the identity and roles the shell renders
 * from it (the `/admin/*` gate, the dashboard greeting, the author attribution).
 * Tests set `sessionMockState.user` / `.roles` and assert on the DOM.
 */
export interface MockRole {
  id: number;
  name: string;
  slug: string;
}

export interface MockSessionUser {
  id: number;
  email: string;
  name: string;
  first_name?: string | null;
  last_name?: string | null;
  approved?: boolean;
  avatar_url?: string | null;
  organization?: { id: number; slug: string; name: string } | null;
  roles: MockRole[];
}

export const sessionMockState = {
  user: null as MockSessionUser | null,
  organization: 'demo-org' as string | null,
  isLoading: false,
};

export function resetSessionMockState() {
  sessionMockState.user = {
    id: 1,
    email: 'administrator@example.com',
    name: 'Administrator',
    first_name: 'Administrator',
    last_name: 'User',
    approved: true,
    organization: { id: 1, slug: 'demo-org', name: 'ContentReach Media Inc.' },
    roles: [{ id: 1, name: 'Admin', slug: 'admin' }],
  };
  sessionMockState.organization = 'demo-org';
  sessionMockState.isLoading = false;
}

export function useSession() {
  return {
    user: sessionMockState.user,
    organization: sessionMockState.organization,
    isLoading: sessionMockState.isLoading,
  };
}

export function useUser() {
  return sessionMockState.user;
}

export function useBaseOwnerId() {
  return sessionMockState.user?.organization?.id ?? null;
}
