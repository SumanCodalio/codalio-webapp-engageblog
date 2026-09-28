/**
 * Test double for `@rhino-dev/rhino-react`.
 *
 * The client-only acceptance criteria are about what the React layer renders
 * and which hook payload it sends — not about the HTTP transport (the backend
 * halves are proven by Minitest under `server/test`). This module therefore
 * replaces the library with a controllable, inspectable fake:
 *
 *   - `rhinoMockState.modelIndex[model]`  — the envelope `useModelIndex` returns
 *   - `rhinoMockState.modelShow[model]`   — the record `useModelShow` returns
 *   - `rhinoMockState.apiResponses[path]` — the body `api.get(path)` resolves
 *   - `rhinoMockState.mutationCalls`      — every `mutate()` payload, in order
 *
 * Tests mutate the state in `beforeEach` and assert on the rendered DOM or on
 * the recorded mutation payloads.
 */
import { vi } from 'vitest';

export interface MutationCall {
  hook: 'store' | 'update' | 'delete' | 'restore' | 'forceDelete' | 'invite' | 'nested';
  model: string;
  vars: unknown;
}

export const rhinoMockState = {
  auth: {
    token: 'test-token' as string | null,
    isAuthenticated: true,
    login: vi.fn(),
    logout: vi.fn(),
    setOrganization: vi.fn(),
    setRouteGroup: vi.fn(),
  },
  organization: 'demo-org' as string | null,
  routeGroup: null as string | null,
  modelIndex: {} as Record<string, { data: unknown[]; pagination: unknown }>,
  modelShow: {} as Record<string, unknown>,
  apiResponses: {} as Record<string, unknown>,
  mutationCalls: [] as MutationCall[],
  /** Per-call `onSuccess` result handed back to the component. */
  mutationResult: { id: 1 } as unknown,
  /** When set, mutations invoke `onError` with this value instead. */
  mutationError: null as unknown,
};

export function resetRhinoMockState() {
  rhinoMockState.auth.token = 'test-token';
  rhinoMockState.auth.isAuthenticated = true;
  rhinoMockState.auth.login.mockReset();
  rhinoMockState.auth.logout.mockReset();
  rhinoMockState.auth.setOrganization.mockReset();
  rhinoMockState.auth.setRouteGroup.mockReset();
  rhinoMockState.organization = 'demo-org';
  rhinoMockState.routeGroup = null;
  rhinoMockState.modelIndex = {};
  rhinoMockState.modelShow = {};
  rhinoMockState.apiResponses = {};
  rhinoMockState.mutationCalls = [];
  rhinoMockState.mutationResult = { id: 1 };
  rhinoMockState.mutationError = null;
}

function record(hook: MutationCall['hook'], model: string, vars: unknown) {
  rhinoMockState.mutationCalls.push({ hook, model, vars });
}

function mutation(hook: MutationCall['hook'], model: string) {
  const mutate = vi.fn(
    (
      vars: unknown,
      options?: { onSuccess?: (r: unknown) => void; onError?: (e: unknown) => void },
    ) => {
      record(hook, model, vars);
      if (rhinoMockState.mutationError) {
        options?.onError?.(rhinoMockState.mutationError);
      } else {
        options?.onSuccess?.(rhinoMockState.mutationResult);
      }
    },
  );
  return {
    mutate,
    mutateAsync: vi.fn(async (vars: unknown) => {
      record(hook, model, vars);
      if (rhinoMockState.mutationError) throw rhinoMockState.mutationError;
      return rhinoMockState.mutationResult;
    }),
    isPending: false,
    isSuccess: false,
    isError: false,
    error: null,
    data: undefined,
    reset: vi.fn(),
  };
}

export function useModelIndex(model: string) {
  const entry = rhinoMockState.modelIndex[model] ?? { data: [], pagination: null };
  return { data: entry, isLoading: false, isError: false, error: null, refetch: vi.fn() };
}

export function useModelShow(model: string) {
  return {
    data: rhinoMockState.modelShow[model] ?? null,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  };
}

export function useModelTrashed(model: string) {
  return useModelIndex(model);
}

export function useModelStore(model: string) {
  return mutation('store', model);
}

export function useModelUpdate(model: string) {
  return mutation('update', model);
}

export function useModelDelete(model: string) {
  return mutation('delete', model);
}

export function useModelRestore(model: string) {
  return mutation('restore', model);
}

export function useModelForceDelete(model: string) {
  return mutation('forceDelete', model);
}

export function useModelAudit() {
  return { data: { data: [], pagination: null }, isLoading: false, error: null };
}

export function useNestedOperations() {
  return mutation('nested', 'nested');
}

export function useInviteUser() {
  return mutation('invite', 'invitations');
}

export function useResendInvitation() {
  return mutation('invite', 'invitations');
}

export function useCancelInvitation() {
  return mutation('invite', 'invitations');
}

export function useAcceptInvitation() {
  return mutation('invite', 'invitations');
}

export function useAuth() {
  return {
    token: rhinoMockState.auth.token,
    isAuthenticated: rhinoMockState.auth.isAuthenticated,
    login: rhinoMockState.auth.login,
    logout: rhinoMockState.auth.logout,
    setOrganization: rhinoMockState.auth.setOrganization,
    setRouteGroup: rhinoMockState.auth.setRouteGroup,
  };
}

export function useOrganization() {
  return rhinoMockState.organization;
}

export function useRouteGroup() {
  return rhinoMockState.routeGroup;
}

export function useOwner() {
  return { data: null, isLoading: false, error: null };
}

export function useOrganizationExists() {
  return { exists: true, isLoading: false, error: null, organization: null };
}

export function useRegister() {
  return mutation('store', 'register');
}

export function usePasswordRecover() {
  return mutation('store', 'password/recover');
}

export function useResetPassword() {
  return mutation('store', 'password/reset');
}

export function useToast() {
  return { toasts: [], toast: vi.fn(() => ({ id: '1' })), dismiss: vi.fn() };
}

export function configureApi() {}

export function setOrganization(slug: string) {
  rhinoMockState.organization = slug;
  rhinoMockState.auth.setOrganization(slug);
}

export function setStorageAdapter() {}

export function buildAuthPath(action: string) {
  return `/auth/${action}`;
}

export function getRouteGroup() {
  return rhinoMockState.routeGroup;
}

export function getTenancy() {
  return 'path';
}

export function extractPaginationFromHeaders() {
  return null;
}

export function cn(...classes: unknown[]) {
  return classes.filter(Boolean).join(' ');
}

export const storage = {
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};

export const events = {
  emit: vi.fn(),
  subscribe: vi.fn(() => () => {}),
};

/** Resolves a canned body for a request path, falling back to an empty object. */
export const api = {
  get: vi.fn(async (url: string) => ({ data: rhinoMockState.apiResponses[url] ?? {} })),
  post: vi.fn(async (url: string) => ({ data: rhinoMockState.apiResponses[url] ?? {} })),
  put: vi.fn(async (url: string) => ({ data: rhinoMockState.apiResponses[url] ?? {} })),
  delete: vi.fn(async (url: string) => ({ data: rhinoMockState.apiResponses[url] ?? {} })),
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return children as React.ReactElement;
}

export default {
  api,
  configureApi,
  setOrganization,
  useAuth,
  useOrganization,
  useModelIndex,
  useModelShow,
  useModelStore,
  useModelUpdate,
  useModelDelete,
};
