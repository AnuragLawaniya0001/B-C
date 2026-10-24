# Multi-stage Dockerfile: Bigchamp Backend & All Frontends in a Single Container

# --- Stage 1: Build Customer Frontend ---
FROM node:20-alpine AS build-frontend
WORKDIR /app
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# --- Stage 2: Build Admin Console ---
FROM node:20-alpine AS build-admin
WORKDIR /app
COPY admin/package*.json ./
RUN npm install
COPY admin/ ./
RUN npm run build

# --- Stage 3: Build Partner Portal ---
FROM node:20-alpine AS build-partner
WORKDIR /app
COPY partner/package*.json ./
RUN npm install
COPY partner/ ./
RUN npm run build

# --- Stage 4: Unified Production Container ---
FROM python:3.11-slim

WORKDIR /app

# Ensure Python output is sent directly to terminal without buffering
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    ENV=development \
    PORT=3050

# Install Nginx, Supervisor, and networking curl
RUN apt-get update && apt-get install -y --no-install-recommends \
    nginx \
    supervisor \
    curl \
 && rm -rf /var/lib/apt/lists/*

# Install Python backend dependencies
COPY backend/requirements.txt /app/backend/
RUN pip install --no-cache-dir -r /app/backend/requirements.txt

# Copy Backend application code
COPY backend/ /app/backend/

# Copy built frontend distributions to Nginx directories
COPY --from=build-frontend /app/dist /var/www/frontend
COPY --from=build-admin /app/dist /var/www/admin
COPY --from=build-partner /app/dist /var/www/partner

# Copy ecosystem hub and configurations
COPY docker/portal /var/www/portal
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Expose ports:
# 80: Ecosystem Hub Gateway
# 3050: FastAPI Backend & Swagger Docs
# 3000: Customer Frontend
# 3001: Admin Console
# 3002: Partner Portal
EXPOSE 80 3050 3000 3001 3002

# Start Supervisord to manage both Uvicorn and Nginx
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
