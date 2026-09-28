/**
 * Client-only acceptance criteria for the admin surfaces.
 *
 *   AC-60 — the admin overview at /admin lists the four admin modules and shows
 *           infrastructure health.
 *   AC-65 — a content_manager, editor or contributor is redirected away from
 *           every /admin/* route, while admin is allowed.
 *   AC-70 — the integrations admin surface is served at /admin/api-integrations.
 *
 * The backend halves (every admin resource returns 403 for a content role and
 * 200 for admin; the health endpoint's four tiles) are proven by
 * `server/test/integration/rbac_test.rb` and
 * `server/test/integration/admin_surfaces_api_test.rb`.
 */
import { describe, it, expect } from 'vitest';
import { screen, within } from '@testing-library/react';
import { Route } from 'react-router-dom';
import AdminOverviewPage from '@/components/admin/AdminOverviewPage';
import AdminIntegrationsPage from '@/components/admin/AdminIntegrationsPage';
import { RoleProtectedRoute } from '@/routes/guards';
import { renderPage } from '@/test/renderPage';
import { rhinoMockState } from '@/test/rhinoMock';
import { sessionMockState } from '@/test/sessionMock';

const HEALTH = {
  api_gateway: { label: 'API Gateway', status: 'Operational', value: '99.99%', detail: 'p95 42ms' },
  db_replica: { label: 'DB Read Replica', status: 'Healthy', value: '12ms', detail: 'lag 0.2s' },
  video_storage: { label: 'Video Storage', status: '64% used', value: '32 TB', detail: 'CDN warm' },
  security_perimeter: { label: 'Security Perimeter', status: 'Secure', value: '0 threats', detail: 'WAF active' },
};

const ADMIN_MODULE_PATHS = [
  '/admin/users',
  '/admin/api-integrations',
  '/admin/system-settings',
  '/admin/system-reports',
];

describe('AdminOverviewPage — client-only acceptance criteria', () => {
  it('AC-60: the overview lists the four admin modules', () => {
    rhinoMockState.apiResponses['/system/health'] = HEALTH;

    renderPage(<AdminOverviewPage />, { route: '/admin', path: '/admin' });

    ADMIN_MODULE_PATHS.forEach((path) => {
      expect(screen.getByTestId(`admin-module-${path}`)).toBeInTheDocument();
    });
  });

  it('AC-60: the overview shows infrastructure health from the health endpoint', async () => {
    rhinoMockState.apiResponses['/system/health'] = HEALTH;

    renderPage(<AdminOverviewPage />, { route: '/admin', path: '/admin' });

    expect(await screen.findByText('Infrastructure & CDN Health')).toBeInTheDocument();
    expect(await screen.findByText('99.99%')).toBeInTheDocument();
    expect(screen.getByText('12ms')).toBeInTheDocument();
    expect(screen.getByText('32 TB')).toBeInTheDocument();
    expect(screen.getByText('0 threats')).toBeInTheDocument();
  });
});

describe('RoleProtectedRoute — the /admin/* gate (AC-65)', () => {
  function renderGuardedAdmin() {
    return renderPage(<RoleProtectedRoute roles={['admin']} />, {
      route: '/admin/users',
      path: '/admin',
      childRoutes: <Route path="users" element={<div data-testid="admin-users">Admin Users</div>} />,
      extraRoutes: <Route path="/" element={<div data-testid="dashboard-home">Dashboard</div>} />,
    });
  }

  it('AC-65: an admin reaches the /admin/* route', () => {
    sessionMockState.user = {
      id: 1,
      email: 'administrator@example.com',
      name: 'Administrator',
      roles: [{ id: 1, name: 'Admin', slug: 'admin' }],
    };

    renderGuardedAdmin();

    expect(screen.getByTestId('admin-users')).toBeInTheDocument();
    expect(screen.queryByTestId('dashboard-home')).not.toBeInTheDocument();
  });

  it.each([
    ['content_manager', 'Content Manager'],
    ['editor', 'Editor'],
    ['contributor', 'Contributor'],
  ])('AC-65: a %s is redirected away from /admin/*', (slug, name) => {
    sessionMockState.user = {
      id: 2,
      email: `${slug}@example.com`,
      name,
      roles: [{ id: 2, name, slug }],
    };

    renderGuardedAdmin();

    // Redirected to the dashboard — the admin page never renders.
    expect(screen.getByTestId('dashboard-home')).toBeInTheDocument();
    expect(screen.queryByTestId('admin-users')).not.toBeInTheDocument();
  });

  it('AC-65: a user with no resolved roles is not treated as privileged', () => {
    sessionMockState.user = {
      id: 3,
      email: 'nobody@example.com',
      name: 'Nobody',
      roles: [],
    };

    renderGuardedAdmin();

    expect(screen.getByTestId('dashboard-home')).toBeInTheDocument();
    expect(screen.queryByTestId('admin-users')).not.toBeInTheDocument();
  });
});

describe('AdminIntegrationsPage — the sitemap route (AC-70)', () => {
  it('AC-70: the integrations surface renders at /admin/api-integrations', () => {
    rhinoMockState.modelIndex.integrations = {
      data: [
        { id: 1, name: 'Mailchimp', category: 'Marketing Automation', connected: true, description: 'Email' },
      ],
      pagination: null,
    };
    rhinoMockState.modelIndex.api_tokens = { data: [], pagination: null };
    rhinoMockState.modelIndex.webhooks = { data: [], pagination: null };

    renderPage(<AdminIntegrationsPage />, {
      route: '/admin/api-integrations',
      path: '/admin/api-integrations',
    });

    // The page mounts at the sitemap/prototype path and renders its sections.
    expect(screen.getByText(/Syndication & Analytics Channels/i)).toBeInTheDocument();
    expect(screen.getByText('Active API Tokens')).toBeInTheDocument();
    expect(screen.getByText('Outgoing Webhook Endpoints')).toBeInTheDocument();
    expect(screen.getByText('Mailchimp')).toBeInTheDocument();
  });
});
