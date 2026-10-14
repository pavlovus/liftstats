# ==============================================================================
# LiftStats Unified Production Container
# Multi-stage build: Compiles React 19 SPA & runs FastAPI ASGI inference server
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build Frontend Assets
# ------------------------------------------------------------------------------
FROM node:22-alpine AS frontend-builder

WORKDIR /build/frontend

# Install package dependencies with layer caching
COPY app/frontend/package.json app/frontend/package-lock.json ./
RUN npm ci

# Copy frontend source code and compile production client bundle
COPY app/frontend/ ./
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 2: Runtime Inference & Unified Serving
# ------------------------------------------------------------------------------
FROM python:3.11-slim AS runner

# Optimize Python execution in containerized environments
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PORT=8000

WORKDIR /app

# Install runtime utilities (curl for container healthcheck)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy analytical scripts and models
COPY scripts/ /app/scripts/
COPY models/ /app/models/
COPY data/processed/ /app/data/processed/

# Copy FastAPI backend application code
COPY app/ /app/app/

# Copy compiled frontend client bundle from Stage 1 into the location expected by FastAPI
COPY --from=frontend-builder /build/frontend/build/client /app/app/frontend/build/client

# Expose backend port
EXPOSE 8000

# Periodic healthcheck targeting the FastAPI /api/health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/api/health || exit 1

# Start Uvicorn ASGI server
CMD ["uvicorn", "app.backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
