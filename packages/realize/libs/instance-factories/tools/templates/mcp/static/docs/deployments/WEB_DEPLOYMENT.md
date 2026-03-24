# Web Deployment Guide

## Overview

Web deployment is optimized for web-based LLM environments (Claude.ai, ChatGPT, etc.) where users cannot run local processes but need access to SpecVerse AI assistance via HTTP APIs.

## Features (Phase 3 Updated)

- ✅ **AI API Integration**: All tools powered by @specverse/lang AI API
- ✅ **Embedded Examples**: Essential examples bundled (~71KB total)
- ✅ **HTTP API**: RESTful endpoints for resource access
- ✅ **Serverless Ready**: Works on Vercel, Railway, Render
- ✅ **Zero Dependencies**: No file system access required
- ✅ **Fast Startup**: ~50ms startup time
- ✅ **Lightweight**: ~200KB deployment size (96KB smaller than before!)
- ✅ **CORS Support**: Web-browser compatible

## Quick Start

```bash
# Build web deployment
npm run build:web

# Test locally
npm run start:web

# Deploy to Vercel (recommended)
npm run deploy:vercel
```

**Live Demo**: https://specverse-crezbwpnl-specverse.vercel.app

## Architecture

```
Web Browser (LLM Terminal)
     ↓ HTTP Requests
Cloud Platform (Vercel/Railway/Render)
     ↓ 
SpecVerse MCP Web Server
     ↓ AI API Integration
@specverse/lang AI API (Contextual Responses)
```

## Directory Structure (Phase 3 Optimized)

```
dist/web/
├── server/
│   └── mcp-server.js              # HTTP server (entry point)
├── embedded-resources.js          # Examples only (~71KB - was 167KB!)  
├── deployment-manifest.json       # Deployment metadata
├── config.json                    # Web configuration
├── controllers/                   # Request handlers
├── services/                      # AI-powered services
└── vercel.json                    # Vercel deployment config
```

## Available Endpoints

### Health Check
```bash
GET /health
```

### MCP Resource Access
```bash
# List all resources
GET /mcp/resources

# Get specific resource
GET /mcp/resource/{uri}

# Example
GET /mcp/resource/specverse%3A%2F%2Fexamples%2Fchat-prompts
```

### Available Resources (Phase 3 Streamlined)
- `specverse://examples/chat-prompts` - Chat integration examples
- `specverse://examples/api-calls` - API integration examples

**Note**: Schemas and library information now provided through AI tools for better contextual responses.

## MCP Tools Available

All 8 AI-powered tools work in web deployment:

### Core AI Tools
1. `get_creation_prompt` - AI-powered creation prompts
2. `get_analysis_prompt` - AI-powered analysis prompts  
3. `get_implementation_prompt` - AI-powered implementation prompts
4. `get_realization_prompt` - AI-powered realization prompts
5. `create_spec_prompt` - Alternative creation prompt name
6. `mcp_ai_enhance` - Enhanced prompts with library context ⭐ NEW
7. `mcp_library_suggest` - Intelligent library suggestions ⭐ NEW
8. `mcp_cost_estimate` - Cost estimates for operations ⭐ NEW

**Note**: Orchestrator tools are disabled in web deployment for security and performance.

## Deployment Platforms

### Vercel (Recommended)

1. **Setup**:
```bash
npm install -g vercel
```

2. **Deploy**:
```bash
# Build for web
npm run build:web

# Deploy to Vercel
cd dist/web && vercel
```

3. **Environment Variables**: None required (uses embedded resources)

### Railway

1. **Setup**: Connect GitHub repository to Railway
2. **Build Command**: `npm run build:web`
3. **Start Command**: `node dist/web/server/mcp-server.js --mode web`

### Render

1. **Setup**: Connect GitHub repository to Render
2. **Build Command**: `npm run build:web` 
3. **Start Command**: `node dist/web/server/mcp-server.js --mode web --port $PORT`

## Configuration

### Web Config (dist/web/config.json)
```json
{
  "mode": "web",
  "features": {
    "orchestrator": false,
    "fileSystemResources": false,
    "embeddedResources": true
  },
  "resourcesStrategy": "embedded",
  "embeddedResourcesCount": 2,
  "aiApiIntegration": true
}
```

### Vercel Config (vercel.json)
```json
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
      "dest": "dist/web/server/mcp-server.js"
    }
  ]
}
```

## Phase 3 Improvements

✅ **AI API Integration**: All responses are now contextual and intelligent  
✅ **Smaller Package**: 96KB reduction (71KB vs 167KB previously)  
✅ **Better Performance**: AI-generated responses vs static file serving  
✅ **Simplified Architecture**: No need to serve schemas/prompts as resources  

## Performance

- **Cold Start**: ~50ms (serverless)
- **Warm Response**: ~10ms (cached)
- **AI Tool Execution**: 200-2000ms (@specverse/lang API calls)
- **Resource Loading**: <1ms (embedded)
- **Memory Usage**: ~30MB

## Monitoring

### Health Endpoint Response
```json
{
  "status": "healthy",
  "version": "1.1.7",
  "mode": "web",
  "features": {
    "orchestrator": false,
    "embeddedResources": true
  },
  "resourcesCount": 2,
  "uptime": "00:15:32",
  "memoryUsage": {
    "used": "28.5 MB",
    "total": "512 MB"
  }
}
```

## Integration Examples

### Web Browser LLM
```javascript
// Example: Fetch creation prompt
const response = await fetch('https://your-domain.com/mcp/resource/specverse%3A%2F%2Fexamples%2Fchat-prompts');
const examples = await response.text();
```

### Curl Testing
```bash
# Health check
curl https://your-domain.com/health

# List resources
curl https://your-domain.com/mcp/resources

# Get chat examples
curl "https://your-domain.com/mcp/resource/specverse%3A%2F%2Fexamples%2Fchat-prompts"
```

## Troubleshooting

### Common Issues

1. **Build fails**: Ensure all dependencies installed with `npm install`
2. **404 errors**: Check route configuration in platform settings
3. **CORS errors**: Ensure CORS headers are enabled (default: yes)
4. **Slow AI responses**: Normal - AI API calls take 200-2000ms

### Debug Logs

```bash
# Local testing with verbose logging
npm run start:web -- --verbose
```

## Security

- ✅ **No file system access** - Uses embedded resources only
- ✅ **No sensitive data** - All resources are public examples
- ✅ **CORS enabled** - Web browser compatible
- ✅ **Rate limiting** - Built into AI API calls
- ⚠️ **No authentication** - Consider adding auth for production use