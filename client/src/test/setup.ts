/**
 * Vitest setup: jsdom matchers + module doubles.
 *
 * `@rhino-dev/rhino-react` is replaced by `./rhinoMock` (a controllable fake)
 * and `@/codalio/session` by `./sessionMock`, so a component test can drive the
 * exact payloads the page renders without an HTTP server. The backend halves of
 * the same acceptance criteria are proven by Minitest under `server/test`.
 */
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { resetRhinoMockState } from './rhinoMock';
import { resetSessionMockState } from './sessionMock';

vi.mock('@rhino-dev/rhino-react', async () => await import('./rhinoMock'));
vi.mock('@/codalio/session', async () => await import('./sessionMock'));

beforeEach(() => {
  resetRhinoMockState();
  resetSessionMockState();
});

afterEach(() => {
  cleanup();
});
