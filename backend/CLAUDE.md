# Backend – CLAUDE.md

## Stack
- Java 17, Spring Boot 3.5.5
- Spring Data JPA + H2 in-memory database
- Lombok (used on all entities and services)
- Maven wrapper (`mvnw`)

## Run
```bash
# From /backend
mvnw.cmd spring-boot:run          # Windows
./mvnw spring-boot:run            # Mac / Linux
```
Server: http://localhost:8080
H2 console: http://localhost:8080/h2-console
JDBC URL: `jdbc:h2:mem:blogdb` | user: `sa` | password: *(empty)*

## Package structure
```
com.blog/
├── config/         WebConfig (CORS + static /uploads/**), StorageConfig (creates uploads dir), DataInitializer (seed posts)
├── controller/     PostController, ImageController
├── dto/            PostResponse, PostSummaryResponse, PagedResponse<T>
├── entity/         Post, Tag
├── exception/      ResourceNotFoundException, GlobalExceptionHandler
├── repository/     PostRepository, TagRepository
└── service/        PostService (interface), PostServiceImpl, ImageService
```

## Key conventions

### Entities
- Use Lombok `@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder` on every entity.
- Collections annotated with `@Builder.Default` to avoid NPE when using the builder.
- `@CreationTimestamp` / `@UpdateTimestamp` for audit fields — never set them manually.

### DTOs
- Separate response types per use-case: `PostSummaryResponse` (list view, no `content` field) and `PostResponse` (detail view, includes `content`).
- DTOs are plain `@Data @Builder` Lombok classes. No Jackson annotations needed.
- Tags are projected as `Set<String>` (tag names only) in all DTOs — clients never see tag IDs.

### Services
- All service methods live behind a `PostService` interface; `PostServiceImpl` is the only implementation.
- `@Transactional` on the class, `@Transactional(readOnly = true)` on read-only methods.
- Tag resolution: `resolveTags(String csv)` finds-or-creates each tag by name within the same transaction.

### Controllers
- All multipart endpoints use `consumes = MediaType.MULTIPART_FORM_DATA_VALUE`.
- Text fields come in as `@RequestParam`, the file as `@RequestParam(value="coverImage", required=false) MultipartFile`.
- Never use `@RequestPart` with a JSON part — all fields are plain form fields.

### Image storage
- `ImageService.store(MultipartFile)` renames files to `UUID + original extension` and writes them under the `uploads/` directory (relative to working directory when run from `/backend`).
- Returns a server-relative URL string: `/uploads/<filename>`.
- `WebConfig` maps `/uploads/**` → `file:uploads/` (filesystem) so files are served directly by Spring MVC.
- `StorageConfig` creates the `uploads/` directory at startup via `@PostConstruct`.

### Error handling
- Throw `ResourceNotFoundException` for 404s — `GlobalExceptionHandler` turns it into a structured JSON response.
- `Map.of("url", value)` will throw NPE if `value` is null — always guard before constructing such maps.

## Database
- `spring.jpa.hibernate.ddl-auto=create-drop` — schema is rebuilt and seed data reloaded on every restart.
- To persist data across restarts change the datasource URL to `jdbc:h2:file:./data/blogdb`.
- `DataInitializer` (ApplicationRunner) seeds 3 posts on startup — remove or gate it behind a property when adding real content.

## CORS
Allowed origins: `http://localhost:5173`, `http://localhost:3000`.
To allow additional origins, edit `WebConfig.addCorsMappings`.

## What NOT to do
- Do not add Spring Security without also configuring it to permit H2 console and API endpoints.
- Do not store images as database BLOBs — keep them on disk and serve via the static resource handler.
- Do not set `FetchType.EAGER` on the `Post.tags` collection — use `@Transactional` service methods to load them lazily within a session.
