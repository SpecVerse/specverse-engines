# SpecVerse AI API Usage

This example demonstrates the four hierarchical AI actions that provide maximum value at zero cost.

## Core Principle: Prompt Building (Free) → Execution Choice (Paid)

The SpecVerse AI API separates cost-free prompt building from paid execution, giving users full control over when and how they incur costs.

```yaml
version: "1.0.0"

# Example: Using AI API programmatically
components:
  BlogPlatform:
    version: "1.0.0"
    
    # This specification could be generated using the AI API:
    # const enhanced = await enhancePrompt('create', {
    #   requirements: 'blog platform with user accounts',
    #   scale: 'business'
    # });
    
    models:
      User:
        id: UUID required unique
        email: Email required unique
        username: String required unique searchable
        displayName: String required
        createdAt: DateTime required default=now
        
      Post:
        id: UUID required unique  
        title: String required searchable
        slug: String required unique searchable
        content: Text required
        status: String required default="draft"
        publishedAt: DateTime optional
        authorId: UUID required
        createdAt: DateTime required default=now
        updatedAt: DateTime required default=now
        
        belongsTo: [User.authorId]
        
      Comment:
        id: UUID required unique
        content: Text required  
        postId: UUID required
        authorId: UUID required
        createdAt: DateTime required default=now
        
        belongsTo: [Post.postId, User.authorId]
    
    relationships:
      - User hasMany Post as author
      - Post hasMany Comment  
      - User hasMany Comment as author
```

## JavaScript/TypeScript API Usage

```javascript
import { 
  getTemplate,      // Action 1: Raw template
  fillTemplate,     // Action 2: Parameter-filled  
  suggestLibraries, // Action 3: Library suggestions
  enhancePrompt     // Action 4: Enhanced prompt (MOST VALUABLE)
} from '@specverse/lang/ai';

// Action 4: Get enhanced prompt with library context (FREE)
const enhanced = await enhancePrompt('create', {
  requirements: 'blog platform with user accounts and content management',
  scale: 'business',
  framework: 'react',
  technology_preferences: ['postgresql', 'oauth']
});

console.log(`📊 Token Estimate: ${enhanced.estimatedTokens}`);
console.log(`📚 Library Suggestions: ${enhanced.libraryContext.total}`);
console.log(`💰 Execution Options:`);
enhanced.executionOptions.forEach((option, i) => {
  const cost = option.estimatedCost ? `($${option.estimatedCost.toFixed(3)})` : '(Free)';
  console.log(`${i + 1}. ${option.description} ${cost}`);
});

// Enhanced prompt contains:
// - enhanced.systemPrompt (with library guidance)
// - enhanced.userPrompt (with library context)  
// - enhanced.libraryContext (recommended libraries)
// - enhanced.estimatedTokens (cost estimates)
// - enhanced.executionOptions (free to premium)
```

## CLI Usage

```bash
# Action 1: Get raw template
specverse ai template create

# Action 2: Fill with parameters
specverse ai fill create --requirements "blog platform" --scale business

# Action 3: Get library suggestions  
specverse ai suggest --requirements "blog with user accounts" --tech react,postgresql

# Action 4: Enhanced prompt (MOST VALUABLE)
specverse ai enhance create \
  --requirements "blog platform with user accounts and content management" \
  --scale business \
  --framework react \
  --tech postgresql,oauth \
  --copy
```

## Integration Patterns

### Pattern 1: Custom Orchestrator
```javascript
import { enhancePrompt } from '@specverse/lang/ai';

class MyOrchestrator {
  async execute(operation, requirements) {
    // Use SpecVerse API for enhanced prompts
    const enhanced = await enhancePrompt(operation, requirements);
    
    console.log(`Using ${enhanced.libraryContext.total} library suggestions`);
    
    // Execute with your preferred provider
    return await myProvider.complete({
      system: enhanced.systemPrompt,
      user: enhanced.userPrompt
    });
  }
}
```

### Pattern 2: Cost-Aware Development
```javascript
async function executeWithBudget(operation, requirements, maxCost) {
  const enhanced = await enhancePrompt(operation, requirements);
  
  // Find cheapest option within budget
  const affordable = enhanced.executionOptions.filter(
    option => (option.estimatedCost || 0) <= maxCost
  );
  
  if (affordable.length === 0) {
    console.log('💡 Free option: Copy prompt to ChatGPT/Claude');
    console.log(enhanced.userPrompt);
    return;
  }
  
  const selected = affordable[0];
  console.log(`Selected: ${selected.description} for $${selected.estimatedCost || 0}`);
  // Execute with selected provider...
}
```

### Pattern 3: Library-First Development
```javascript
import { suggestLibraries, enhancePrompt } from '@specverse/lang/ai';

async function libraryAwareDevelopment(requirements) {
  // Step 1: Get library suggestions first
  const libraries = await suggestLibraries(requirements);
  
  console.log('📚 Available Libraries:');
  libraries.suggestions.forEach(lib => {
    const expansion = lib.expansion_factor ? ` (${lib.expansion_factor}x expansion)` : '';
    console.log(`- ${lib.name}${expansion}: ${lib.rationale}`);
  });
  
  // Step 2: Get enhanced prompt with library context
  const enhanced = await enhancePrompt('create', requirements);
  
  // Enhanced prompt now includes library guidance
  return enhanced;
}
```

## Benefits

### Zero-Cost Prompt Building
- All four actions run locally with no API calls
- Template retrieval: **Free**
- Parameter filling: **Free**  
- Library suggestions: **Free**
- Enhanced prompts: **Free**

### Maximum Value at Zero Cost
Action 4 (enhancePrompt) provides:
- Complete system and user prompts
- Library-aware context and recommendations  
- Token estimates for all providers
- Cost breakdown by provider
- Execution options from free to premium

### Cost-Conscious Design
Users control when and how they incur costs:
- **Free**: Copy enhanced prompt to web interfaces (ChatGPT, Claude.ai)
- **Local**: Execute with local models (Ollama, LM Studio)  
- **API**: Execute with cloud providers with full cost transparency

### Library Awareness
Automatic recommendations from SpecVerse library ecosystem:
- **Deployment patterns**: monolith, microservices, enterprise, jamstack
- **Domain libraries**: ecommerce, healthcare, business
- **Framework integrations**: nextjs, oauth, postgresql, sqlite
- **Expansion factors**: 1.5x to 5.8x code generation multipliers