# ── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files first for layer caching (same reason as pom.xml in backend)
COPY package*.json ./
RUN npm ci

# ARG lets you pass a value at build time: docker build --build-arg VITE_API_BASE_URL=""
# ENV makes it available to the build process (Vite reads it during npm run build)
# When empty, axios will use relative URLs (/api/...) which nginx proxies to the backend.
ARG VITE_API_BASE_URL=""
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY . .
RUN npm run build
# Output is in /app/dist — a folder of static HTML/CSS/JS files

# ── Stage 2: Runtime ─────────────────────────────────────────────────────────
# nginx:alpine is only ~25MB. It serves static files extremely efficiently.
FROM nginx:alpine

# Replace the default nginx config with ours (which adds the proxy rules)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built React files into the directory nginx serves by default
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

# nginx starts automatically — no custom CMD needed
