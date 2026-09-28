import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth, useOrganization, setOrganization } from '@rhino-dev/rhino-react';

/**
 * Flat-route owner context.
 *
 * The prototype uses flat paths (`/dashboard`, `/admin`, ...) with no
 * `:baseOwnerId` URL segment, so the organization cannot come from `useParams`.
 * This provider resolves the organization from the signed-in user's account
 * (the login response persists `organization_slug`) and exposes it through
 * context — it never rewrites the URL.
 *
 * Data hooks (`useModelIndex`, ...) read the org from the library's
 * `organization_slug` storage key, which `useAuth().login()` sets. This
 * provider keeps that key in sync and gives the shell a stable owner object.
 */
const AppOwnerContext = createContext({
  organization: null,
  organizationSlug: null,
  isResolving: false,
});

export function useAppOwner() {
  return useContext(AppOwnerContext);
}

export function AppOwnerProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const organizationSlug = useOrganization();
  const [resolving, setResolving] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      setResolving(false);
      return;
    }
    // The login response already persisted the slug; re-assert it so a reload
    // with a stale key still resolves the owner.
    if (organizationSlug) setOrganization(organizationSlug);
    setResolving(false);
  }, [isAuthenticated, organizationSlug]);

  const value = useMemo(
    () => ({
      organization: organizationSlug ? { slug: organizationSlug } : null,
      organizationSlug: organizationSlug ?? null,
      isResolving: resolving,
    }),
    [organizationSlug, resolving],
  );

  return <AppOwnerContext.Provider value={value}>{children}</AppOwnerContext.Provider>;
}

export default AppOwnerProvider;
