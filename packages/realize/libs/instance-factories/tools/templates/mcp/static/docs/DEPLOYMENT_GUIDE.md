# SpecVerse MCP Server Deployment Guide

## Overview (v1.1.7 Updated)

The SpecVerse MCP Server supports four deployment targets, each optimized for different user environments and use cases. **v1.1.7 introduces dynamic CLI integration** requiring both `@specverse/lang` and `@specverse/mcp` packages for full functionality.

### **⚠️ New Dependency Requirements**

All deployment modes now require access to the `@specverse/lang` package for dynamic CLI discovery:

```bash
# For global deployments
npm install -g @specverse/lang @specverse/mcp

# For container/local deployments  
npm install @specverse/lang @specverse/mcp
```

## Quick Start

```bash
# Build all deployment targets
npm run build:all

# Test specific deployment
npm run start:local      # Local terminal users
npm run start:web        # Web-based LLM users  
npm run docker:compose   # Enterprise deployment
```

## Deployment Targets

### 🗂️ Local Deployment

**Target Users**: Local developers, terminal users, development environments

**Architecture**: 
- AI API integration with @specverse/lang
- Essential resources only (examples)
- Full orchestrator integration (optional)
- Native Node.js execution

#### Build and Start

```bash
# Build local deployment
npm run build:local

# Start local MCP server
npm run start:local

# Or run directly
node dist/local/server/mcp-server.js --mode local
```

#### Configuration

**Location**: `dist/local/config.json`

```json
{
  "mode": "local",
  "features": {
    "orchestrator": true,
    "fileSystemResources": true,
    "embeddedResources": false
  },
  "resourcesPath": "./resources"
}
```

#### Directory Structure (Phase 3 Optimized)

```
dist/local/
├── server/
│   └── mcp-server.js          # Main server executable
├── controllers/               # MCP request handlers
├── services/                  # AI-powered services  
├── resources/                 # Essential examples only (~71KB)
│   └── examples/              # Terminal/chat examples
└── config.json                # Local configuration
```

**Note**: Schemas, prompts, and library catalogs are now provided through AI tools for better contextual responses.

#### Usage

**MCP Client Integration**:
```json
{
  "mcpServers": {
    "specverse-local": {
      "command": "node",
      "args": ["dist/local/server/mcp-server.js", "--mode", "local"],
      "cwd": "/path/to/specverse-mcp"
    }
  }
}
```

**Direct Usage**:
```bash
# Start server in background
node dist/local/server/mcp-server.js --mode local &

# The server will connect via stdio transport
# Perfect for Claude Desktop, Continue.dev, etc.
```

---

### 🌐 Web Deployment

**Target Users**: Web-based LLM terminals (Claude.ai, ChatGPT, etc.)

**Architecture**:
- AI API integration with @specverse/lang
- Embedded resources (71KB total - 96KB smaller!)
- HTTP API endpoints
- Serverless-friendly

#### Build and Deploy

```bash
# Build web deployment  
npm run build:web

# Start local web server (for testing)
npm run start:web

# Deploy to cloud platform
# See platform-specific instructions below
```

#### Configuration

**Location**: `dist/web/config.json`

```json
{
  "mode": "web",
  "features": {
    "orchestrator": false,
    "fileSystemResources": false,
    "embeddedResources": true
  },
  "resourcesStrategy": "embedded",
  "embeddedResourcesCount": 2
}
```

#### Directory Structure

```
dist/web/
├── server/
│   └── mcp-server.js          # HTTP server
├── embedded-resources.js      # Essential examples only (71KB)
├── deployment-manifest.json   # Deployment metadata
├── controllers/               # HTTP request handlers
├── services/                  # AI-powered services
└── config.json                # Web configuration
```

#### HTTP API Endpoints

```
GET  /health                   # Health check + metrics
GET  /mcp                      # MCP capabilities
GET  /mcp/resources            # List all resources
GET  /mcp/resource/{uri}       # Get specific resource
POST /mcp/tools/{name}         # Call MCP tool (future)
```

#### Platform Deployment

**Vercel**:
```json
// vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "dist/web/server/mcp-server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/dist/web/server/mcp-server.js"
    }
  ]
}
```

**Railway**:
```dockerfile
FROM node:18-alpine
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies including @specverse/lang
RUN npm ci --only=production

# Copy built application
COPY dist/web ./dist/web

# Expose port
EXPOSE 3000

# Start server
CMD ["node", "dist/web/server/mcp-server.js", "--mode", "remote", "--port", "3000"]
```

**Note**: Ensure your `package.json` includes `@specverse/lang` as a dependency:

```json
{
  "dependencies": {
    "@specverse/lang": "^3.1.17",
    "@specverse/mcp": "^1.1.7"
  }
}
```

**Render**:
```yaml
# render.yaml
services:
  - type: web
    name: specverse-mcp
    env: node
    plan: free
    buildCommand: npm run build:web
    startCommand: node dist/web/server/mcp-server.js --mode remote --port $PORT
    envVars:
      - key: NODE_ENV
        value: production
```

#### Usage Examples

**Health Check**:
```bash
curl https://your-domain.com/health
```

**List Resources**:
```bash
curl https://your-domain.com/mcp/resources
```

**Get Schema**:
```bash
curl "https://your-domain.com/mcp/resource/specverse%3A%2F%2Fschema%2Fjson"
```

---

### 💻 VSCode Extension Deployment

**Target Users**: VSCode developers, IDE integration users

**Architecture**:
- AI API integration with @specverse/lang
- Hybrid resource mode (embedded + filesystem fallback)
- Extension wrapper for VSCode integration
- Orchestrator detection

#### Build and Package

```bash
# Build extension deployment
npm run build:extension

# The extension wrapper is created at:
# dist/extension/extension-wrapper.js
```

#### Configuration

**Location**: `dist/extension/config.json`

```json
{
  "mode": "extension",
  "features": {
    "orchestrator": "conditional",
    "fileSystemResources": true,
    "embeddedResources": true,
    "hybridMode": true
  },
  "vscode": {
    "activationEvents": [
      "onLanguage:specverse",
      "workspaceContains:**/*.specly"
    ],
    "capabilities": [
      "mcp-server",
      "resource-provider",
      "tool-provider"
    ]
  }
}
```

#### Directory Structure

```
dist/extension/
├── extension-wrapper.js       # VSCode integration wrapper
├── package.json               # Extension package manifest
├── server/                    # MCP server files
├── resources/                 # Essential examples only
└── config.json                # Extension configuration
```

#### VSCode Extension Integration

```typescript
// In your VSCode extension
import { VSCodeExtensionMCPServer } from './extension-wrapper.js';

const mcpServer = new VSCodeExtensionMCPServer(context.extensionPath);
await mcpServer.start();
```

#### Features

- **Orchestrator Detection**: Automatically detects if full SpecVerse orchestrator is available
- **Resource Fallback**: Uses embedded resources if filesystem not available
- **IDE Integration**: Designed for VSCode command palette and editor integration

---

### 🏢 Enterprise Deployment

**Target Users**: Enterprise teams, CI/CD systems, production environments

**Architecture**:
- AI API integration with @specverse/lang
- Containerized deployment
- Full monitoring stack
- Horizontal scaling support
- Production security

#### Build and Deploy

```bash
# Build enterprise deployment
npm run build:enterprise

# Build Docker image
npm run docker:build

# Start full stack with monitoring
npm run docker:compose
```

#### Configuration

**Location**: `dist/enterprise/config.json`

```json
{
  "mode": "enterprise",
  "features": {
    "orchestrator": true,
    "fileSystemResources": true,
    "embeddedResources": true,
    "monitoring": true,
    "clustering": true,
    "healthCheck": true
  },
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
}
```

#### Directory Structure

```
dist/enterprise/
├── server/                    # MCP server
├── Dockerfile                 # Multi-stage container build
├── docker-compose.yml         # Full stack deployment
├── monitoring/                # Monitoring configuration
│   └── prometheus.yml         # Metrics collection
├── resources/                 # Resource files
└── README.md                  # Deployment instructions
```

#### Docker Compose Stack

```yaml
version: '3.8'

services:
  specverse-mcp:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - MCP_MODE=enterprise
    volumes:
      - specverse-data:/app/data
      - specverse-logs:/app/logs
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
    restart: unless-stopped

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=specverse
    restart: unless-stopped
```

#### Deployment Commands

```bash
# Start full stack
docker-compose up -d

# Scale MCP server
docker-compose up -d --scale specverse-mcp=3

# View logs
docker-compose logs -f specverse-mcp

# Stop stack
docker-compose down
```

#### Monitoring

**Prometheus Metrics**: `http://localhost:9090`
**Grafana Dashboard**: `http://localhost:3001` (admin/specverse)
**Health Check**: `http://localhost:3000/health`

#### Production Deployment

**Kubernetes**:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: specverse-mcp
spec:
  replicas: 3
  selector:
    matchLabels:
      app: specverse-mcp
  template:
    spec:
      containers:
      - name: specverse-mcp
        image: specverse-mcp-enterprise:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: MCP_MODE
          value: "enterprise"
```

## Deployment Comparison

| Feature | Local | Web | Extension | Enterprise |
|---------|-------|-----|-----------|------------|
| **Resource Strategy** | AI + Examples | AI + Embedded | AI + Hybrid | AI + Hybrid |
| **Orchestrator** | Optional | None | Conditional | Full |
| **Deployment Size** | ~200KB | ~200KB | ~500KB | ~1MB+ |
| **Startup Time** | ~50ms | ~50ms | ~200ms | ~500ms |
| **Memory Usage** | ~30MB | ~20MB | ~30MB | ~100MB |
| **Scaling** | Single | Serverless | Single | Horizontal |
| **Monitoring** | Basic | None | Basic | Full |
| **Security** | Local | HTTPS | IDE | Enterprise |

## Health Checks

All deployments include health check endpoints:

```bash
# Check server status
curl http://localhost:PORT/health

# Example response
{
  "status": "healthy",
  "mode": "local|web|extension|enterprise",
  "metrics": {
    "cached_resources": 2,
    "server_mode": "local",
    "uptime": 123.456,
    "memory_usage": {...},
    "resources_provider": {
      "mode": "filesystem|embedded",
      "type": "ResourcesProviderService|EmbeddedResourcesAdapter",
      "resourcesInfo": {
        "count": 2,
        "totalSize": 71204
      }
    },
    "aiApiIntegration": true
  }
}
```

## Troubleshooting

### Common Issues

**Package Dependency Issues (New in v1.1.7)**:
```bash
# Error: Cannot find module '@specverse/lang'
# Solution: Install both packages
npm install -g @specverse/lang @specverse/mcp

# Or for local development
npm install @specverse/lang @specverse/mcp

# Verify CLI is accessible
specverse --help

# Test CLI discovery
node -e "const { getAllCliCapabilities } = require('@specverse/lang'); console.log(getAllCliCapabilities());"
```

**CLI Command Failures**:
```bash
# Error: SpecVerse CLI not found
# Check CLI installation
which specverse
npm list -g @specverse/lang

# Test CLI with JSON output
specverse validate --help
specverse --json ai template create
```

**Resource Loading Failures**:
```bash
# Check resource paths
ls dist/local/resources/
ls dist/web/embedded-resources.js

# Verify resource loading
curl http://localhost:3000/mcp/resources
```

**Port Conflicts**:
```bash
# Find and kill process using port
lsof -ti:3000 | xargs kill

# Use different port
node server.js --port 3001
```

**Docker Issues**:
```bash
# Check logs
docker-compose logs specverse-mcp

# Rebuild image
docker-compose build --no-cache
```

### Performance Tuning

**Memory Optimization**:
- Reduce embedded resource size
- Enable resource compression
- Configure garbage collection

**Network Optimization**:
- Enable gzip compression
- Add CDN for web deployments
- Configure connection pooling

## Support

For deployment issues:
1. Check the health endpoint first
2. Review server logs for errors
3. Verify resource loading
4. Test with minimal configuration
5. Consult the troubleshooting section

Each deployment target is optimized for its specific use case while maintaining API compatibility across all environments.