/**
 * Example usage of the SpecVerse Prompt System
 * Demonstrates how to load and process prompts with the PromptLoader
 */

import { promptLoader } from '../src/prompts/prompt-loader';

async function demonstratePromptUsage() {
  console.log('SpecVerse Prompt System Demo\n');

  try {
    // 1. List all available prompts
    console.log('📋 Available prompts:');
    const prompts = await promptLoader.listPrompts();
    prompts.forEach(({ path, definition }) => {
      console.log(`  - ${path}: ${definition.description}`);
    });
    console.log('');

    // 2. Load and process the 'create' prompt
    console.log('🔧 Processing "create" prompt...');
    const createPrompt = await promptLoader.processPrompt(
      'standard/create',
      {
        requirements: 'Build a simple blog where users can write posts with titles and content. Posts should have tags for organization.',
        scale: 'personal',
        preferredTech: 'nextjs'
      }
    );

    console.log('System Prompt Preview:');
    console.log(createPrompt.system.substring(0, 200) + '...\n');

    console.log('User Prompt Preview:');
    console.log(createPrompt.user.substring(0, 300) + '...\n');

    // 3. Load and process the 'analyse' prompt
    console.log('🔍 Processing "analyse" prompt...');
    const analysePrompt = await promptLoader.processPrompt(
      'standard/analyse',
      {
        applicationPath: '/path/to/my-app',
        frameworkType: 'nextjs',
        directoryStructure: 'my-app/\n├── app/\n│   └── api/\n└── package.json',
        filesContent: '=== package.json ===\n{ "name": "my-app" }'
      }
    );

    console.log('Analysis Prompt Ready:');
    console.log(`- System prompt length: ${analysePrompt.system.length} chars`);
    console.log(`- User prompt length: ${analysePrompt.user.length} chars`);
    console.log(`- Context includes: ${Object.keys(analysePrompt.context.includes).join(', ')}\n`);

    // 4. Validate a prompt
    console.log('✅ Validating prompt structure...');
    const prompt = await promptLoader.loadPrompt('standard/create');
    const validation = promptLoader.validatePrompt(prompt);
    
    console.log(`Validation result: ${validation.valid ? 'PASSED' : 'FAILED'}`);
    if (!validation.valid) {
      console.log('Errors:', validation.errors);
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function exampleLLMIntegration() {
  console.log('\n🤖 Example LLM Integration\n');

  try {
    // Simulate loading a prompt and sending to LLM
    const prompt = await promptLoader.processPrompt(
      'standard/create',
      {
        requirements: 'Create an e-commerce site with products and shopping cart',
        scale: 'business'
      }
    );

    // This is what you would send to an LLM provider
    const llmRequest = {
      messages: [
        { role: 'system', content: prompt.system },
        { role: 'user', content: prompt.user }
      ],
      max_tokens: prompt.context.max_tokens,
      temperature: prompt.context.temperature,
      top_p: prompt.context.top_p
    };

    console.log('LLM Request Structure:');
    console.log(`- Messages: ${llmRequest.messages.length}`);
    console.log(`- Max tokens: ${llmRequest.max_tokens}`);
    console.log(`- Temperature: ${llmRequest.temperature}`);
    console.log(`- Top P: ${llmRequest.top_p}`);

    // Mock LLM response
    const mockResponse = `
components:
  EcommercePlatform:
    version: "1.0.0"
    description: "E-commerce platform"
    
    models:
      Product:
        attributes:
          name: String required searchable
          price: Money required
          inventory: Integer required default=0 min=0
        relationships:
          category: belongsTo Category required
          
      Category:
        attributes:
          name: String required unique
        relationships:
          products: hasMany Product
    `;

    console.log('\nMock LLM Response:');
    console.log(mockResponse);

  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function runExamples() {
  await demonstratePromptUsage();
  await exampleLLMIntegration();
}

// Run examples if this file is executed directly
if (require.main === module) {
  runExamples().catch(console.error);
}

export { demonstratePromptUsage, exampleLLMIntegration };