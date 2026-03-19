# Frontend – CLAUDE.md

## Stack
- React 18, TypeScript (strict), Vite 5
- Tailwind CSS v3
- Axios v1 (`src/api/axiosInstance.ts`)
- `@uiw/react-md-editor` v3 — live markdown editor + preview renderer
- `react-hot-toast` — all user-facing notifications
- React Router v6

## Run
```bash
# From /frontend
npm install
npm run dev     # http://localhost:5173
npm run build   # type-check + Vite production build
```

## Environment
`VITE_API_BASE_URL` in `.env` (default `http://localhost:8080`).
All files read it as:
```ts
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
```

## Source layout
```
src/
├── api/
│   ├── axiosInstance.ts   Base URL, response error interceptor (auto-toast on errors)
│   ├── postApi.ts         getPosts, getPost, createPost, updatePost, deletePost
│   └── imageApi.ts        uploadImage → returns server-relative URL string
├── components/
│   ├── common/            LoadingSpinner, ErrorMessage, Pagination
│   ├── editor/            MarkdownEditor (editor + inline image upload button)
│   ├── layout/            Navbar, Footer
│   └── post/              PostCard, PostList, TagBadge
├── hooks/
│   ├── usePosts.ts        Paginated list; exposes { data, loading, error, page, setPage, refetch }
│   └── usePost.ts         Single post by id; exposes { post, loading, error, refetch }
├── pages/
│   ├── HomePage.tsx
│   ├── PostDetailPage.tsx
│   ├── CreatePostPage.tsx
│   └── NotFoundPage.tsx
└── types/index.ts         PostSummary, Post, PagedResponse<T>
```

## Critical: multipart / FormData uploads
**Never manually set `Content-Type: multipart/form-data` in axios.**
The browser must generate the header with its auto-created `boundary` parameter.
Overriding it strips the boundary, causing Spring/Tomcat to reject the body → "Network Error".

```ts
// CORRECT — axios + browser set Content-Type with boundary automatically
api.post('/api/posts', formData);

// WRONG — boundary is missing, server cannot parse the body
api.post('/api/posts', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
```
This applies to every `FormData` request: `createPost`, `updatePost`, and `uploadImage`.

## Error / toast conventions
- `axiosInstance.ts` interceptor fires a `toast.error(message)` for **every** failed request automatically.
- Components should **not** add a second error toast in their `catch` blocks — they'll double-toast.
- Pattern to follow in `catch` blocks that have a loading toast:
  ```ts
  const toastId = toast.loading('...');
  try {
    // ...
    toast.success('Done!', { id: toastId });
  } catch {
    toast.dismiss(toastId);   // dismiss loading; interceptor already showed the error
  }
  ```

## Markdown editor (`MarkdownEditor.tsx`)
- Wraps `@uiw/react-md-editor` with `preview="live"` split-pane mode.
- The "Insert Image" button uploads via `imageApi.uploadImage`, then appends `![name](url)` to the content string.
- Always wrap the editor in `<div data-color-mode="light">` to prevent dark-mode style bleed.
- Import the editor CSS once globally in `main.tsx`:
  ```ts
  import '@uiw/react-md-editor/markdown-editor.css';
  ```

## Displaying uploaded images
Cover images and inline images use absolute URLs:
```ts
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
<img src={`${API_BASE}${post.coverImageUrl}`} />
```
`post.coverImageUrl` is a server-relative path like `/uploads/abc123.jpg`.

## Types
`PostSummary` is used in the list view (no `content` field).
`Post extends PostSummary` adds `content: string` for the detail view.
`PagedResponse<T>` mirrors the backend DTO shape: `{ content, totalPages, totalElements, currentPage, pageSize }`.

## Routing (React Router v6)
| Path          | Page               |
|---------------|--------------------|
| `/`           | HomePage           |
| `/posts/:id`  | PostDetailPage     |
| `/create`     | CreatePostPage     |
| `*`           | NotFoundPage       |

## Tailwind notes
- `line-clamp-2` / `line-clamp-3` are core Tailwind v3 utilities (no plugin needed).
- No `@tailwindcss/typography` installed — markdown post bodies are rendered via the editor's own CSS, not prose classes.

## What NOT to do
- Do not add Redux or Zustand — `usePosts` / `usePost` hooks with `useState` + `useEffect` are sufficient.
- Do not set explicit `Content-Type` headers on `FormData` requests (see above).
- Do not show error toasts inside `catch` blocks — the axios interceptor handles them.
