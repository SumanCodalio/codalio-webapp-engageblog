/**
 * Client-only acceptance criteria for the dashboard at `/`.
 *
 *   AC-59 — the dashboard renders reach metrics (total reach, video watch
 *           hours, read completion, published stories) and a recent-posts list
 *           with status, category, view count and a video indicator.
 *
 * The data source behind the metrics (`/analytics/summary`) and the per-post
 * display fields are proven by
 * `server/test/integration/admin_surfaces_api_test.rb`; this spec proves the
 * React layer renders them.
 */
import { describe, it, expect } from 'vitest';
import { screen, within } from '@testing-library/react';
import DashboardPage from '@/components/dashboard/DashboardPage';
import { renderPage } from '@/test/renderPage';
import { rhinoMockState } from '@/test/rhinoMock';

const SUMMARY = {
  total_impressions: 12840,
  unique_readers: 8210,
  engagement_rate: 42.5,
  watch_time_hours: 318,
  daily_series: [],
  leaderboard: [],
};

const POSTS = [
  {
    id: 1,
    title: 'Published Video Story',
    category: 'Engineering',
    status: 'published',
    has_video: true,
    view_count: 4200,
    read_time_minutes: 6,
    published_at: '2026-09-20T10:00:00Z',
    videos: [{ id: 9, duration: '12:40' }],
  },
  {
    id: 2,
    title: 'Draft Article',
    category: 'Product Updates',
    status: 'draft',
    has_video: false,
    view_count: 0,
    read_time_minutes: 3,
    published_at: null,
    created_at: '2026-09-22T10:00:00Z',
    videos: [],
  },
];

describe('DashboardPage — client-only acceptance criteria', () => {
  it('AC-59: the four reach metric cards are rendered from the analytics summary', async () => {
    rhinoMockState.apiResponses['/analytics/summary'] = SUMMARY;
    rhinoMockState.modelIndex.posts = { data: POSTS, pagination: null };

    renderPage(<DashboardPage />, { route: '/', path: '/' });

    expect(await screen.findByTestId('dashboard-metric-Total Content Reach')).toBeInTheDocument();
    expect(screen.getByTestId('dashboard-metric-Video Watch Hours')).toBeInTheDocument();
    expect(screen.getByTestId('dashboard-metric-Avg. Read Completion')).toBeInTheDocument();
    expect(screen.getByTestId('dashboard-metric-Published Stories')).toBeInTheDocument();

    // The values come from the summary, not from hardcoded copy.
    expect(await screen.findByText('12,840')).toBeInTheDocument();
    expect(screen.getByText('318 hrs')).toBeInTheDocument();
    expect(screen.getByText('42.5%')).toBeInTheDocument();
  });

  it('AC-59: the recent-posts list shows status, category, view count and a video indicator', async () => {
    rhinoMockState.apiResponses['/analytics/summary'] = SUMMARY;
    rhinoMockState.modelIndex.posts = { data: POSTS, pagination: null };

    renderPage(<DashboardPage />, { route: '/', path: '/' });

    const videoRow = await screen.findByTestId('dashboard-post-row-1');
    expect(within(videoRow).getByText('Published Video Story')).toBeInTheDocument();
    expect(within(videoRow).getByText('Engineering')).toBeInTheDocument();
    expect(within(videoRow).getByText('Published')).toBeInTheDocument();
    expect(within(videoRow).getByText('4,200')).toBeInTheDocument();
    // The video indicator distinguishes a video story from a plain article.
    expect(within(videoRow).getByText('Video Story')).toBeInTheDocument();

    const draftRow = screen.getByTestId('dashboard-post-row-2');
    expect(within(draftRow).getByText('Draft')).toBeInTheDocument();
    expect(within(draftRow).getByText('Article')).toBeInTheDocument();
  });

  it('AC-59: the published-stories metric counts only published posts', async () => {
    rhinoMockState.apiResponses['/analytics/summary'] = SUMMARY;
    rhinoMockState.modelIndex.posts = { data: POSTS, pagination: null };

    renderPage(<DashboardPage />, { route: '/', path: '/' });

    const card = await screen.findByTestId('dashboard-metric-Published Stories');
    expect(within(card).getByText('1')).toBeInTheDocument();
    expect(within(card).getByText(/1 with embedded video/i)).toBeInTheDocument();
  });
});
