/**
 * Basic SpecVerse AI API Usage
 * Demonstrates the four hierarchical actions
 */

import { 
  getTemplate, 
  fillTemplate, 
  suggestLibraries, 
  enhancePrompt,
  type UserRequirements 
} from '../index.js';

async function demonstrateBasicUsage() {
  console.log('🚀 SpecVerse AI API - Basic Usage Examples\n');

  const requirements: UserRequirements = {
    requirements: 'blog platform with user accounts and content management',
    scale: 'business',
    framework: 'react',
    technology_preferences: ['postgresql', 'oauth']
  };

  // Action 1: Get Raw Template
  console.log('📄 Action 1: Raw Template');
  console.log('='.repeat(40));
  const template = await getTemplate('create');
  console.log(`Name: ${template.name}`);
  console.log(`Variables: ${template.variables?.join(', ') || 'none'}`);
  console.log('✅ Template retrieved\n');

  // Action 2: Fill Template  
  console.log('📝 Action 2: Parameter-Filled Template');
  console.log('='.repeat(40));
  const filled = await fillTemplate('create', requirements);
  console.log(`System prompt length: ${filled.systemPrompt.length} chars`);
  console.log(`User prompt length: ${filled.userPrompt.length} chars`);
  console.log('✅ Template filled with parameters\n');

  // Action 3: Library Suggestions
  console.log('🚀 Action 3: Library Suggestions');
  console.log('='.repeat(40));
  const libraries = await suggestLibraries(requirements);
  console.log(`Found ${libraries.total} relevant libraries:`);
  libraries.suggestions.slice(0, 3).forEach(lib => {
    const expansion = lib.expansion_factor ? ` (${lib.expansion_factor}x expansion)` : '';
    console.log(`  📦 ${lib.name}${expansion}: ${lib.rationale}`);
  });
  console.log('✅ Library suggestions generated\n');

  // Action 4: Enhanced Prompt (MOST VALUABLE)
  console.log('🌟 Action 4: Enhanced Prompt (MOST VALUABLE)');
  console.log('='.repeat(40));
  const enhanced = await enhancePrompt('create', requirements);
  
  console.log(`📊 Token Estimate: ${enhanced.estimatedTokens} tokens`);
  console.log(`📚 Library Context: ${enhanced.libraryContext.total} suggestions`);
  console.log('\n💰 Execution Options:');
  enhanced.executionOptions.forEach((option, index) => {
    const cost = option.estimatedCost ? ` ($${option.estimatedCost.toFixed(3)})` : ' (Free)';
    console.log(`  ${index + 1}. ${option.description}${cost}`);
  });
  
  console.log('\n✅ Enhanced prompt ready for execution');
  console.log('\n🎯 Key Benefit: Maximum value at ZERO COST');
  console.log('   Users can copy the enhanced prompt to any AI interface for free execution');
}

async function demonstrateWorkflowIntegration() {
  console.log('\n\n🔄 Workflow Integration Example');
  console.log('='.repeat(50));

  const operations = ['analyse', 'create', 'materialise'] as const;
  const requirements: UserRequirements = {
    requirements: 'healthcare patient management system',
    scale: 'enterprise',
    compliance: ['HIPAA'],
    technology_preferences: ['postgresql', 'oauth', 'audit-logging']
  };

  for (const operation of operations) {
    console.log(`\n📋 Step: ${operation}`);
    const enhanced = await enhancePrompt(operation, requirements);
    console.log(`   Tokens: ${enhanced.estimatedTokens}`);
    console.log(`   Libraries: ${enhanced.libraryContext.total}`);
    console.log(`   Cheapest execution: Free (copy-paste)`);
  }

  console.log('\n✅ Complete workflow planned with cost transparency');
}

// Run examples
async function runExamples() {
  try {
    await demonstrateBasicUsage();
    await demonstrateWorkflowIntegration();
    
    console.log('\n🎉 All examples completed successfully!');
    console.log('\nNext steps:');
    console.log('• Copy any enhanced prompt to ChatGPT/Claude for free execution');
    console.log('• Build custom orchestrator using these APIs');
    console.log('• Integrate with your preferred AI providers');
    
  } catch (error) {
    console.error('❌ Example failed:', error);
    process.exit(1);
  }
}

// Export for use as module
export { 
  demonstrateBasicUsage,
  demonstrateWorkflowIntegration,
  runExamples
};

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runExamples();
}