#!/usr/bin/env node
/**
 * Build Script for Enterprise Deployment
 * Builds containerized version with full capabilities and monitoring
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

const verbose = process.env.VERBOSE === 'true';
if (verbose) console.log('🔨 Building for ENTERPRISE deployment...');

// Clean and create directories
const distDir = join(rootDir, 'dist', 'enterprise');
if (!existsSync(distDir)) {
  mkdirSync(distDir, { recursive: true });
}

// Build TypeScript
if (verbose) console.log('📦 Compiling TypeScript...');
execSync('npx tsc --outDir dist/enterprise', {
  cwd: rootDir,
  stdio: 'inherit'
});

// Copy resources
if (verbose) console.log('📁 Copying resources...');
const resourcesDir = join(rootDir, 'resources');
if (existsSync(resourcesDir)) {
  execSync(`cp -r resources dist/enterprise/`, { cwd: rootDir, stdio: 'inherit' });
}

// Create Dockerfile
if (verbose) console.log('🐳 Creating Dockerfile...');
const dockerfile = `# Multi-stage build for Enterprise SpecVerse MCP Server
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS runtime

# Install system dependencies
RUN apk add --no-cache \
    tini \
    curl \
    && addgroup -g 1001 -S nodejs \
    && adduser -S specverse -u 1001

WORKDIR /app

# Copy built application
COPY --from=builder /app/node_modules ./node_modules
COPY --chown=specverse:nodejs dist/enterprise ./
COPY --chown=specverse:nodejs resources ./resources

# Create data and logs directories
RUN mkdir -p /app/data /app/logs \
    && chown -R specverse:nodejs /app/data /app/logs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Security settings
USER specverse
EXPOSE 3000

# Use tini for proper signal handling
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server/mcp-server.js", "--mode", "enterprise", "--port", "3000"]
`;

writeFileSync(join(distDir, 'Dockerfile'), dockerfile);

// Create docker-compose.yml for full stack
const dockerCompose = `version: '3.8'

services:
  specverse-mcp:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - MCP_MODE=enterprise
      - RESOURCES_STRATEGY=hybrid
      - PROMETHEUS_ENABLED=true
      - LOG_LEVEL=info
    volumes:
      - specverse-data:/app/data
      - specverse-logs:/app/logs
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '1.0'
        reservations:
          memory: 256M
          cpus: '0.5'

  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--storage.tsdb.retention.time=15d'
      - '--web.enable-lifecycle'
    restart: unless-stopped

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=specverse
    volumes:
      - grafana-data:/var/lib/grafana
      - ./monitoring/grafana/dashboards:/etc/grafana/provisioning/dashboards
      - ./monitoring/grafana/datasources:/etc/grafana/provisioning/datasources
    restart: unless-stopped

volumes:
  specverse-data:
  specverse-logs:
  prometheus-data:
  grafana-data:

networks:
  default:
    name: specverse-network
`;

writeFileSync(join(distDir, 'docker-compose.yml'), dockerCompose);

// Create monitoring configuration
if (verbose) console.log('📊 Creating monitoring configuration...');
const monitoringDir = join(distDir, 'monitoring');
mkdirSync(monitoringDir, { recursive: true });

const prometheusConfig = `global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "rules/*.yml"

scrape_configs:
  - job_name: 'specverse-mcp'
    static_configs:
      - targets: ['specverse-mcp:3000']
    scrape_interval: 10s
    metrics_path: '/metrics'
    
  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']
`;

writeFileSync(join(monitoringDir, 'prometheus.yml'), prometheusConfig);

// Create enterprise-specific configuration
if (verbose) console.log('⚙️  Creating enterprise configuration...');
const enterpriseConfig = `{
  "mode": "enterprise",
  "features": {
    "orchestrator": true,
    "fileSystemResources": true,
    "embeddedResources": true,
    "monitoring": true,
    "clustering": true,
    "healthCheck": true
  },
  "resourcesPath": "./resources",
  "monitoring": {
    "prometheus": {
      "enabled": true,
      "port": 9090,
      "endpoint": "/metrics"
    },
    "healthCheck": {
      "enabled": true,
      "endpoint": "/health",
      "interval": 30
    }
  },
  "clustering": {
    "enabled": false,
    "nodes": 1,
    "loadBalancer": "round-robin"
  },
  "security": {
    "cors": {
      "enabled": true,
      "origins": ["https://*.enterprise.com"]
    },
    "rateLimit": {
      "enabled": true,
      "windowMs": 60000,
      "maxRequests": 1000
    }
  }
}`;

writeFileSync(join(distDir, 'config.json'), enterpriseConfig);

// Create deployment documentation
const deploymentDocs = `# Enterprise Deployment Guide

## Quick Start

1. Build the container:
   \`\`\`bash
   docker build -t specverse-mcp-enterprise .
   \`\`\`

2. Start the full stack:
   \`\`\`bash
   docker-compose up -d
   \`\`\`

3. Access services:
   - MCP Server: http://localhost:3000
   - Prometheus: http://localhost:9090
   - Grafana: http://localhost:3001 (admin/specverse)

## Configuration

Enterprise configuration supports:
- Multi-node clustering
- Prometheus metrics
- Health checks
- CORS and rate limiting
- Volume persistence

## Monitoring

- Prometheus metrics at /metrics
- Health check at /health
- Grafana dashboards pre-configured
- Alert rules for service availability

## Security

- Runs as non-root user
- Resource limits configured
- Security contexts applied
- Network policies supported

## Scaling

Use Docker Swarm or Kubernetes for production scaling:
\`\`\`bash
docker service create --replicas 3 specverse-mcp-enterprise
\`\`\`
`;

writeFileSync(join(distDir, 'README.md'), deploymentDocs);

if (verbose) console.log('✅ Enterprise build complete!');
if (verbose) console.log('📍 Output: dist/enterprise/');
if (verbose) console.log('🐳 Docker configuration ready');
if (verbose) console.log('📊 Monitoring stack included');
if (verbose) console.log('🚀 Deploy with: docker-compose up -d');