# Local Deployment Guide

## Overview

Local deployment is optimized for developers working on their local machines, providing direct access to the SpecVerse AI API and integration with development tools.

## Features (Phase 3 Updated)

- ✅ **AI API Integration**: Direct access to @specverse/lang AI API
- ✅ **Intelligent Tools**: 8 AI-powered MCP tools for contextual guidance
- ✅ **Development Integration**: Works with local development tools  
- ✅ **Orchestrator Support**: Optional full workflow capabilities
- ✅ **Fast Startup**: ~100ms startup time
- ✅ **Stdio Transport**: Compatible with MCP clients

## Quick Start

```bash
# Install globally
npm install -g @specverse/mcp

# Basic usage
specverse-mcp --mode local --silent

# With orchestrator (advanced)
specverse-mcp --mode local --enable-orchestrator --silent

# Or build from source
npm run build:local
node dist/local/server/mcp-server.js --mode local
```

## Directory Structure (Phase 3 Optimized)

```
dist/local/
├── server/
│   └── mcp-server.js              # Main executable (chmod +x)
├── controllers/
│   └── MCPServerController.js     # Request handling
├── services/
│   ├── HybridResourcesProvider.js     # Resource management  
│   ├── LibraryToolsService.js          # AI-powered library tools
│   └── PromptToolsService.js           # AI-powered prompt tools
├── resources/                     # Essential examples only (71KB total)
│   └── examples/
│       ├── chat-prompts/               # Terminal/chat examples
│       └── api-calls/                  # API integration examples
├── config.json                    # Local configuration
└── package.json                   # Dependencies
```

**Note**: Schemas, prompts, and library catalogs are now provided through AI tools for better contextual responses.

## Available Tools

### Core AI Tools (8 total)
1. `get_creation_prompt` - AI-powered creation prompts
2. `get_analysis_prompt` - AI-powered analysis prompts  
3. `get_implementation_prompt` - AI-powered implementation prompts
4. `get_realization_prompt` - AI-powered realization prompts
5. `create_spec_prompt` - Alternative creation prompt name
6. `mcp_ai_enhance` - Enhanced prompts with library context ⭐ NEW
7. `mcp_library_suggest` - Intelligent library suggestions ⭐ NEW
8. `mcp_cost_estimate` - Cost estimates for operations ⭐ NEW

### Orchestrator Tools (Optional with --enable-orchestrator)
- `analyse_codebase` - Full codebase analysis
- `create_specification` - End-to-end spec creation
- `infer_specification` - AI-powered inference
- `materialise_implementation` - Implementation planning
- `realize_application` - Code generation
- `get_workflow_status` - Workflow status tracking

### Resources (2 total)
- `specverse://examples/chat-prompts` - Chat integration examples
- `specverse://examples/api-calls` - API integration examples

## Configuration

### Basic Configuration
```json
{
  "mode": "local",
  "features": {
    "orchestrator": false,
    "fileSystemResources": true,
    "embeddedResources": false
  },
  "logging": true
}
```

### With Orchestrator
```json
{
  "mode": "local", 
  "features": {
    "orchestrator": true,
    "fileSystemResources": true,
    "embeddedResources": false
  },
  "logging": true
}
```

## Claude Desktop Integration

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

### Basic
```json
{
  "mcpServers": {
    "specverse": {
      "command": "specverse-mcp",
      "args": ["--mode", "local", "--silent"]
    }
  }
}
```

### With Orchestrator
```json
{
  "mcpServers": {
    "specverse": {
      "command": "specverse-mcp", 
      "args": ["--mode", "local", "--enable-orchestrator", "--silent"]
    }
  }
}
```

## Phase 3 Improvements

✅ **AI API Integration**: All tools use @specverse/lang for consistency  
✅ **Contextual Responses**: Intelligent guidance vs raw data dumps  
✅ **Smaller Package**: 96KB reduction from removing redundant files  
✅ **Better Performance**: AI-generated responses are more accurate  

## Performance

- **Startup Time**: ~100ms
- **Resource Loading**: Sub-millisecond for examples
- **Tool Execution**: AI API response times (typically 200-2000ms)
- **Memory Usage**: ~50MB base, +20MB with orchestrator

## Troubleshooting

### Common Issues

1. **Command not found**: Run `npm install -g @specverse/mcp`
2. **Permission denied**: Ensure executable permissions on mcp-server.js
3. **Claude Desktop not connecting**: Restart after config changes
4. **AI tools slow**: Check internet connection for @specverse/lang API calls

### Debug Mode

```bash
specverse-mcp --mode local --verbose
```

Provides detailed logging of AI API calls and resource operations.