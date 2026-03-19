# Deploying Your Blog to Google Kubernetes Engine (GKE)

---

## Part 1: Architecture — What You're Building

Before touching any tool, understand what the end state looks like.

### Current (local) architecture

```
Your Browser
    ↓ http://localhost:5173
[Vite Dev Server]  ──API calls──→  [Spring Boot :8080]
                                         ↓
                                   [H2 in-memory DB]
                                   [uploads/ on disk]
```

### Target (GKE) architecture

```
Your Browser
    ↓ https://yourdomain.com
[Cloudflare Edge]              ← free CDN, DDoS protection, HTTPS termination
    ↓ (encrypted tunnel — no public IP needed on GCP)
[cloudflared Pod]              ← outbound tunnel daemon running inside the cluster
    ↓
[Frontend Pod: nginx]          ← serves your built React files
    │  /api/* and /uploads/*
    ↓ (internal network, never exposed to internet)
[Backend Pod: Spring Boot]
    ↓                  ↓
[H2 in-memory DB]   [uploads/ on a Persistent Disk]
```

**Key insight:** In production Kubernetes, the **frontend nginx container acts as a reverse proxy**. The browser only ever talks to one address. nginx decides whether to serve a static React file or forward the request to the Spring Boot backend. The backend is completely hidden from the internet.

**Why Cloudflare Tunnel instead of a GCP Load Balancer:** A GCP LoadBalancer Service costs ~$18/month just to exist. Cloudflare Tunnel is free — `cloudflared` opens an *outbound* connection from inside your cluster to Cloudflare's edge, so no public IP is ever provisioned on GCP. You also get HTTPS and DDoS protection for free.

---

## Part 2: Technology Glossary

Understanding these terms before you see them will save confusion.

| Term | What it is | Analogy |
|------|-----------|---------|
| **Container** | A packaged app + everything it needs to run | A shipping container — self-contained |
| **Docker image** | The blueprint for a container | A class definition (the container is the instance) |
| **Kubernetes (K8s)** | A system that runs and manages containers across multiple machines | A ship captain that decides where/how to run containers |
| **GKE** | Google's managed Kubernetes service | Google runs the Kubernetes control plane for you |
| **Pod** | The smallest unit in K8s — wraps one or more containers | A single running container (usually) |
| **Deployment** | A K8s object that says "run N copies of this pod, restart if it crashes" | A process manager like pm2 |
| **Service** | A stable network address for reaching pods | A load balancer in front of pods |
| **ClusterIP** | A Service type only reachable *inside* the cluster | Internal DNS name |
| **LoadBalancer** | A Service type that gets a public IP from GCP | Exposes a port to the internet |
| **PersistentVolumeClaim (PVC)** | A request for a piece of persistent disk storage | Mounting an external hard drive to a container |
| **Artifact Registry** | Google's private Docker image storage | Your private Docker Hub |
| **kubectl** | The command-line tool to talk to Kubernetes | Like `git` but for K8s |
| **Namespace** | A virtual partition inside one cluster | A folder that groups related K8s objects |
| **YAML manifest** | A file describing what K8s should create/run | Infrastructure as code |
| **Cloudflare Tunnel** | An outbound tunnel from your cluster to Cloudflare's edge — no public IP needed | A secret passage from inside your cluster to the internet |
| **cloudflared** | The daemon that creates and maintains the Cloudflare Tunnel | The process that keeps the tunnel alive |
| **Tunnel token** | A secret string that authenticates your `cloudflared` pod to Cloudflare | Like an API key for the tunnel |

---

## Part 3: All Steps at a Glance

1. **Install tools** — gcloud CLI, kubectl, Docker Desktop
2. **Create a Google Cloud project** — your billing & resource container
3. **Enable required Google APIs** — unlock GKE, Artifact Registry, etc.
4. **Create a GKE cluster** — the Kubernetes environment where your app lives
5. **Connect kubectl to your cluster** — so commands go to your cluster
6. **Create an Artifact Registry repository** — where your Docker images are stored
7. **Write the backend Dockerfile** — packages the Spring Boot JAR
8. **Write the frontend Dockerfile + nginx config** — builds React, serves it with nginx
9. **Make one code change** — make API URL work without hardcoding
10. **Build and push both Docker images** — upload them to Artifact Registry
11. **Write Kubernetes manifests** — YAML files describing every K8s object
12. **Set up Cloudflare Tunnel** — create the tunnel, store the token as a K8s Secret
13. **Deploy to the cluster** — apply all YAML files with kubectl
14. **Open your app via your domain**

---

## Part 4: Step-by-Step

---

### Step 1 — Install Tools

You need three tools on your machine.

**A) Docker Desktop**
You likely have this since you have basic Docker knowledge. If not: https://www.docker.com/products/docker-desktop/

Verify:
```bash
docker --version
# Docker version 24.x.x
```

**B) Google Cloud CLI (`gcloud`)**
This lets you talk to Google Cloud from your terminal.

Download and install from: https://cloud.google.com/sdk/docs/install

After installing, open a new terminal and initialize:
```bash
gcloud init
# Follow the prompts: log in with your Google account, choose a project (or create one)
```

**C) kubectl**
The Kubernetes command-line tool. Install it via gcloud (easiest way):
```bash
gcloud components install kubectl
```

Verify all three:
```bash
docker --version
gcloud --version
kubectl version --client
```

---

### Step 2 — Create a Google Cloud Project

A Google Cloud **project** is the top-level container for all your resources (clusters, images, disks, billing).

```bash
# Create a new project (replace "my-blog-project" with your preferred name)
gcloud projects create my-blog-project --name="My Blog"

# Set it as your active project for all future commands
gcloud config set project my-blog-project
```

**Enable billing** — Kubernetes costs money (even small clusters). You must attach a billing account:
1. Go to https://console.cloud.google.com/billing
2. Link your project to a billing account
3. GKE Autopilot (what we'll use) charges only for what your pods actually use. A small blog costs ~$5–15/month.

---

### Step 3 — Enable Required Google Cloud APIs

By default, most Google Cloud features are disabled. You enable them like unlocking features on a phone plan.

```bash
gcloud services enable \
  container.googleapis.com \
  artifactregistry.googleapis.com \
  compute.googleapis.com
```

- `container.googleapis.com` — enables GKE (Kubernetes)
- `artifactregistry.googleapis.com` — enables the Docker image registry
- `compute.googleapis.com` — enables virtual machines and persistent disks

This takes 1–2 minutes.

---

### Step 4 — Create a GKE Cluster

A **cluster** is the actual Kubernetes environment: a group of virtual machines managed by Google where your containers will run.

We use **Autopilot mode** — Google automatically manages the underlying machines, scaling, and security. You only define what you want to run, not how many VMs to use. This is ideal for beginners.

```bash
gcloud container clusters create-auto blog-cluster \
  --region=us-central1
```

- `blog-cluster` — name you choose for your cluster
- `--region=us-central1` — pick a region close to you or your users. Options: `us-central1`, `us-east1`, `europe-west1`, `asia-east1`, etc.

This takes **5–10 minutes**. Google is provisioning the entire Kubernetes control plane for you.

---

### Step 5 — Connect kubectl to Your Cluster

After the cluster is created, you need to tell `kubectl` which cluster to talk to. This command downloads credentials and configures kubectl automatically:

```bash
gcloud container clusters get-credentials blog-cluster \
  --region=us-central1
```

Verify kubectl can see the cluster:
```bash
kubectl get nodes
# Should show nodes with status Ready
```

---

### Step 6 — Create an Artifact Registry Repository

Artifact Registry is Google's private Docker image storage. You push your images here, and Kubernetes pulls them from here.

```bash
# Create a repository named "blog" in the same region as your cluster
gcloud artifacts repositories create blog \
  --repository-format=docker \
  --location=us-central1 \
  --description="Blog app images"
```

Authenticate Docker to push to this registry:
```bash
gcloud auth configure-docker us-central1-docker.pkg.dev
```

Your full image path format will be:
```
us-central1-docker.pkg.dev/my-blog-project/blog/IMAGE_NAME:TAG
```

---

### Step 7 — One Code Change (Important)

**Why this is needed:** Vite bakes `VITE_API_BASE_URL` into the JavaScript bundle at build time. In your current code, if that variable is empty, it falls back to `http://localhost:8080` — which doesn't exist in Kubernetes.

The solution: in Kubernetes, nginx will proxy all `/api/*` requests to the backend internally. So the frontend should use *relative* URLs (no hostname at all). We change the fallback from `localhost:8080` to an empty string.

In `frontend/src/api/axiosInstance.ts`, change line 5:

```ts
// BEFORE
baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',

// AFTER
baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080',
```

**What changed:** `||` → `??`

- `||` treats empty string as falsy → falls back to localhost
- `??` (nullish coalescing) only falls back when the value is `null` or `undefined`
- When we build the Docker image, we pass `VITE_API_BASE_URL=""` (empty string) → axios uses `""` as baseURL → all API calls become relative URLs like `/api/posts` → nginx proxies them to the backend

Your local dev is unchanged — `.env` still has `VITE_API_BASE_URL=http://localhost:8080`, which is a real non-null value.

---

### Step 8 — Write the Dockerfiles

Create these files in your project. Here's the full layout of everything you'll create:

```
blog-claude/
├── backend/
│   └── Dockerfile
├── frontend/
│   ├── Dockerfile
│   └── nginx.conf
└── k8s/
    ├── namespace.yaml
    ├── uploads-pvc.yaml
    ├── backend-deployment.yaml
    ├── backend-service.yaml
    ├── frontend-deployment.yaml
    └── frontend-service.yaml
```

#### A) `backend/Dockerfile`

A multi-stage build: stage 1 compiles the Java app, stage 2 creates a small runtime image without all the build tools.

```dockerfile
# ── Stage 1: Build ──────────────────────────────────────────────────────────
# Use a Maven image that includes Java 17. This stage downloads dependencies
# and compiles the Spring Boot JAR. Using the Maven image directly avoids
# line-ending issues with the mvnw wrapper script on Windows.
FROM maven:3.9-eclipse-temurin-17-alpine AS build

WORKDIR /app

# Copy the dependency manifest first. Docker caches each layer — if pom.xml
# hasn't changed, Maven won't re-download all dependencies on the next build.
COPY pom.xml .
RUN mvn dependency:go-offline -q

# Copy source code and build. -DskipTests skips unit tests in the image build;
# run them separately in CI. The result is a single fat JAR in target/.
COPY src ./src
RUN mvn package -DskipTests -q

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
```

#### B) `frontend/nginx.conf`

This is the core of the proxy architecture. nginx does two things: serves the React static files, and forwards API requests to the backend.

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    # ── Proxy: API calls ─────────────────────────────────────────────────────
    # The browser calls /api/posts, /api/images/upload, etc.
    # nginx forwards them to the backend Kubernetes Service named "backend-service"
    # on port 8080. "backend-service" is resolved via Kubernetes internal DNS —
    # it only works inside the cluster (never exposed to the internet).
    location /api/ {
        proxy_pass http://backend-service:8080/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        # Allow large file uploads (cover images, inline images)
        client_max_body_size 15M;
    }

    # ── Proxy: Uploaded files ─────────────────────────────────────────────────
    # Blog posts embed images as /uploads/uuid.jpg. These are served by Spring
    # Boot's static resource handler. nginx forwards the request to the backend.
    location /uploads/ {
        proxy_pass http://backend-service:8080/uploads/;
        proxy_set_header Host $host;
    }

    # ── Static files (React SPA) ──────────────────────────────────────────────
    # For any other path (/, /posts/42, /create), serve the built React files.
    # try_files checks for an actual file first (JS/CSS/images), then falls back
    # to index.html — this is required for React Router client-side routing.
    # Without this, refreshing /posts/42 would return a 404 from nginx.
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

#### C) `frontend/Dockerfile`

Also multi-stage: stage 1 builds the React app with Node.js, stage 2 is a tiny nginx image.

```dockerfile
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
```

---

### Step 9 — Build and Push Docker Images

Replace `my-blog-project` with your actual GCP project ID throughout.

```bash
# ── Backend ──────────────────────────────────────────────────────────────────
cd backend

docker build \
  -t us-central1-docker.pkg.dev/my-blog-project/blog/backend:v1 \
  .

docker push us-central1-docker.pkg.dev/my-blog-project/blog/backend:v1

# ── Frontend ──────────────────────────────────────────────────────────────────
cd ../frontend

docker build \
  --build-arg VITE_API_BASE_URL="" \
  -t us-central1-docker.pkg.dev/my-blog-project/blog/frontend:v1 \
  .

docker push us-central1-docker.pkg.dev/my-blog-project/blog/frontend:v1
```

What's happening:
- `docker build` runs your Dockerfile, producing a local image
- The tag (`-t`) gives the image a full address that Artifact Registry understands
- `docker push` uploads the image to your private registry in Google Cloud
- When Kubernetes runs your pod, it pulls the image from this address

---

### Step 10 — Write Kubernetes Manifests

#### A) `k8s/namespace.yaml`

A namespace logically groups all your blog's resources so they don't mix with other things you might deploy later.

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: blog
```

#### B) `k8s/uploads-pvc.yaml`

Your backend stores uploaded images to disk at `uploads/`. Kubernetes pods are ephemeral — if the pod restarts, its local disk is wiped. A PVC requests a persistent disk from GCP that survives pod restarts.

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: uploads-pvc
  namespace: blog
spec:
  # ReadWriteOnce: the disk can be mounted by one pod at a time.
  # This is fine because we run a single backend replica.
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      # 5GB is more than enough for a blog's images. GCP charges ~$0.10/GB/month.
      storage: 5Gi
  # "standard-rwo" is GCP's standard persistent SSD disk. GKE Autopilot
  # provisions it automatically when the first pod claims this PVC.
  storageClassName: standard-rwo
```

#### C) `k8s/backend-deployment.yaml`

A Deployment tells Kubernetes: "keep 1 copy of this container running at all times. If it crashes, restart it. If I push a new image, roll it out without downtime."

> **Replace `my-blog-project` with your actual GCP project ID.**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: blog
spec:
  replicas: 1
  # selector tells the Deployment which pods it manages (must match template labels)
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
        - name: backend
          # !! Replace "my-blog-project" with your actual GCP project ID
          image: us-central1-docker.pkg.dev/my-blog-project/blog/backend:v1
          ports:
            - containerPort: 8080
          env:
            # Override the upload directory to use an absolute path.
            # Spring Boot maps APP_UPLOAD_DIR → app.upload.dir via relaxed binding.
            - name: APP_UPLOAD_DIR
              value: /app/uploads
          volumeMounts:
            # Mount the persistent disk at /app/uploads so uploaded images
            # survive pod restarts.
            - name: uploads-storage
              mountPath: /app/uploads
          # Resource requests tell Autopilot how much CPU/memory to reserve.
          # Autopilot requires explicit requests — without them, pods won't schedule.
          resources:
            requests:
              cpu: "250m"       # 250 millicores = 0.25 vCPU
              memory: "512Mi"   # 512 megabytes
            limits:
              cpu: "500m"
              memory: "1Gi"
      volumes:
        # Link the volume name used in volumeMounts to the actual PVC
        - name: uploads-storage
          persistentVolumeClaim:
            claimName: uploads-pvc
```

#### D) `k8s/backend-service.yaml`

A Service gives pods a stable network address. Without a Service, pods have random IP addresses that change on every restart. This Service is type `ClusterIP` — only reachable from *inside* the cluster (specifically, from nginx running in the frontend pod).

```yaml
apiVersion: v1
kind: Service
metadata:
  name: backend-service   # This name is what nginx.conf references: proxy_pass http://backend-service:8080
  namespace: blog
spec:
  # ClusterIP = only reachable inside the cluster. The backend is NEVER exposed
  # directly to the internet — all traffic must go through the frontend nginx proxy.
  type: ClusterIP
  selector:
    app: backend   # Routes traffic to pods with the label "app: backend"
  ports:
    - port: 8080
      targetPort: 8080
```

#### E) `k8s/frontend-deployment.yaml`

> **Replace `my-blog-project` with your actual GCP project ID.**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  namespace: blog
spec:
  replicas: 1
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
        - name: frontend
          # !! Replace "my-blog-project" with your actual GCP project ID
          image: us-central1-docker.pkg.dev/my-blog-project/blog/frontend:v1
          ports:
            - containerPort: 80
          resources:
            requests:
              cpu: "100m"      # nginx is very lightweight
              memory: "128Mi"
            limits:
              cpu: "200m"
              memory: "256Mi"
```

#### F) `k8s/frontend-service.yaml`

This Service is type `ClusterIP` — it is only reachable *inside* the cluster. The `cloudflared` pod (next step) connects to it internally; no public IP is ever provisioned on GCP.

```yaml
apiVersion: v1
kind: Service
metadata:
  name: frontend-service
  namespace: blog
spec:
  # ClusterIP = only reachable inside the cluster.
  # cloudflared forwards external traffic here via the Cloudflare Tunnel.
  # No GCP Load Balancer is created, so no ~$18/month charge.
  type: ClusterIP
  selector:
    app: frontend   # Routes to pods with label "app: frontend"
  ports:
    - name: http
      port: 80
      targetPort: 80
```

---

### Step 11 — Set Up Cloudflare Tunnel

> **Prerequisites:**
> - A domain name managed by Cloudflare (nameservers pointing to Cloudflare). A new domain costs ~$10/year — far cheaper than the GCP Load Balancer.
> - A free Cloudflare account at https://cloudflare.com

#### A) Create the tunnel in the Cloudflare Zero Trust dashboard

1. Log in to https://one.dash.cloudflare.com
2. Go to **Networks → Tunnels → Create a tunnel**
3. Choose **Cloudflared** as the connector type
4. Name the tunnel `blog-tunnel` and click **Save tunnel**
5. Cloudflare shows you a **tunnel token** — a long string starting with `eyJ...`. **Copy it now.**
6. In the **Public Hostname** section, add a route:
   - **Subdomain:** leave empty (or use `www`)
   - **Domain:** your domain (e.g. `yourdomain.com`)
   - **Service:** `http://frontend-service.blog.svc.cluster.local:80`
     - This is the Kubernetes internal DNS name for your frontend Service. Format: `<service-name>.<namespace>.svc.cluster.local`
7. Click **Save hostname**

#### B) Store the tunnel token as a Kubernetes Secret

Never put secrets directly in YAML files. Store the token as a K8s Secret and reference it by name.

```bash
# Replace <YOUR_TUNNEL_TOKEN> with the token you copied from the dashboard
kubectl create secret generic cloudflare-tunnel-token \
  --from-literal=token=<YOUR_TUNNEL_TOKEN> \
  -n blog
```

Verify it was created:
```bash
kubectl get secret cloudflare-tunnel-token -n blog
```

#### C) `k8s/cloudflared-deployment.yaml`

This Deployment runs one `cloudflared` pod. It reads the tunnel token from the Secret and opens a persistent outbound connection to Cloudflare's edge.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cloudflared
  namespace: blog
spec:
  replicas: 1
  selector:
    matchLabels:
      app: cloudflared
  template:
    metadata:
      labels:
        app: cloudflared
    spec:
      containers:
        - name: cloudflared
          # Official Cloudflare image — always use a pinned version in production
          image: cloudflare/cloudflared:latest
          args:
            - tunnel
            - --no-autoupdate
            - run
            - --token
            - $(TUNNEL_TOKEN)
          env:
            - name: TUNNEL_TOKEN
              valueFrom:
                secretKeyRef:
                  name: cloudflare-tunnel-token
                  key: token
          resources:
            requests:
              cpu: "50m"
              memory: "64Mi"
            limits:
              cpu: "100m"
              memory: "128Mi"
```

`cloudflared` does not need a Kubernetes Service — it makes *outbound* connections only and is never called by other pods.

---

### Step 12 — Deploy to Kubernetes

Now apply all the YAML files to your cluster. `kubectl apply -f` reads each file and creates or updates the described resources.

```bash
# From the project root (blog-claude/)

# 1. Create the namespace first (everything else goes inside it)
kubectl apply -f k8s/namespace.yaml

# 2. Create the persistent disk claim
kubectl apply -f k8s/uploads-pvc.yaml

# 3. Deploy the backend
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/backend-service.yaml

# 4. Deploy the frontend
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/frontend-service.yaml

# 5. Deploy cloudflared (tunnel to Cloudflare edge)
kubectl apply -f k8s/cloudflared-deployment.yaml
```

Or apply everything at once:
```bash
kubectl apply -f k8s/
```

---

### Step 12 — Watch Deployment Progress

```bash
# Watch pods come up (Ctrl+C to stop watching)
kubectl get pods -n blog --watch
```

You'll see output like:
```
NAME                        READY   STATUS              RESTARTS
backend-7d9f8b-xk2p9        0/1     ContainerCreating   0
frontend-6c4d5f-mn8q1       0/1     ContainerCreating   0
# ... after ~60-90 seconds on first deploy (image pull takes time) ...
backend-7d9f8b-xk2p9        1/1     Running             0
frontend-6c4d5f-mn8q1       1/1     Running             0
```

If a pod gets stuck or crashes, check its logs:
```bash
kubectl logs -n blog deployment/backend
kubectl logs -n blog deployment/frontend

# If a pod won't even start, check for scheduling errors:
kubectl describe pod -n blog <pod-name>
```

---

### Step 13 — Open Your App

There is no external IP to wait for — Cloudflare handles that. Just check that `cloudflared` connected successfully:

```bash
kubectl logs -n blog deployment/cloudflared
# Look for: "Registered tunnel connection" — means the tunnel is live
```

Then open your blog at:
```
https://yourdomain.com
```

Cloudflare issues a free TLS certificate automatically. Your blog is served over HTTPS with no extra configuration.

To verify the tunnel status from the Cloudflare dashboard: **Zero Trust → Networks → Tunnels** — `blog-tunnel` should show status **Healthy**.

---

### Step 14 — Verify the System

**Check all resources are healthy:**
```bash
kubectl get all -n blog
```

**Access the H2 console for debugging** (the backend isn't publicly exposed, so use port-forwarding — this creates a temporary tunnel from your laptop to the pod):
```bash
kubectl port-forward -n blog deployment/backend 8080:8080
# Now open http://localhost:8080/h2-console in your browser
# JDBC URL: jdbc:h2:mem:blogdb | User: sa | Password: (empty)
# Press Ctrl+C to close the tunnel when done
```

**Tail backend logs in real time:**
```bash
kubectl logs -n blog deployment/backend -f
```

---

## Part 5: Deploying Updates

When you change code and want to push a new version:

```bash
# 1. Build new image with a new tag (always use a new tag — never overwrite :v1)
docker build -t us-central1-docker.pkg.dev/my-blog-project/blog/backend:v2 backend/
docker push us-central1-docker.pkg.dev/my-blog-project/blog/backend:v2

# 2. Update the Deployment to use the new image
kubectl set image deployment/backend \
  backend=us-central1-docker.pkg.dev/my-blog-project/blog/backend:v2 \
  -n blog

# Kubernetes does a rolling update: starts the new pod, waits for it to be Ready,
# then terminates the old one — zero downtime.
kubectl rollout status deployment/backend -n blog
```

---

## Part 6: Important Limitations & Next Steps

### Current limitations

| Issue | Impact | Fix |
|-------|--------|-----|
| **H2 in-memory database** | Blog posts are deleted every time the backend pod restarts | Switch to Cloud SQL (PostgreSQL) or use H2 file mode with a second PVC |
| **Single replica** | If the backend pod crashes, brief downtime while K8s restarts it | Acceptable for a hobby blog |
| **HTTPS** | Already handled — Cloudflare terminates TLS for free | No action needed |
| **No auth** | Anyone can create/delete posts | Add Spring Security |

### Switch to H2 file mode (quick win — persists data across restarts)

Add a second PVC for the database file and two env vars to `backend-deployment.yaml`:

```yaml
# Under spec.template.spec.containers[0].env, add:
- name: SPRING_DATASOURCE_URL
  value: "jdbc:h2:file:/app/data/blogdb;DB_CLOSE_DELAY=-1;AUTO_SERVER=TRUE"
- name: SPRING_JPA_HIBERNATE_DDL-AUTO
  value: update   # "update" instead of "create-drop" — keeps existing data on restart

# Under spec.template.spec.containers[0].volumeMounts, add:
- name: db-storage
  mountPath: /app/data

# Under spec.template.spec.volumes, add:
- name: db-storage
  persistentVolumeClaim:
    claimName: db-pvc
```

And create `k8s/db-pvc.yaml`:
```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: db-pvc
  namespace: blog
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 1Gi
  storageClassName: standard-rwo
```

### Clean up (stop incurring costs)

```bash
# Delete all blog resources
kubectl delete namespace blog

# Delete the cluster entirely
gcloud container clusters delete blog-cluster --region=us-central1
```

---

## Summary: Complete File List

```
blog-claude/
├── backend/
│   └── Dockerfile                   ← multi-stage Maven → JRE build
├── frontend/
│   ├── Dockerfile                   ← multi-stage Node → nginx build
│   ├── nginx.conf                   ← proxies /api/* and /uploads/* to backend
│   └── src/api/axiosInstance.ts     ← changed || to ?? (relative URL support)
└── k8s/
    ├── namespace.yaml               ← logical grouping
    ├── uploads-pvc.yaml             ← persistent disk for uploaded images
    ├── backend-deployment.yaml      ← runs the Spring Boot container
    ├── backend-service.yaml         ← ClusterIP — internal only
    ├── frontend-deployment.yaml     ← runs nginx + React
    ├── frontend-service.yaml        ← ClusterIP — internal only (no public IP)
    └── cloudflared-deployment.yaml  ← tunnel daemon connecting cluster to Cloudflare
```

> **Note:** The tunnel token Secret is created with `kubectl create secret` (not a YAML file) so the token is never stored in version control.

### Key architectural decisions

| Decision | Reason |
|----------|--------|
| nginx as reverse proxy | Single entry point; backend is never internet-facing |
| ClusterIP for both services | Zero GCP attack surface — nothing is directly exposed |
| Cloudflare Tunnel instead of LoadBalancer | Free, no public IP needed, HTTPS included, saves ~$18/month |
| PVC for uploads | Uploaded images survive pod restarts |
| Multi-stage Dockerfiles | Small final images — no build tools shipped to production |
| Relative API URLs (`??` instead of `\|\|`) | Frontend works regardless of how traffic reaches the cluster |
