import { Navigate, Route } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { AppOwnerProvider } from '@/contexts/AppOwnerProvider';
import { AuthenticatedRoute, RoleProtectedRoute } from '@/routes/guards';
import LoginPage from '@/components/auth/LoginPage';
import SignUpPage from '@/components/auth/SignUpPage';
import ResetPasswordPage from '@/components/auth/ResetPasswordPage';
import DashboardPage from '@/components/dashboard/DashboardPage';
import PostEditorPage from '@/components/posts/PostEditorPage';
import MediaLibraryPage from '@/components/media/MediaLibraryPage';
import AnalyticsPage from '@/components/analytics/AnalyticsPage';
import AdminOverviewPage from '@/components/admin/AdminOverviewPage';
import AdminUsersPage from '@/components/admin/AdminUsersPage';
import AdminIntegrationsPage from '@/components/admin/AdminIntegrationsPage';
import AdminSystemSettingsPage from '@/components/admin/AdminSystemSettingsPage';
import AdminSystemReportsPage from '@/components/admin/AdminSystemReportsPage';

/**
 * Flat-route registration.
 *
 * `routing_scheme` is "flat": paths carry no `:baseOwnerId` segment, so the
 * Layout (which calls `useRoles()`/`useUserRole()`) is wrapped in
 * `AppOwnerProvider` — never upstream `BaseOwnerProvider`, which would rewrite
 * the URL to `/<orgId>/` and bounce every nav click home.
 *
 * Auth pages are standalone full-screen routes OUTSIDE the logged-in shell, so
 * an anonymous visitor reaches them without the sidebar chrome.
 */
export const customRoutes = () => [
  // Public auth routes — outside the authenticated guard AND outside the shell.
  <Route key="login" path="/login" element={<LoginPage />} />,
  <Route key="signin" path="/auth/signin" element={<LoginPage />} />,
  <Route key="signup" path="/auth/signup" element={<SignUpPage />} />,
  <Route key="reset" path="/auth/reset-password" element={<ResetPasswordPage />} />,

  <Route
    key="layout"
    element={
      <AppOwnerProvider>
        <AppLayout />
      </AppOwnerProvider>
    }
  >
    <Route element={<AuthenticatedRoute />}>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/create-post" element={<PostEditorPage />} />
      <Route path="/create-post/:postId" element={<PostEditorPage />} />
      <Route path="/media-library" element={<MediaLibraryPage />} />
      <Route path="/analytics" element={<AnalyticsPage />} />

      <Route element={<RoleProtectedRoute roles={['admin']} />}>
        <Route path="/admin" element={<AdminOverviewPage />} />
        <Route path="/admin/users" element={<AdminUsersPage />} />
        <Route path="/admin/api-integrations" element={<AdminIntegrationsPage />} />
        <Route path="/admin/system-settings" element={<AdminSystemSettingsPage />} />
        <Route path="/admin/system-reports" element={<AdminSystemReportsPage />} />
      </Route>
    </Route>
  </Route>,

  <Route key="catchall" path="*" element={<Navigate to="/" replace />} />,
];
