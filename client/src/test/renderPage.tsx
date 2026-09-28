/**
 * Shared render helper for the client-only acceptance-criteria suite.
 *
 * Every page under test uses `react-router-dom` hooks and TanStack Query, so
 * the helper mounts the component inside a `MemoryRouter` + `QueryClientProvider`
 * with retries disabled (a mocked `api` never rejects, but a deterministic
 * client keeps the assertions synchronous).
 */
import React from 'react';
import { render, type RenderResult } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });
}

export interface RenderPageOptions {
  /** Initial history entry, e.g. `/create-post/7`. */
  route?: string;
  /** Route pattern the component is mounted at, e.g. `/create-post/:postId`. */
  path?: string;
  /** Extra routes rendered alongside (for redirect assertions). */
  extraRoutes?: React.ReactNode;
  /** Child routes rendered inside `ui` when it is a layout (e.g. a guard). */
  childRoutes?: React.ReactNode;
}

export function renderPage(
  ui: React.ReactElement,
  { route = '/', path = '*', extraRoutes, childRoutes }: RenderPageOptions = {},
): RenderResult {
  const client = createTestQueryClient();
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path={path} element={ui}>
            {childRoutes}
          </Route>
          {extraRoutes}
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

/** Renders a bare element (no router) — for presentational components. */
export function renderBare(ui: React.ReactElement): RenderResult {
  const client = createTestQueryClient();
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}
