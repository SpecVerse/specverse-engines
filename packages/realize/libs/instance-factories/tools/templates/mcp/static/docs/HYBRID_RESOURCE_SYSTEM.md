# SpecVerse Hybrid Resource System

## Overview

The SpecVerse Hybrid Resource System is a multi-environment resource provider that automatically adapts between filesystem and embedded resources based on deployment context. This enables universal deployment across local terminals, web-based LLM environments, VSCode extensions, and enterprise containers.

## Architecture

### Core Components

```
HybridResourcesProvider (Interface)
├── ResourcesProviderService (Filesystem)
├── EmbeddedResourcesAdapter (Embedded)
└── Auto-Detection Logic (Environment)
```

### Resource Provider Interface

```typescript
interface ResourceProvider {
  initializeResources(): Promise<void>;
  listResources(): Promise<SpecVerseResource[]>;
  getResourceContent(uri: string): Promise<string>;
  readResource(uri: string): Promise<MCPToolResult>;
  isResourceAvailable(uri: string): boolean;
  getCachedResourceCount(): number;
}
```

## Environment Detection

### Detection Priority Order

1. **Explicit Configuration** - `config.embeddedResources` provided
2. **Embedded Resources File** - `embedded-resources.js` exists
3. **Web Environment** - Browser-like indicators
4. **Filesystem Resources** - `resources/` directory exists
5. **Dynamic Import** - Attempt to load embedded resources
6. **Default Fallback** - Filesystem mode

### Detection Logic

```typescript
private detectMode(config: HybridConfig): 'filesystem' | 'embedded' {
  if (config.mode === 'filesystem') return 'filesystem';
  if (config.mode === 'embedded') return 'embedded';

  // Auto-detection priority
  if (config.embeddedResources) return 'embedded';
  if (this.hasEmbeddedResourcesFile()) return 'embedded';
  if (this.isWebEnvironment()) return 'embedded';
  
  const resourcesPath = config.resourcesPath || join(__dirname, '../../resources');
  if (existsSync(resourcesPath)) return 'filesystem';
  
  if (this.tryImportEmbeddedResources()) return 'embedded';
  return 'filesystem'; // Default
}
```

## Resource Modes

### Filesystem Mode (Local/Development)

**Used by**: Local terminals, development environments, VSCode with local server

**Characteristics**:
- Reads resources from actual files on disk
- Real-time updates when files change
- Full access to orchestrator and toolchain
- Optimal for development and local usage

**Resource Path Resolution**:
```typescript
private resolveResourcePath(uri: string): string {
  switch (uri) {
    case 'specverse://schema/json':
      return join(this.resourcesPath, 'schemas/SPECVERSE-V3.1-SCHEMA.json');
    case 'specverse://prompts/create':
      return join(this.resourcesPath, 'prompts/create.prompt.yaml');
    // ... additional mappings
  }
}
```

### Embedded Mode (Web/Remote)

**Used by**: Web-based LLM terminals, remote deployments, serverless functions

**Characteristics**:
- Resources bundled into application at build time
- No filesystem access required
- Optimized for web deployment and serverless
- Resources cached in memory for performance

**Resource Loading**:
```typescript
private async loadEmbeddedResourcesAsync(): Promise<EmbeddedResourcesMap | null> {
  const embeddedPath = join(dirname(__dirname), 'embedded-resources.js');
  if (existsSync(embeddedPath)) {
    const embeddedModule = await import(embeddedPath);
    return embeddedModule.EMBEDDED_RESOURCES || null;
  }
  return null;
}
```

## Build-Time Resource Embedding

### Web Build Process

1. **Resource Discovery**: Scan all required resources
2. **Content Reading**: Read file contents at build time
3. **Embedding**: Generate `embedded-resources.js` with all content
4. **Optimization**: Minify and optimize for web deployment

### Embedded Resources Structure

```javascript
export const EMBEDDED_RESOURCES = {
  "examples/chat-prompts/ecommerce-store-example.md": {
    "content": "...", // Chat integration examples
    "mimeType": "text/markdown",
    "size": 5696
  },
  "examples/api-calls/orchestrator-workflow-example.js": {
    "content": "...", // API integration examples
    "mimeType": "application/javascript", 
    "size": 7501
  }
  // Note: Schemas and prompts now provided through AI API
};
```

## Available Resources (Phase 3 Optimized)

**✅ NEW: AI API Integration**
As of Phase 3, most resources are now provided through intelligent AI tools rather than raw files:

### Schema Information
- **OLD**: `specverse://schema/json` - Raw 32KB JSON schema ❌ REMOVED  
- **NEW**: `mcp_ai_enhance` tool - Contextual, schema-aware prompts ✅

### Library Suggestions  
- **OLD**: `specverse://libraries/catalog` - Raw 8KB catalog dump ❌ REMOVED
- **NEW**: `mcp_library_suggest` tool - Intelligent, contextual recommendations ✅

### Prompt Templates
- **OLD**: Static prompt files (48KB total) ❌ REMOVED
- **NEW**: AI API generates dynamic, contextual prompts ✅

### Example Resources (Still Available)
- `specverse://examples/chat-prompts` - Terminal/chat examples 
- `specverse://examples/api-calls` - API integration examples

### Benefits of AI Tool Approach
- **Contextual**: AI provides relevant info based on user's specific needs
- **Intelligent**: Smart recommendations vs raw data dumps  
- **Up-to-date**: Always uses latest AI knowledge vs static files
- **Smaller**: 96KB reduction in package size

## Performance Characteristics

### Resource Loading Performance
- **First Access**: Dynamic loading from embedded/filesystem
- **Subsequent Access**: Cached in memory (sub-millisecond)
- **Total Embedded Size**: 167,204 bytes (13 resources)
- **Memory Footprint**: Efficient caching with lazy loading

### Build Performance
- **Web Build Time**: ~2-3 seconds for resource embedding
- **Resource Embedding**: 13 files → Single JavaScript module
- **Compression**: Resources are stored as strings (future: compression)

## Error Handling

### Graceful Fallback
```typescript
async initializeResources(): Promise<void> {
  if (this.mode === 'embedded' && this.provider instanceof EmbeddedResourcesAdapter) {
    const providerInfo = this.provider.getEmbeddedResourcesInfo();
    if (providerInfo.count === 0) {
      try {
        const embeddedResources = await this.loadEmbeddedResourcesAsync();
        if (embeddedResources) {
          this.provider = new EmbeddedResourcesAdapter(embeddedResources);
        }
      } catch (error) {
        console.warn('Failed to load embedded resources, falling back to filesystem:', error);
        this.mode = 'filesystem';
        this.provider = new ResourcesProviderService();
      }
    }
  }
  
  return this.provider.initializeResources();
}
```

### Error Recovery
- **Missing Embedded Resources**: Falls back to filesystem mode
- **Invalid Resource URIs**: Returns proper error responses
- **File Access Errors**: Graceful error messages
- **Network Issues**: Local fallback for hybrid mode

## Usage Examples

### Basic Usage
```typescript
import { HybridResourcesProvider } from './services/HybridResourcesProvider.js';

// Auto-detect mode based on environment
const provider = new HybridResourcesProvider({ mode: 'auto' });
await provider.initializeResources();

// List all available resources
const resources = await provider.listResources();
console.log(`Loaded ${resources.length} resources`);

// Get specific resource content
const schema = await provider.getResourceContent('specverse://schema/json');
console.log(`Schema size: ${schema.length} characters`);
```

### Explicit Mode Configuration
```typescript
// Force filesystem mode
const fsProvider = new HybridResourcesProvider({ 
  mode: 'filesystem',
  resourcesPath: '/custom/path/to/resources'
});

// Force embedded mode with custom resources
const embeddedProvider = new HybridResourcesProvider({
  mode: 'embedded',
  embeddedResources: customResourceMap
});
```

### Environment Information
```typescript
const provider = new HybridResourcesProvider({ mode: 'auto' });
await provider.initializeResources();

const info = provider.getProviderInfo();
console.log(`Mode: ${info.mode}`);
console.log(`Type: ${info.type}`);
console.log(`Resources: ${info.resourcesInfo.count || info.resourcesInfo.cached}`);
```

## Integration with MCP Server

### Controller Integration
```typescript
export class MCPServerController {
  private resourcesProvider: HybridResourcesProvider;

  constructor(config: MCPServerConfig) {
    this.resourcesProvider = new HybridResourcesProvider({
      mode: 'auto',
      resourcesPath: config.resources_path
    });
  }

  async listResources(): Promise<SpecVerseResource[]> {
    return this.resourcesProvider.listResources();
  }

  async readResource(uri: string): Promise<SpecVerseResource> {
    const content = await this.resourcesProvider.getResourceContent(uri);
    const resources = await this.resourcesProvider.listResources();
    const resource = resources.find(r => r.uri === uri);
    
    return { ...resource, content };
  }
}
```

### HTTP API Endpoints
```typescript
// In web deployment mode
server.get('/mcp/resources', async (req, res) => {
  const resources = await controller.listResources();
  res.json({ resources, count: resources.length });
});

server.get('/mcp/resource/:uri', async (req, res) => {
  const uri = decodeURIComponent(req.params.uri);
  const resource = await controller.readResource(uri);
  res.json({ content: [{ type: 'resource', resource }] });
});
```

## Future Enhancements

### Planned Features
- **Resource Compression**: Gzip compression for embedded resources
- **Incremental Loading**: Load resources on-demand for large deployments
- **Resource Caching**: HTTP caching headers for web deployments
- **Hot Reload**: Development mode file watching
- **Resource Validation**: Schema validation for embedded resources

### Performance Optimizations
- **Lazy Loading**: Load resources only when requested
- **Memory Management**: Release unused resources
- **Compression**: Reduce embedded resource size
- **CDN Integration**: External resource hosting for web deployments

## Testing

### Test Coverage
- ✅ Environment detection logic
- ✅ Filesystem resource loading
- ✅ Embedded resource loading
- ✅ Error handling and fallback
- ✅ HTTP API serving
- ✅ Performance characteristics

### Test Results
```
Build Outputs:    ✅ PASS (All deployment artifacts created)
Local Deployment: ✅ PASS (Filesystem resources working)  
Web Deployment:   ✅ PASS (Embedded resources + HTTP serving)
Overall Success:  100% ✅
```

## Conclusion

The Hybrid Resource System successfully enables SpecVerse to work across all deployment environments while maintaining optimal performance and resource efficiency. The automatic mode detection ensures the right resource strategy is used for each environment, while the unified interface keeps the codebase simple and maintainable.