# 09-API: SpecVerse API Integration Examples

These are complete examples for programmatic usage of the SpecVerse Language API in TypeScript and JavaScript applications.

## Overview

This directory contains comprehensive API integration examples demonstrating how to use SpecVerse programmatically in your applications. These examples cover the complete workflow from parsing specifications to generating code and documentation.

## Files Overview

- specverse-lang/examples/10-api/usage-example.js 
- specverse-lang/examples/10-api/usage-example.ts

**Comprehensive API usage examples** showing the complete SpecVerse workflow:

- **Parsing**: Load and validate .specly files
- **AI Inference**: Run logical inference to enhance specifications
- **Code Generation**: Generate diagrams, documentation, and YAML output
- **Error Handling**: Proper error management patterns
- **Full Workflow**: End-to-end specification processing

**Best for**: Learning the API, understanding all capabilities, integration planning

<!-- ### **"[workflow-test.js]"**a -->
- specverse-lang/examples/10-api/workflow-test.js

**Focused end-to-end workflow test** for production validation:

- **Quick Testing**: Minimal test for API functionality validation
- **CI/CD Integration**: Suitable for automated testing pipelines  
- **Error Reporting**: Clear success/failure indicators with actionable feedback
- **Self-Contained**: Includes embedded test specification

**Best for**: CI/CD pipelines, automated testing, quick API health checks

<!-- ### **[package-integration-test.js](./package-integration-test.js)** -->
- specverse-lang/examples/10-api/package-integration-test.js
**npm package installation and integration test**:

- **Package Testing**: Validates complete npm installation workflow
- **Real-world Simulation**: Tests actual published package usage
- **API Verification**: Confirms all API features work after installation
- **Integration Validation**: End-to-end package integration testing

**Best for**: Release validation, package testing, integration verification

## Getting Started

### Quick Start

```bash
# Run comprehensive API examples
node examples/10-api/usage-example.js

# Run focused workflow test  
node examples/10-api/workflow-test.js

# Run package integration test
node examples/10-api/package-integration-test.js
```

### Integration in Your Project

1. **Install SpecVerse Language**:
   ```bash
   npm install @specverse/lang
   ```

2. **Copy and adapt examples**:
   - Start with `usage-example.js` or `usage-example.ts`
   - Modify for your specific use case
   - Use `workflow-test.js` for testing integration

3. **Key API Components**:
   ```javascript
   import { SpecVerseParser, LogicalInferenceEngine, UMLDiagramGenerator } from '@specverse/lang';
   ```

## API Features Demonstrated

### 🔧 Core Parsing
- Load and validate SpecVerse specifications
- Schema validation with comprehensive error reporting
- Convention processing and normalization

### 🤖 AI Inference Engine
- Logical inference for architecture generation
- Controller, service, and event generation
- Relationship inference and optimization

### 📊 Code Generation
- UML diagram generation (ER, Architecture, Sequence, Lifecycle)
- YAML output generation
- Documentation generation

### ⚡ Error Handling
- Comprehensive error reporting
- Validation feedback
- Processing diagnostics

## Integration Patterns

### Web Applications
```javascript
// React/Vue/Angular integration
import { SpecVerseParser } from '@specverse/lang';

const parser = new SpecVerseParser(schema);
const result = parser.parseContent(specContent, 'component.specly');
```

### Build Tools
```javascript
// webpack/vite plugin integration
const { processSpecification } = require('@specverse/lang');

// In build pipeline
const output = await processSpecification(inputPath, outputPath);
```

### API Services
```javascript
// Express/Fastify API endpoint
app.post('/api/specverse/validate', async (req, res) => {
  const result = await validateSpecification(req.body.spec);
  res.json(result);
});
```

### CLI Tools
```javascript
// Custom CLI tool integration
#!/usr/bin/env node
const { SpecVerseParser } = require('@specverse/lang');
// Custom CLI implementation
```

## Testing Integration

All API examples are integrated into the SpecVerse test suite:

```bash
# Run API tests as part of main test suite
npm test

# Run API tests individually
npm run test:api              # workflow-test.js
npm run test:api:package      # package-integration-test.js
```

## TypeScript Support

SpecVerse provides complete TypeScript definitions:

```typescript
import { 
  SpecVerseParser,
  LogicalInferenceEngine,
  ParseResult,
  InferenceConfig 
} from '@specverse/lang';

const parser: SpecVerseParser = new SpecVerseParser(schema);
const result: ParseResult = parser.parseContent(content, filename);
```

## Error Handling Patterns

### Validation Errors
```javascript
try {
  const result = parser.parseContent(content, filename);
  if (!result.success) {
    console.error('Validation failed:', result.errors);
  }
} catch (error) {
  console.error('Parse error:', error.message);
}
```

### Inference Errors
```javascript
try {
  const inference = await engine.inferLogicalSpecification(models, componentName);
} catch (error) {
  if (error.code === 'INFERENCE_FAILED') {
    // Handle inference-specific errors
  }
}
```

## Performance Considerations

- **Parsing**: Sub-5ms for typical specifications
- **Inference**: Highly optimized rule processing
- **Memory**: Efficient rule loading and caching
- **Concurrent**: Safe for concurrent processing

## Next Steps

After exploring these API examples:

1. **Integrate**: Add SpecVerse to your project
2. **Customize**: Adapt examples to your use case  
3. **Test**: Use workflow-test.js pattern for validation
4. **Deploy**: Use package-integration-test.js for release validation

## Related Documentation

- [Main Examples](../) - Learning examples and language features
- [CLI Reference](/reference/cli) - Command-line interface
- [API Documentation](https://specverse.dev/api/) - Complete API reference

---

**💡 Pro Tip**: Start with `usage-example.js` to understand the complete API, then use `workflow-test.js` patterns for production integration!