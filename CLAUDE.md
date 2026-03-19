# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Full-stack blog engine: React + TypeScript frontend (Vite) + Spring Boot backend (Java 17). Features paginated post listings, a live Markdown editor, cover image upload, inline image insertion, and tag management. Uses an H2 in-memory database seeded with 3 posts on every startup.

## Running the project

**Backend** (start first):
```bash
cd backend
mvnw.cmd spring-boot:run          # Windows
./mvnw spring-boot:run            # Mac / Linux
# → http://localhost:8080
# → H2 console: http://localhost:8080/h2-console  (JDBC: jdbc:h2:mem:blogdb, user: sa, password: empty)
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
npm run build      # tsc type-check + Vite production build
```

## Architecture

```
blog-claude/
├── backend/   Spring Boot REST API
└── frontend/  React SPA
```

**How they connect:**
- Frontend reads `VITE_API_BASE_URL` from `frontend/.env` (default: `http://localhost:8080`).
- All API calls go through `frontend/src/api/axiosInstance.ts` which sets the base URL and provides a global error-toast interceptor.
- Images uploaded via `POST /api/images/upload` are stored on disk under `backend/uploads/` and served at `GET /uploads/{filename}` via Spring MVC's static resource handler. The frontend builds absolute URLs as `` `${API_BASE}${post.coverImageUrl}` ``.
- Backend CORS allows `localhost:5173` and `localhost:3000` (configured in `WebConfig`).

**Data flow for creating/editing a post:**
1. Frontend builds a `FormData` object (title, content, tags CSV, optional `coverImage` file) — never sets `Content-Type` manually.
2. `POST /api/posts` or `PUT /api/posts/{id}` receives it as `@RequestParam` fields + `MultipartFile`.
3. `PostServiceImpl` calls `ImageService.store()` for any image, then `resolveTags()` to find-or-create `Tag` entities, then saves `Post`.
4. Response uses `PostResponse` DTO (detail view) or `PostSummaryResponse` (list view, no `content` field).

**Tag model:** `Post` ↔ `Tag` is ManyToMany. Tags are shared across posts. DTOs project tags as `Set<String>` (names only — clients never see tag IDs).

**Database:** `ddl-auto=create-drop` — schema and seed data are recreated on every restart. To persist across restarts, change the datasource URL to `jdbc:h2:file:./data/blogdb`.

## Subdirectory guides

Each subdirectory has its own detailed CLAUDE.md covering stack, conventions, and "what NOT to do":

- [`backend/CLAUDE.md`](backend/CLAUDE.md) — Java conventions, entity/DTO/service patterns, image storage, CORS, error handling
- [`frontend/CLAUDE.md`](frontend/CLAUDE.md) — Component layout, axios/FormData rules, toast conventions, markdown editor usage
