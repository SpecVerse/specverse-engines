# SpecVerse Import Resolver

Simplified import resolution for SpecVerse v3.1 specifications.

## Features

✅ **Local Files** - Resolve relative and absolute file paths
✅ **NPM Packages** - Use standard Node.js package resolution  
✅ **URLs** - Fetch remote specifications with local caching
✅ **Offline Mode** - Work offline using cached content
✅ **Simple API** - Clean, easy-to-use interface

## Installation

```typescript
import { ImportResolver } from '@specverse/import-resolver';
```

## Usage

### Basic Usage

```typescript
const resolver = new ImportResolver({
  basePath: process.cwd(),
  cacheDir: '~/.specverse/cache'
});

// Resolve local file
const localImport = await resolver.resolve({
  file: '../common/types.yaml'
});

// Resolve NPM package
const npmImport = await resolver.resolve({
  from: '@specverse/standards'
});

// Resolve URL (with automatic caching)
const urlImport = await resolver.resolve({
  from: 'https://raw.githubusercontent.com/company/specs/main/types.yaml'
});
```

### Import Specifications

```yaml
# In your .specly file
import:
  # Local file
  - file: "../common/types.yaml"
    select: [UUID, DateTime]
  
  # NPM package
  - from: "@specverse/standards"
    select: [PostgresConfig, RedisConfig]
  
  # NPM package with version
  - package: "@company/domain-models"
    version: "^2.0.0"
    select: [User, Product]
  
  # Direct URL (cached locally)
  - from: "https://raw.githubusercontent.com/company/specs/main/auth.yaml"
    select: [AuthToken, Session]
```

### NPM Package Structure

For NPM packages to be resolvable, they should include SpecVerse specifications:

```json
// package.json
{
  "name": "@company/domain-models",
  "version": "1.0.0",
  "specverse": {
    "main": "index.yaml",
    "exports": {
      "auth": "auth/index.yaml",
      "products": "products/index.yaml"
    }
  },
  "files": [
    "index.yaml",
    "auth/",
    "products/"
  ]
}
```

The resolver looks for SpecVerse files in this order:
1. `package.json` → `specverse.main` field
2. `package.json` → `specverse` field (if string)
3. Common locations:
   - `index.yaml`
   - `index.yml`
   - `index.specly`
   - `specverse.yaml`
   - `specs/index.yaml`
   - `specs/main.specly`

### Cache Management

```typescript
// Get cache statistics
const stats = await resolver.getCacheStats();
console.log(`Cache size: ${stats.size} bytes`);
console.log(`Cached URLs: ${stats.count}`);

// List cached URLs
const cached = await resolver.listCached();
for (const item of cached) {
  console.log(`${item.url} - expires: ${new Date(item.expires)}`);
}

// Clear cache
await resolver.clearCache();
```

### Offline Mode

```typescript
const resolver = new ImportResolver({
  offline: true // Only use cached content, don't fetch
});

// This will use cache if available, otherwise throw error
const import = await resolver.resolve({
  from: 'https://example.com/spec.yaml'
});
```

### Advanced Options

```typescript
const resolver = new ImportResolver({
  // Base path for relative file resolution
  basePath: '/path/to/project',
  
  // Cache settings
  cacheDir: '~/.specverse/cache',
  cacheTTL: 7 * 24 * 60 * 60 * 1000, // 7 days
  
  // Offline mode
  offline: false,
  
  // HTTP settings
  timeout: 30000, // 30 seconds
  headers: {
    'Authorization': 'Bearer token'
  },
  
  // Debug output
  debug: true
});
```

## How It Works

### Resolution Order

1. **File** - If `file` property is present, resolve as local file
2. **URL** - If `from` starts with `http://` or `https://`, resolve as URL
3. **NPM** - If `package` property or `from` looks like package name
4. **Fallback** - Try as relative file for backward compatibility

### Caching Strategy

URLs are cached locally with:
- SHA256 hash as filename
- Metadata file with expiry, ETag, etc.
- Default TTL of 24 hours
- Content-type detection

### NPM Resolution

Uses standard Node.js `require.resolve()` to find packages:
- Searches in `node_modules`
- Respects workspace packages
- Follows Node.js resolution algorithm

## Integration with SpecVerse Parser

```typescript
import { SpecVerseParser } from '@specverse/parser';
import { ImportResolver } from '@specverse/import-resolver';

const resolver = new ImportResolver();
const parser = new SpecVerseParser(schema);

// Parse main specification
const mainSpec = await parser.parseFile('specs/main.specly');

// Resolve imports
for (const importSpec of mainSpec.imports || []) {
  const resolved = await resolver.resolve(importSpec);
  
  // Parse imported content
  const imported = await parser.parse(resolved.content);
  
  // Extract selected types
  if (importSpec.select) {
    // Filter to only selected types
  }
}
```

## Publishing Packages

To publish SpecVerse specifications as NPM packages:

```bash
# Create package structure
my-specs/
├── package.json
├── index.yaml          # Main specification
├── auth/
│   └── index.yaml      # Auth-related types
└── products/
    └── index.yaml      # Product-related types

# In package.json
{
  "name": "@mycompany/specs",
  "version": "1.0.0",
  "specverse": {
    "main": "index.yaml"
  }
}

# Publish to NPM
npm publish
```

Then others can use:
```yaml
import:
  - from: "@mycompany/specs"
    select: [User, Product, Order]
```

## Error Handling

The resolver provides clear error messages:

```typescript
try {
  await resolver.resolve({ file: './missing.yaml' });
} catch (error) {
  // Error: Failed to read file './missing.yaml': ENOENT: no such file or directory
}

try {
  await resolver.resolve({ package: 'non-existent' });
} catch (error) {
  // Error: Failed to resolve NPM package 'non-existent': Cannot find module
}

try {
  await resolver.resolve({ from: 'https://bad-url.com/spec.yaml' });
} catch (error) {
  // Error: Failed to fetch URL 'https://bad-url.com/spec.yaml': HTTP 404: Not Found
}
```

## Future Enhancements

Potential future additions (not implemented yet):
- GitHub shorthand: `github:owner/repo/path.yaml`
- Workspace resolution enhancements
- ETag support for conditional requests
- Import maps for aliasing
- Parallel resolution for multiple imports
- Content validation before caching