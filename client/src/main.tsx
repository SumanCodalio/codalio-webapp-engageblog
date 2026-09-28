import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@rhino-dev/rhino-react';
import '@/lib/api';
import '@/styles.css';
import App from '@/App';
import ErrorBoundary from '@/components/ErrorBoundary';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

const container = document.getElementById('root');

if (!container) {
  // Never leave a silent blank page: surface the bootstrap failure in the DOM.
  document.body.innerHTML =
    '<div style="font-family:system-ui;padding:2rem;color:#b91c1c">' +
    'Failed to start — the #root element is missing from index.html.' +
    '</div>';
  throw new Error('root element not found');
}

createRoot(container).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
);
