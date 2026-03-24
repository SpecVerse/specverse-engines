# VSCode Extension Deployment Guide

## Overview

Extension deployment provides hybrid capabilities for VSCode users, combining the convenience of embedded resources with the power of local orchestrator integration when available.

## Features (Phase 3 Updated)

- ✅ **AI API Integration**: All tools powered by @specverse/lang AI API
- ✅ **Hybrid Mode**: Embedded resources + filesystem fallback
- ✅ **Orchestrator Detection**: Automatically detects local SpecVerse installation
- ✅ **VSCode Integration**: Native extension wrapper
- ✅ **Development Friendly**: Works in both dev and production environments
- ✅ **Flexible Deployment**: Supports multiple orchestrator configurations
- ✅ **IDE Native**: Deep integration with VSCode workflows

## Quick Start

```bash
# Build extension deployment
npm run build:extension

# The extension package is created at:
# dist/extension/package.json
# dist/extension/extension-wrapper.js
```

## Architecture

```
VSCode Extension Environment
     ↓
Extension Wrapper (Orchestrator Detection)
     ↓
┌─ Local Orchestrator Available ─┐  ┌─ No Local Orchestrator ─┐
│  Full SpecVerse Integration    │  │  Embedded Resources Only │
│  File System Resources         │  │  Limited but Functional  │
└─────────────────────────────────┘  └───────────────────────────┘
```

## Directory Structure

```
dist/extension/
├── extension-wrapper.js           # Main VSCode integration
├── package.json                   # Extension manifest
├── config.json                    # Extension configuration
├── server/                        # MCP server components
│   └── mcp-server.js              # Server runtime
├── controllers/                   # Request handlers
├── services/                      # AI-powered services
├── resources/                     # Essential examples only (~71KB)
│   └── examples/                  # Terminal/chat examples
└── types/                         # TypeScript definitions
```

**Note**: Schemas, prompts, and library catalogs are now provided through AI tools for better contextual responses.

## Configuration

**File**: `dist/extension/config.json`

```json
{
  "mode": "extension",
  "features": {
    "orchestrator": "conditional",
    "fileSystemResources": true,
    "embeddedResources": true,
    "hybridMode": true
  },
  "resourcesPath": "./resources",
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

## Extension Wrapper

The `extension-wrapper.js` provides seamless integration with VSCode:

```typescript
/**
 * VSCode Extension Wrapper for SpecVerse MCP Server
 * Provides hybrid capabilities for extension environment
 */

class VSCodeExtensionMCPServer {
  constructor(extensionPath) {
    this.extensionPath = extensionPath;
    this.config = {
      mode: 'extension',
      logging: true,
      resources_path: path.join(extensionPath, 'resources'),
      features: {
        orchestrator: this.detectOrchestrator(),
        fileSystemResources: true,
        embeddedResources: true
      }
    };
    
    this.server = new SpecVerseCleanMCPServer(this.config);
  }

  detectOrchestrator() {
    // Check if orchestrator is available in parent SpecVerse installation
    try {
      const orchestratorPath = path.resolve(
        this.extensionPath, 
        '../../../src/orchestrator'
      );
      require.resolve(orchestratorPath);
      return true;
    } catch (error) {
      console.log('Orchestrator not detected, using embedded resources only');
      return false;
    }
  }

  async start() {
    return this.server.start();
  }

  getController() {
    return this.server.getController();
  }
}
```

## VSCode Extension Integration

### Extension Manifest

**File**: `dist/extension/package.json`

```json
{
  "name": "specverse-mcp-extension",
  "version": "1.0.0",
  "description": "SpecVerse MCP Server for VSCode Extension",
  "main": "extension-wrapper.js",
  "engines": {
    "node": ">=16.0.0",
    "vscode": "^1.80.0"
  },
  "activationEvents": [
    "onLanguage:specverse",
    "workspaceContains:**/*.specly"
  ],
  "contributes": {
    "languages": [
      {
        "id": "specverse",
        "aliases": ["SpecVerse", "specverse"],
        "extensions": [".specly"]
      }
    ],
    "commands": [
      {
        "command": "specverse.startMCPServer", 
        "title": "Start SpecVerse MCP Server"
      },
      {
        "command": "specverse.stopMCPServer",
        "title": "Stop SpecVerse MCP Server"
      },
      {
        "command": "specverse.getCreationPrompt",
        "title": "Get SpecVerse Creation Prompt"
      }
    ]
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.17.4",
    "@specverse/lang": "file:../../../../",
    "yaml": "^2.8.1",
    "zod": "^3.25.76"
  }
}
```

### Extension Code Integration

```typescript
// In your VSCode extension (extension.ts)
import * as vscode from 'vscode';
import { VSCodeExtensionMCPServer } from './extension-wrapper';

let mcpServer: VSCodeExtensionMCPServer | undefined;

export async function activate(context: vscode.ExtensionContext) {
  // Initialize MCP server
  mcpServer = new VSCodeExtensionMCPServer(context.extensionPath);
  
  // Register commands
  const startCommand = vscode.commands.registerCommand(
    'specverse.startMCPServer', 
    async () => {
      try {
        await mcpServer?.start();
        vscode.window.showInformationMessage('SpecVerse MCP Server started');
      } catch (error) {
        vscode.window.showErrorMessage(`Failed to start MCP server: ${error}`);
      }
    }
  );

  const getCreationPrompt = vscode.commands.registerCommand(
    'specverse.getCreationPrompt',
    async () => {
      const requirements = await vscode.window.showInputBox({
        prompt: 'Describe your application requirements',
        placeHolder: 'e.g., Build a blog with user authentication'
      });

      if (requirements) {
        try {
          const controller = mcpServer?.getController();
          const result = await controller?.callTool('get_creation_prompt', {
            requirements,
            scale: 'business'
          });
          
          // Show result in new document
          const doc = await vscode.workspace.openTextDocument({
            content: result?.content[0]?.text || 'No content',
            language: 'markdown'
          });
          await vscode.window.showTextDocument(doc);
        } catch (error) {
          vscode.window.showErrorMessage(`Error: ${error}`);
        }
      }
    }
  );

  context.subscriptions.push(startCommand, getCreationPrompt);
}

export function deactivate() {
  // Cleanup MCP server
  mcpServer = undefined;
}
```

## Orchestrator Detection Logic

The extension automatically detects orchestrator availability:

### Detection Methods

1. **Local Installation Check**:
   ```typescript
   // Check for orchestrator in parent SpecVerse installation
   const orchestratorPath = path.resolve(extensionPath, '../../../src/orchestrator');
   ```

2. **Global Installation Check**:
   ```typescript
   // Check for global SpecVerse CLI
   try {
     execSync('specverse --version');
     return true;
   } catch {
     return false;
   }
   ```

3. **Workspace Check**:
   ```typescript
   // Check if workspace contains SpecVerse project
   const workspaceHasSpecVerse = vscode.workspace.workspaceFolders?.some(folder => {
     return fs.existsSync(path.join(folder.uri.fsPath, 'specverse.config.json'));
   });
   ```

### Capability Modes

**Full Mode** (Orchestrator Available):
- Complete workflow orchestration
- Full library analysis
- Advanced code generation
- Real-time specification processing

**Limited Mode** (No Orchestrator):
- Basic prompt expansion
- Resource serving
- Library recommendations
- Template generation

## Usage Scenarios

### 1. Development with Full SpecVerse

**Setup**: VSCode in a project with full SpecVerse installation

**Capabilities**:
- Right-click `.specly` files → "Analyze with SpecVerse"
- Command palette → "SpecVerse: Create Specification"
- Hover over SpecVerse keywords for documentation
- IntelliSense for library imports

```typescript
// Extension activation in full mode
if (orchestratorDetected) {
  // Register enhanced commands
  registerCommand('specverse.analyzeProject', analyzeEntireProject);
  registerCommand('specverse.generateCode', generateImplementation);
  registerCommand('specverse.validateSpec', validateSpecification);
}
```

### 2. Lightweight Usage

**Setup**: VSCode with extension only (no local SpecVerse)

**Capabilities**:
- Basic prompt generation
- Resource access (schemas, examples)
- Library suggestions
- Template expansion

```typescript
// Extension activation in limited mode
if (!orchestratorDetected) {
  // Register basic commands only
  registerCommand('specverse.getPrompt', getCreationPrompt);
  registerCommand('specverse.showResources', listResources);
  registerCommand('specverse.suggestLibraries', getLibrarySuggestions);
}
```

## Command Palette Integration

The extension adds commands to VSCode's command palette:

### Available Commands

- `SpecVerse: Start MCP Server`
- `SpecVerse: Stop MCP Server`
- `SpecVerse: Get Creation Prompt`
- `SpecVerse: Get Analysis Prompt`
- `SpecVerse: Show Library Suggestions`
- `SpecVerse: Validate Specification` (if orchestrator available)
- `SpecVerse: Generate Implementation` (if orchestrator available)

### Context Menu Integration

```json
{
  "menus": {
    "explorer/context": [
      {
        "when": "resourceExtname == .specly",
        "command": "specverse.analyzeFile",
        "group": "specverse"
      }
    ],
    "editor/context": [
      {
        "when": "resourceExtname == .specly",
        "command": "specverse.getCreationPrompt",
        "group": "specverse"
      }
    ]
  }
}
```

## Settings and Configuration

### Extension Settings

```json
{
  "specverse.mcpServer.autoStart": {
    "type": "boolean",
    "default": true,
    "description": "Automatically start MCP server when extension activates"
  },
  "specverse.orchestrator.detectPath": {
    "type": "string",
    "default": "",
    "description": "Custom path to SpecVerse orchestrator"
  },
  "specverse.resources.preferEmbedded": {
    "type": "boolean", 
    "default": false,
    "description": "Prefer embedded resources over file system"
  },
  "specverse.logging.enabled": {
    "type": "boolean",
    "default": false,
    "description": "Enable debug logging"
  }
}
```

### User Configuration

Users can configure the extension in their VSCode settings:

```json
{
  "specverse.mcpServer.autoStart": true,
  "specverse.orchestrator.detectPath": "/custom/path/to/specverse",
  "specverse.logging.enabled": true
}
```

## Development and Testing

### Local Development

```bash
# Build extension
npm run build:extension

# Test in VSCode Extension Host
code --extensionDevelopmentPath=/path/to/dist/extension

# Or package for distribution
cd dist/extension
vsce package
```

### Extension Testing

```typescript
// Test suite for extension
import * as assert from 'assert';
import * as vscode from 'vscode';
import { VSCodeExtensionMCPServer } from '../extension-wrapper';

suite('Extension Test Suite', () => {
  test('MCP Server initializes', async () => {
    const server = new VSCodeExtensionMCPServer('/test/path');
    assert.ok(server);
  });

  test('Orchestrator detection works', async () => {
    const server = new VSCodeExtensionMCPServer('/test/path');
    const hasOrchestrator = server.detectOrchestrator();
    assert.ok(typeof hasOrchestrator === 'boolean');
  });
});
```

## Performance Considerations

### Memory Usage
- **With Orchestrator**: ~30MB
- **Without Orchestrator**: ~15MB
- **Lazy Loading**: Resources loaded on-demand

### Startup Performance
- **Extension Activation**: ~200ms
- **MCP Server Start**: ~100ms
- **Resource Loading**: ~50ms

### Resource Optimization
- Embedded resources for offline usage
- File system fallback for development
- Intelligent caching for repeated access

## Troubleshooting

### Common Issues

**Extension Won't Activate**:
```bash
# Check extension logs
code --log-level trace

# Look for SpecVerse extension errors in Output panel
```

**MCP Server Fails to Start**:
```typescript
// Enable logging in extension settings
"specverse.logging.enabled": true

// Check VSCode Developer Tools Console
// Help -> Toggle Developer Tools
```

**Orchestrator Not Detected**:
```bash
# Verify SpecVerse installation
specverse --version

# Check custom path setting
"specverse.orchestrator.detectPath": "/custom/path"
```

**Resource Access Issues**:
```typescript
// Test resource loading
const server = new VSCodeExtensionMCPServer(extensionPath);
const resources = await server.getController().listResources();
console.log('Available resources:', resources.length);
```

### Debugging

**Enable Extension Logging**:
1. Open VSCode settings
2. Search for "specverse.logging"
3. Enable logging
4. Restart VSCode
5. Check Output panel → "SpecVerse"

**Manual Testing**:
```typescript
// Test MCP server directly
const server = new VSCodeExtensionMCPServer(__dirname);
await server.start();

const controller = server.getController();
const result = await controller.callTool('get_creation_prompt', {
  requirements: 'Test application'
});
console.log(result);
```

## Future Enhancements

### Planned Features
- **Workspace Integration**: Multi-root workspace support
- **Git Integration**: Version control aware prompts
- **Code Lens**: Inline SpecVerse hints
- **Auto-completion**: Smart completion for `.specly` files
- **Diagnostics**: Real-time validation and errors
- **Refactoring**: Automated specification updates

### IDE Features
- **Syntax Highlighting**: Enhanced `.specly` syntax
- **Outline View**: Specification structure view
- **Go to Definition**: Navigate to library definitions
- **Find References**: Find all usages
- **Rename Symbol**: Refactor across files

The extension deployment bridges the gap between full local development and lightweight resource access, providing the best experience for VSCode users regardless of their SpecVerse installation.