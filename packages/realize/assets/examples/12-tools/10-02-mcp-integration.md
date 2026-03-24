# SpecVerse MCP Integration

This example demonstrates how to use the SpecVerse Model Context Protocol (MCP) server to integrate AI-powered specification generation with AI assistants like Claude Desktop.

## Overview

The SpecVerse MCP server provides AI assistants with access to:
- SpecVerse schemas and documentation
- Library catalogs and examples
- AI-powered prompt generation tools
- Specification validation and processing

```yaml
version: "1.0.0"

# Example specification that could be generated via MCP tools
components:
  ECommercePlatform:
    version: "1.0.0"
    
    # Generated using: mcp_ai_enhance with requirements:
    # "e-commerce platform with inventory management"
    
    imports:
      - from: "@specverse/domains/ecommerce"
        select: [Product, Order, Customer]
      - from: "@specverse/deployments/microservices"
      - from: "@specverse/manifests/postgresql"
      
    models:
      Inventory:
        id: UUID required unique
        productId: UUID required
        quantity: Integer required min=0
        reservedQuantity: Integer required min=0 default=0
        location: String required
        lastUpdated: DateTime required default=now
        
        belongsTo: [Product.productId]
        
      InventoryTransaction:
        id: UUID required unique
        inventoryId: UUID required
        type: String required # 'restock', 'sale', 'adjustment'
        quantity: Integer required
        reason: String optional
        createdAt: DateTime required default=now
        
        belongsTo: [Inventory.inventoryId]
    
    relationships:
      - Product hasOne Inventory
      - Inventory hasMany InventoryTransaction
```

## MCP Server Setup

### Installation
```bash
# Install MCP server globally
npm install -g @specverse/mcp

# Or run locally
cd tools/specverse-mcp
npm install && npm run build
```

### Configuration for Claude Desktop

Add to Claude Desktop's `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "specverse": {
      "command": "specverse-mcp",
      "args": ["--mode", "local"],
      "env": {}
    }
  }
}
```

### Web Interface Setup
```bash
# Start web server for browser-based LLMs
specverse-mcp --mode web --port 3000

# Access resources via HTTP
curl http://localhost:3000/mcp/resources
```

## Available MCP Tools

### 1. AI Enhancement Tools

```typescript
// Get enhanced prompt with library context
await mcp_ai_enhance({
  operation: 'create',
  requirements: 'inventory management system',
  scale: 'business',
  technology_preferences: ['postgresql', 'microservices']
});

// Get library suggestions
await mcp_library_suggest({
  requirements: 'e-commerce with payments',
  domain: 'ecommerce',
  scale: 'enterprise'
});

// Estimate costs for execution
await mcp_cost_estimate({
  operation: 'create',
  requirements: 'healthcare app',
  provider: 'openai'
});
```

### 2. Specification Processing Tools

```typescript
// Validate SpecVerse specification
await mcp_validate_spec({
  specification: "components:\n  MyApp:\n    models:\n      User:\n        id: UUID required"
});

// Process specification with inference
await mcp_process_spec({
  specification: "...",
  generate_controllers: true,
  generate_services: true
});

// Generate documentation
await mcp_generate_docs({
  specification: "...",
  format: 'markdown'
});
```

### 3. Library and Schema Tools

```typescript
// Get library catalog
await mcp_get_library_catalog({
  domain: 'ecommerce'
});

// Get SpecVerse schema
await mcp_get_schema({
  version: '3.2.0',
  format: 'json'
});

// Get examples
await mcp_get_examples({
  category: 'ecommerce',
  complexity: 'intermediate'
});
```

## MCP Resources

The server provides these resources to AI assistants:

### Schemas and Documentation
- `specverse://schema/v3.2` - SpecVerse v3.2 JSON Schema
- `specverse://schema/ai-guide` - AI-friendly schema with examples
- `specverse://docs/syntax-guide` - Complete syntax documentation

### Library Catalog
- `specverse://libraries/catalog` - Complete library catalog with metadata
- `specverse://libraries/deployments` - Deployment pattern libraries
- `specverse://libraries/domains` - Domain-specific libraries
- `specverse://libraries/manifests` - Framework integration libraries

### Examples and Templates
- `specverse://examples/fundamentals` - Basic SpecVerse examples
- `specverse://examples/ecommerce` - E-commerce domain examples
- `specverse://examples/healthcare` - Healthcare domain examples
- `specverse://templates/quickstart` - Quick-start templates

### AI Guidance
- `specverse://ai/prompt-templates` - Optimized prompt templates
- `specverse://ai/best-practices` - AI development best practices
- `specverse://ai/library-guidance` - Library selection guidance

## Claude Desktop Integration Example

With the MCP server configured, you can interact with Claude Desktop:

```
User: Help me create a specification for an inventory management system

Claude: I'll help you create a SpecVerse specification for an inventory management system. Let me start by getting library recommendations and then generate an enhanced prompt.

[Claude calls mcp_library_suggest with inventory management requirements]

Based on the library analysis, I recommend:
- @specverse/domains/ecommerce for Product models
- @specverse/deployments/microservices for scalability  
- @specverse/manifests/postgresql for reliable data storage

[Claude calls mcp_ai_enhance to get the complete prompt with library context]

Now I'll create a comprehensive specification with these libraries integrated...
```

## Web Browser Integration

For web-based AI interfaces (ChatGPT, Claude.ai):

```javascript
// Fetch enhanced prompt via HTTP API
const response = await fetch('http://localhost:3000/mcp/tools/ai_enhance', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    operation: 'create',
    requirements: 'inventory management system',
    scale: 'business'
  })
});

const enhanced = await response.json();
console.log('Enhanced prompt:', enhanced.result);
```

## Docker Deployment

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY tools/specverse-mcp/package*.json ./
RUN npm ci --only=production
COPY tools/specverse-mcp/dist ./dist
COPY schema ./schema
COPY libs ./libs
COPY prompts ./prompts
EXPOSE 3000
CMD ["node", "dist/server.js", "--mode", "web", "--port", "3000"]
```

```bash
# Build and run
docker build -t specverse-mcp .
docker run -p 3000:3000 specverse-mcp
```

## Integration Benefits

### For AI Assistants
- **Rich Context**: Access to complete SpecVerse ecosystem knowledge
- **Library Awareness**: Automatic recommendations for proven patterns
- **Cost Transparency**: Full cost estimates before expensive operations
- **Validation**: Real-time specification validation and feedback

### For Developers  
- **Consistent Quality**: Same AI capabilities across all interfaces
- **Zero Setup**: Works with existing AI assistant setups
- **Flexible Deployment**: Local, web, or container deployment
- **Extensible**: Easy to add new tools and resources

### For Organizations
- **Standardized Workflows**: Consistent specification generation
- **Cost Control**: Transparent AI usage costs
- **Knowledge Sharing**: Centralized library and template access
- **Quality Assurance**: Built-in validation and best practices

## Advanced Configuration

```json
{
  "mcpServers": {
    "specverse": {
      "command": "specverse-mcp", 
      "args": [
        "--mode", "local",
        "--library-path", "./custom-libs",
        "--prompt-path", "./custom-prompts",
        "--cache-size", "100",
        "--debug"
      ],
      "env": {
        "SPECVERSE_LOG_LEVEL": "info",
        "SPECVERSE_CACHE_TTL": "3600"
      }
    }
  }
}
```

The MCP server bridges the gap between AI assistants and the SpecVerse ecosystem, providing intelligent, cost-conscious specification generation with full library awareness.