#!/bin/bash
# Vendor prototype pages verbatim into the client, rewriting only import paths
# so the files resolve under the client's `@/` alias. No JSX/className changes.
set -u
cd "$(dirname "$0")/.."

declare -A MAP=(
  [Landing]=client/src/components/dashboard/DashboardPage.tsx
  [Login]=client/src/components/auth/LoginPage.tsx
  [CreatePost]=client/src/components/posts/PostEditorPage.tsx
  [MediaLibrary]=client/src/components/media/MediaLibraryPage.tsx
  [Analytics]=client/src/components/analytics/AnalyticsPage.tsx
  [Admin]=client/src/components/admin/AdminOverviewPage.tsx
  [AdminUsers]=client/src/components/admin/AdminUsersPage.tsx
  [AdminApiIntegrations]=client/src/components/admin/AdminIntegrationsPage.tsx
  [AdminSystemSettings]=client/src/components/admin/AdminSystemSettingsPage.tsx
  [AdminSystemReports]=client/src/components/admin/AdminSystemReportsPage.tsx
)

for name in "${!MAP[@]}"; do
  src=".codalio/ui-prototype/files/pages/$name.tsx"
  dst="${MAP[$name]}"
  mkdir -p "$(dirname "$dst")"
  sed -e 's#from "\.\./components/ui/#from "@/components/ui/#g' \
      -e 's#from "\.\./components/ContentStatusBadge"#from "@/components/shared/ContentStatusBadge"#g' \
      -e 's#from "\.\./components/StatCard"#from "@/components/shared/StatCard"#g' \
      -e 's#from "\.\./components/VideoPlayerModal"#from "@/components/shared/VideoPlayerModal"#g' \
      "$src" > "$dst"
  echo "vendored $name -> $dst"
done
