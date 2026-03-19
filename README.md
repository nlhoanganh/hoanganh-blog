# Blog Engine

A full-stack blog engine built with Spring Boot (backend) and React + Tailwind CSS (frontend).

## Features

- Create blog posts with a live Markdown editor
- Upload a cover image per post
- Insert inline images directly into the Markdown content
- View a paginated list of all posts
- Read individual posts with rendered Markdown
- Delete posts
- Colourful tag badges with automatic colour assignment
- 3 seed posts loaded on startup

## Tech Stack

| Layer    | Technology                                          |
|----------|-----------------------------------------------------|
| Frontend | React 18, TypeScript, Tailwind CSS, Axios, Vite     |
| Editor   | @uiw/react-md-editor (live split-pane preview)      |
| Backend  | Java 21, Spring Boot 3, Spring Data JPA             |
| Database | H2 in-memory (auto-seeded on startup)               |
| Images   | Stored on disk under `backend/uploads/`             |

## Project Structure

```
blog-claude/
├── backend/                    Spring Boot Maven project
│   ├── src/main/java/com/blog/
│   │   ├── config/             CORS, storage init, seed data
│   │   ├── controller/         PostController, ImageController
│   │   ├── dto/                Request/response DTOs
│   │   ├── entity/             Post, Tag (JPA entities)
│   │   ├── exception/          Global error handler
│   │   ├── repository/         Spring Data JPA repos
│   │   └── service/            PostService, ImageService
│   └── src/main/resources/
│       └── application.properties
└── frontend/                   Vite + React + TypeScript
    └── src/
        ├── api/                Axios calls (postApi, imageApi)
        ├── components/
        │   ├── common/         Spinner, Error, Pagination
        │   ├── editor/         MarkdownEditor (with image upload)
        │   ├── layout/         Navbar, Footer
        │   └── post/           PostCard, PostList, TagBadge
        ├── hooks/              usePosts, usePost
        ├── pages/              HomePage, PostDetailPage, CreatePostPage
        └── types/              Shared TypeScript interfaces
```

## Running Locally

### Backend

```bash
cd backend
./mvnw spring-boot:run
# or on Windows:
mvnw.cmd spring-boot:run
```

> The server starts at **http://localhost:8080**
> H2 console: **http://localhost:8080/h2-console**
> JDBC URL: `jdbc:h2:mem:blogdb`, user: `sa`, password: *(empty)*

### Frontend

```bash
cd frontend
npm install
npm run dev
```

> Opens at **http://localhost:5173**

## API Reference

| Method | Endpoint                | Description                     |
|--------|-------------------------|---------------------------------|
| GET    | /api/posts              | Paginated post list             |
| GET    | /api/posts/{id}         | Single post                     |
| POST   | /api/posts              | Create post (multipart/form)    |
| PUT    | /api/posts/{id}         | Update post (multipart/form)    |
| DELETE | /api/posts/{id}         | Delete post                     |
| POST   | /api/images/upload      | Upload inline image             |
| GET    | /uploads/{filename}     | Serve uploaded file             |

## Notes

- Uploaded images are stored under `backend/uploads/` and survive the Spring Boot process but are cleared if you delete that directory.
- The H2 database is in-memory — all posts are lost on restart (seed data reloads automatically).
- To persist data across restarts, change `application.properties` to use a file-based H2 URL: `jdbc:h2:file:./data/blogdb`.
