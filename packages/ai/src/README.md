# SpecVerse AI API

**Library-aware AI prompt building with zero-cost enhancement and cost-conscious execution.**

The SpecVerse AI API provides four hierarchical actions for AI-powered specification generation, from raw templates to enhanced prompts with library recommendations and cost estimates.

## Installation

```bash
npm install @specverse/lang
```

## Quick Start

```typescript
import { enhancePrompt } from '@specverse/lang/ai';

// Get enhanced prompt with library context (FREE)
const enhanced = await enhancePrompt('create', {
  requirements: 'blog application with user accounts',
  scale: 'business'
});

console.log(`📊 Token Estimate: ${enhanced.estimatedTokens}`);
console.log(`📚 Library Suggestions: ${enhanced.libraryContext.total}`);
console.log(`💰 Execution Options:`);
enhanced.executionOptions.forEach((option, i) => {
  const cost = option.estimatedCost ? `($${option.estimatedCost.toFixed(3)})` : '(Free)';
  console.log(`${i + 1}. ${option.description} ${cost}`);
});
```

## Core Principle

**Prompt Building (Free) → Execution Choice (Paid)**

Users get maximum value at zero cost through enhanced prompts, then choose how/when to execute with full cost transparency.

## API Reference

### The Four Hierarchical Actions

#### Action 1: `getTemplate()`
Get raw prompt template for specified operation.

```typescript
import { getTemplate } from '@specverse/lang/ai';

const template = await getTemplate('create');
console.log(template.system);  // System prompt template
console.log(template.user);    // User prompt template  
console.log(template.variables); // Available variables
```

**Use Case**: Understanding prompt structure, manual customization.

#### Action 2: `fillTemplate()`
Fill template with user requirements and parameters.

```typescript
import { fillTemplate } from '@specverse/lang/ai';

const filled = await fillTemplate('create', {
  requirements: 'task management app',
  scale: 'business',
  framework: 'react'
});

console.log(filled.systemPrompt); // Complete system prompt
console.log(filled.userPrompt);   // Complete user prompt
```

**Use Case**: Ready-to-copy prompts for manual execution.

#### Action 3: `suggestLibraries()`
Generate library recommendations based on requirements.

```typescript
import { suggestLibraries } from '@specverse/lang/ai';

const suggestions = await suggestLibraries({
  requirements: 'healthcare patient management',
  scale: 'enterprise',
  compliance: ['HIPAA']
});

console.log(`Found ${suggestions.total} relevant libraries:`);
suggestions.suggestions.forEach(lib => {
  const expansion = lib.expansion_factor ? ` (${lib.expansion_factor}x expansion)` : '';
  console.log(`📦 ${lib.name}${expansion}: ${lib.rationale}`);
});
```

**Use Case**: Understanding available libraries before execution.

#### Action 4: `enhancePrompt()` - **MOST VALUABLE**
Combine parameter-filled template with library suggestions and cost estimates.

```typescript
import { enhancePrompt } from '@specverse/lang/ai';

const enhanced = await enhancePrompt('create', {
  requirements: 'e-commerce store with payments',
  scale: 'business',
  technology_preferences: ['react', 'postgresql']
});

// Maximum value at zero cost
console.log('🌟 Enhanced Prompt (MOST VALUABLE):');
console.log(`📊 Token Estimate: ${enhanced.estimatedTokens} tokens`);
console.log(`📚 Library Context: ${enhanced.libraryContext.total} suggestions`);

console.log('\n💰 Execution Options:');
enhanced.executionOptions.forEach((option, index) => {
  const cost = option.estimatedCost ? ` ($${option.estimatedCost.toFixed(3)})` : ' (Free)';
  console.log(`${index + 1}. ${option.description}${cost}`);
});

console.log('\n🤖 System Prompt:');
console.log(enhanced.systemPrompt);
console.log('\n👤 User Prompt:');
console.log(enhanced.userPrompt);
```

**Use Case**: Complete prompt with library context, ready for execution with cost transparency.

## Types

### Core Types

```typescript
interface UserRequirements {
  requirements: string;
  scale?: 'personal' | 'business' | 'enterprise';
  framework?: string;
  domain?: string;
  compliance?: string[];
  technology_preferences?: string[];
}

interface EnhancedPrompt {
  systemPrompt: string;
  userPrompt: string;
  contextPrompt?: string;
  variables: Record<string, any>;
  libraryContext: AILibraryContext;
  estimatedTokens: number;
  estimatedCost?: Record<string, number>;
  executionOptions: ExecutionOption[];
}

interface ExecutionOption {
  provider: 'openai' | 'anthropic' | 'local' | 'interactive';
  model?: string;
  estimatedCost?: number;
  description: string;
}

type AIOperation = 'analyse' | 'create' | 'materialise' | 'realize' | 'infer';
```

## Integration Patterns

### Pattern 1: Custom Orchestrator

```typescript
import { enhancePrompt } from '@specverse/lang/ai';

class MyOrchestrator {
  async execute(operation: AIOperation, requirements: UserRequirements) {
    // Use SpecVerse AI API for enhanced prompts
    const enhanced = await enhancePrompt(operation, requirements);
    
    console.log(`Executing with ${enhanced.estimatedTokens} tokens`);
    console.log(`Using ${enhanced.libraryContext.total} library suggestions`);
    
    // Execute with your preferred provider
    return await myProvider.complete({
      system: enhanced.systemPrompt,
      user: enhanced.userPrompt
    });
  }
}
```

### Pattern 2: Cost-Aware Execution

```typescript
import { enhancePrompt } from '@specverse/lang/ai';

async function executeWithBudget(operation: AIOperation, requirements: UserRequirements, maxCost: number) {
  const enhanced = await enhancePrompt(operation, requirements);
  
  // Find cheapest option within budget
  const affordableOptions = enhanced.executionOptions.filter(
    option => (option.estimatedCost || 0) <= maxCost
  );
  
  if (affordableOptions.length === 0) {
    throw new Error(`No execution options within budget of $${maxCost}`);
  }
  
  const cheapest = affordableOptions[0];
  console.log(`Selected: ${cheapest.description} for $${cheapest.estimatedCost || 0}`);
  
  // Execute with selected provider...
}
```

### Pattern 3: Library-First Development

```typescript
import { suggestLibraries, enhancePrompt } from '@specverse/lang/ai';

async function libraryAwareDevelopment(requirements: UserRequirements) {
  // Step 1: Get library suggestions first
  const libraries = await suggestLibraries(requirements);
  
  console.log('📚 Available Libraries:');
  libraries.suggestions.forEach(lib => {
    console.log(`- ${lib.name}: ${lib.rationale}`);
  });
  
  // Step 2: Get enhanced prompt with library context
  const enhanced = await enhancePrompt('create', requirements);
  
  // Enhanced prompt now includes library guidance
  return enhanced;
}
```

### Pattern 4: Interactive Development

```typescript
import { enhancePrompt } from '@specverse/lang/ai';

async function interactiveDevelopment(requirements: UserRequirements) {
  const enhanced = await enhancePrompt('create', requirements);
  
  console.log('Copy this prompt to ChatGPT/Claude:');
  console.log('=' * 50);
  console.log('SYSTEM:', enhanced.systemPrompt);
  console.log('\nUSER:', enhanced.userPrompt);
  console.log('=' * 50);
  console.log(`Estimated tokens: ${enhanced.estimatedTokens}`);
  
  // User copies and pastes - zero cost execution
}
```

## CLI Integration

The API is also available via CLI commands:

```bash
# Action 1: Raw template
specverse ai template create

# Action 2: Parameter-filled template  
specverse ai fill create --requirements "blog app" --scale business

# Action 3: Library suggestions
specverse ai suggest --requirements "healthcare system" --compliance HIPAA

# Action 4: Enhanced prompt (MOST VALUABLE)
specverse ai enhance create --requirements "e-commerce store" --scale business
```

## Cost Philosophy

### Zero-Cost Prompt Building
All four actions run locally with no API calls:
- Template retrieval: **Free**
- Parameter filling: **Free**  
- Library suggestions: **Free**
- Enhanced prompts: **Free**

### Transparent Execution Costs
Action 4 provides complete cost estimates:
- Token estimates for all providers
- Cost breakdown by provider
- Execution options from free (copy-paste) to premium (GPT-4)

### Cost-Conscious Design
Users control when and how they incur costs:
```typescript
const enhanced = await enhancePrompt('create', requirements);

// Free: Copy prompt to web interface
console.log('Free option:', enhanced.userPrompt);

// Paid: Execute with API
if (userConfirms(`Cost: $${enhanced.estimatedCost.openai}`)) {
  // Execute with OpenAI...
}
```

## Library Awareness

The API automatically provides library-aware recommendations:

### Deployment Libraries
- **monolith** (1.5x expansion): Single-instance applications
- **microservices** (3.2x expansion): Distributed architectures  
- **enterprise** (5.8x expansion): Compliance and security
- **jamstack** (2.1x expansion): Static sites with APIs

### Domain Libraries  
- **ecommerce**: Complete e-commerce models
- **healthcare**: HIPAA-compliant healthcare models
- **business**: General business domain models

### Framework Integrations
- **nextjs**: React framework with SSR/SSG
- **oauth**: Authentication patterns
- **postgresql**: Database integration
- **sqlite**: Lightweight database

## Examples

See the `/examples` directory for complete working examples:
- `basic-usage.ts` - Simple API usage
- `custom-orchestrator.ts` - Building your own orchestrator
- `cost-aware-execution.ts` - Budget-conscious development
- `library-first-development.ts` - Library-aware workflows

## Contributing

The SpecVerse AI API is designed for extensibility. To add new operations or enhance existing ones:

1. Add operation to `AIOperation` type
2. Create prompt template in `prompts/core/standard/`
3. Update command implementations in `src/ai/commands/`
4. Add tests and documentation

## Support

- **GitHub Issues**: Report bugs and request features
- **Documentation**: Complete API reference and examples
- **CLI Help**: Run `specverse ai --help` for command reference