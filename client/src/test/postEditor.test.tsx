/**
 * Client-only acceptance criteria for the post editor.
 *
 *   AC-2  — the rich-text body is entered in the editor and persisted as `content`
 *   AC-4  — the "Live Markdown Preview" tab renders the in-editor state
 *   AC-11 — edit mode loads an existing post and modifies its text and media
 *   AC-19 — the embed affordance lives in the content-team editor
 *   AC-20 — an uploaded video is selected from the media library and attached
 *   AC-21 — the attached video is displayed in the post preview
 *
 * The backend halves of the same criteria (the `content` round-trip, the 403
 * for a contributor attaching a video, the embedded video in the post payload)
 * are proven by `server/test/integration/post_editing_api_test.rb`.
 */
import { describe, it, expect } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PostEditorPage from '@/components/posts/PostEditorPage';
import { renderPage } from '@/test/renderPage';
import { rhinoMockState } from '@/test/rhinoMock';

const LIBRARY_VIDEO = {
  id: 42,
  title: 'Distributed Streaming Benchmarks',
  format: 'mp4',
  file_size: '142.4 MB',
  duration: '12:40',
  url: 'https://cdn.example.com/benchmarks.mp4',
};

function renderEditor(route = '/create-post', path = '/create-post') {
  return renderPage(<PostEditorPage />, { route, path });
}

describe('PostEditorPage — client-only acceptance criteria', () => {
  it('AC-2: the body textarea is bound to state and persisted as `content`', async () => {
    const user = userEvent.setup();
    renderEditor();

    // The rich-text surface is the markdown textarea the design ships.
    const textarea = screen.getByPlaceholderText(/Write your article narrative here/i);
    await user.clear(textarea);
    await user.type(textarea, '## Heading\n\nA formatted body.');

    await user.click(screen.getByRole('button', { name: /Save Draft/i }));

    const call = rhinoMockState.mutationCalls.find(
      (c) => c.hook === 'store' && c.model === 'posts',
    );
    expect(call).toBeDefined();
    expect((call!.vars as Record<string, unknown>).content).toBe('## Heading\n\nA formatted body.');
    expect((call!.vars as Record<string, unknown>).status).toBe('draft');
  });

  it('AC-4: the Live Markdown Preview tab renders the in-editor title and body', async () => {
    const user = userEvent.setup();
    renderEditor();

    const titleInput = screen.getByLabelText(/Article Title/i);
    await user.clear(titleInput);
    await user.type(titleInput, 'Preview Me');

    const textarea = screen.getByPlaceholderText(/Write your article narrative here/i);
    await user.clear(textarea);
    await user.type(textarea, 'Body shown in the preview.');

    await user.click(screen.getByRole('tab', { name: /Live Markdown Preview/i }));

    // The preview panel renders the editor state, not a server round-trip.
    expect(screen.getByRole('heading', { name: 'Preview Me' })).toBeInTheDocument();
    expect(screen.getByText('Body shown in the preview.')).toBeInTheDocument();
    expect(rhinoMockState.mutationCalls).toHaveLength(0);
  });

  it('AC-11: edit mode loads the post and saves text changes through useModelUpdate', async () => {
    rhinoMockState.modelShow.posts = {
      id: 7,
      title: 'Existing Article',
      slug: 'existing-article',
      category: 'Engineering',
      tags: ['streaming'],
      content: 'The original body.',
      status: 'published',
      videos: [],
    };

    const user = userEvent.setup();
    renderEditor('/create-post/7', '/create-post/:postId');

    // The editor hydrates from the loaded post.
    const textarea = screen.getByPlaceholderText(/Write your article narrative here/i);
    expect(textarea).toHaveValue('The original body.');
    expect(screen.getByLabelText(/Article Title/i)).toHaveValue('Existing Article');

    await user.clear(textarea);
    await user.type(textarea, 'The corrected body.');
    await user.click(screen.getByRole('button', { name: /Save Draft/i }));

    const call = rhinoMockState.mutationCalls.find(
      (c) => c.hook === 'update' && c.model === 'posts',
    );
    expect(call).toBeDefined();
    const vars = call!.vars as { id: number; data: Record<string, unknown> };
    expect(vars.id).toBe(7);
    expect(vars.data.content).toBe('The corrected body.');
  });

  it('AC-11: edit mode surfaces the post’s attached media', () => {
    rhinoMockState.modelShow.posts = {
      id: 7,
      title: 'Existing Article',
      content: 'Body',
      status: 'published',
      videos: [LIBRARY_VIDEO],
    };

    renderEditor('/create-post/7', '/create-post/:postId');

    // The attached asset's title and size are shown in the video panel.
    expect(screen.getByText(LIBRARY_VIDEO.title)).toBeInTheDocument();
    expect(screen.getByText(/142\.4 MB/)).toBeInTheDocument();
  });

  it('AC-19/AC-20: the media picker lists library assets and attaches the selected one', async () => {
    rhinoMockState.modelIndex.videos = { data: [LIBRARY_VIDEO], pagination: null };
    rhinoMockState.modelShow.posts = {
      id: 7,
      title: 'Existing Article',
      content: 'Body',
      status: 'draft',
      videos: [],
    };

    const user = userEvent.setup();
    renderEditor('/create-post/7', '/create-post/:postId');

    // The embed affordance is the editor's media-library picker.
    await user.click(screen.getByRole('button', { name: /More actions/i }));
    await user.click(await screen.findByText('Insert from Media Library'));

    const picker = await screen.findByRole('dialog');
    const item = within(picker).getByTestId(`media-picker-item-${LIBRARY_VIDEO.id}`);
    expect(within(item).getByText(LIBRARY_VIDEO.title)).toBeInTheDocument();

    await user.click(item);

    // Selecting the asset attaches it to the post by setting the video's post_id.
    const call = rhinoMockState.mutationCalls.find(
      (c) => c.hook === 'update' && c.model === 'videos',
    );
    expect(call).toBeDefined();
    expect(call!.vars).toEqual({ id: LIBRARY_VIDEO.id, data: { post_id: 7 } });
  });

  it('AC-21: the attached video is displayed in the post preview', async () => {
    rhinoMockState.modelIndex.videos = { data: [LIBRARY_VIDEO], pagination: null };
    rhinoMockState.modelShow.posts = {
      id: 7,
      title: 'Existing Article',
      content: 'Body',
      status: 'draft',
      videos: [],
    };

    const user = userEvent.setup();
    renderEditor('/create-post/7', '/create-post/:postId');

    await user.click(screen.getByRole('button', { name: /More actions/i }));
    await user.click(await screen.findByText('Insert from Media Library'));
    await user.click(await screen.findByTestId(`media-picker-item-${LIBRARY_VIDEO.id}`));

    await user.click(screen.getByRole('tab', { name: /Live Markdown Preview/i }));

    const embedded = screen.getByTestId('preview-embedded-video');
    expect(within(embedded).getByText(LIBRARY_VIDEO.title)).toBeInTheDocument();
    expect(within(embedded).getByText(/12:40/)).toBeInTheDocument();
  });
});
