# ── Stage 1: Build ──────────────────────────────────────────────────────────
# Use a Maven image that includes Java 17. This stage downloads dependencies
# and compiles the Spring Boot JAR. Using the Maven image directly avoids
# line-ending issues with the mvnw wrapper script on Windows.
# FROM maven:3.9-eclipse-temurin-17-alpine AS build
FROM docker-dev-local.logistics.corp/maven-temurin-21-certs:v1 as build

WORKDIR /app

# Copy the dependency manifest first. Docker caches each layer — if pom.xml
# hasn't changed, Maven won't re-download all dependencies on the next build.
COPY pom.xml .
# RUN mvn dependency:go-offline -q

# Copy source code and build. -DskipTests skips unit tests in the image build;
# run them separately in CI. The result is a single fat JAR in target/.
COPY src ./src
RUN mvn package -Dmaven.test.skip=true

# ── Stage 2: Runtime ─────────────────────────────────────────────────────────
# Use a minimal JRE (not full JDK) image. This keeps the final image small
# (~200MB vs ~500MB) and reduces the attack surface.
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Copy only the compiled JAR from the build stage — not Maven, source code, etc.
COPY --from=build /app/target/*.jar app.jar

# The uploads directory must exist inside the container. The actual files
# will be stored on a Kubernetes PersistentVolume mounted at /app/uploads.
RUN mkdir -p uploads

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
