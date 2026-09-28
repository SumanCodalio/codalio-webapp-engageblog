/**
 * Client-only acceptance criteria for the analytics dashboard.
 *
 *   AC-39 — metrics are presented in a visual format (the daily bar chart)
 *
 * The numeric contract behind the chart (`daily_series` buckets, the headline
 * totals, the range/content-type filters) is proven by
 * `server/test/integration/analytics_summary_api_test.rb`; this spec proves the
 * React layer actually renders the series as a chart rather than a table.
 */
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import AnalyticsPage from '@/components/analytics/AnalyticsPage';
import { renderPage } from '@/test/renderPage';
import { rhinoMockState } from '@/test/rhinoMock';

const SUMMARY = {
  total_impressions: 12840,
  unique_readers: 8210,
  engagement_rate: 42.5,
  watch_time_hours: 318,
  daily_series: [
    { date: '2026-09-21', impressions: 120 },
    { date: '2026-09-22', impressions: 340 },
    { date: '2026-09-23', impressions: 260 },
    { date: '2026-09-24', impressions: 480 },
  ],
  leaderboard: [
    { id: 1, title: 'Top Story', category: 'Engineering', has_video: true, view_count: 900 },
  ],
};

describe('AnalyticsPage — client-only acceptance criteria', () => {
  it('AC-39: the daily series is rendered as a visual bar chart', async () => {
    rhinoMockState.apiResponses['/analytics/summary'] = SUMMARY;

    renderPage(<AnalyticsPage />, { route: '/analytics', path: '/analytics' });

    // The chart container and one bar per daily bucket are rendered.
    const chart = await screen.findByTestId('analytics-daily-chart');
    expect(chart).toBeInTheDocument();
    const bars = await screen.findAllByTestId('analytics-chart-bar');
    expect(bars).toHaveLength(SUMMARY.daily_series.length);

    // The chart is labelled as a visualisation, not a raw table.
    expect(screen.getByText(/Audience Reach & Growth Over Time/i)).toBeInTheDocument();
  });

  it('AC-39: the headline metrics are rendered as cards alongside the chart', async () => {
    rhinoMockState.apiResponses['/analytics/summary'] = SUMMARY;

    renderPage(<AnalyticsPage />, { route: '/analytics', path: '/analytics' });

    expect(await screen.findByText('Total Impressions')).toBeInTheDocument();
    expect(await screen.findByText('12,840')).toBeInTheDocument();
    expect(screen.getByText('318 hrs')).toBeInTheDocument();
    expect(screen.getByText('42.5%')).toBeInTheDocument();
  });
});
