# SpecVerse AI Orchestrator Usage

This example demonstrates how to use the AI Orchestrator for complex multi-step AI workflows with library-aware prompt generation and cost management.

## Overview

The AI Orchestrator provides:
- Multi-provider AI integration (OpenAI, Anthropic, Local, Interactive)
- Complex workflow orchestration with approval gates
- Cost estimation and budget management  
- Library-aware prompt enhancement using the AI API
- Session management for interactive workflows

```yaml
version: "1.0.0"

# Example: Healthcare system generated via orchestrator workflow
components:
  HealthcareManagement:
    version: "1.0.0"
    
    # Generated using orchestrator workflow:
    # 1. analyse -> requirements analysis
    # 2. create -> specification generation  
    # 3. materialise -> implementation planning
    # 4. realize -> complete application
    
    imports:
      - from: "@specverse/domains/healthcare"
        select: [Patient, Provider, Appointment]
      - from: "@specverse/deployments/enterprise"
      - from: "@specverse/manifests/oauth"
      
    models:
      MedicalRecord:
        id: UUID required unique
        patientId: UUID required
        providerId: UUID required
        visitDate: Date required
        diagnosis: Text required
        treatment: Text required
        notes: Text optional
        status: String required default="active"
        confidentialityLevel: String required default="standard"
        createdAt: DateTime required default=now
        updatedAt: DateTime required default=now
        
        belongsTo: [Patient.patientId, Provider.providerId]
        
      Prescription:
        id: UUID required unique
        medicalRecordId: UUID required
        medication: String required
        dosage: String required
        frequency: String required
        duration: String required
        instructions: Text optional
        prescribedAt: DateTime required default=now
        
        belongsTo: [MedicalRecord.medicalRecordId]
    
    relationships:
      - Patient hasMany MedicalRecord
      - Provider hasMany MedicalRecord
      - MedicalRecord hasMany Prescription

# Compliance metadata automatically added by orchestrator
metadata:
  compliance:
    - HIPAA
    - SOC2
  security:
    encryption: "AES-256"
    audit_trail: enabled
    access_control: "role-based"
```

## Installation and Setup

```bash
# Install orchestrator package
npm install @specverse/ai-orchestrator

# Or use from tools directory
cd tools/ai-orchestrator
npm install && npm run build
```

## Basic Usage

### Single-Step Execution

```javascript
import { SpecVerseOrchestrator } from '@specverse/ai-orchestrator';

const orchestrator = new SpecVerseOrchestrator();
await orchestrator.initialize();

// Execute single operation with library-aware prompts
const result = await orchestrator.executeSingle('create', {
  requirements: 'healthcare patient management system',
  scale: 'enterprise', 
  compliance: ['HIPAA'],
  technology_preferences: ['postgresql', 'oauth']
});

console.log('Generated specification:', result.content);
console.log('Provider used:', result.provider);
console.log('Tokens consumed:', result.usage?.total_tokens);
```

### Multi-Step Workflow

```javascript
// Define workflow
const workflow = {
  name: 'Healthcare System Development',
  version: '1.0.0',
  description: 'Complete healthcare system from requirements to implementation',
  
  initialInput: 'HIPAA-compliant patient management system with appointments and medical records',
  
  globals: {
    framework: 'react',
    scale: 'enterprise',
    outputDirectory: './healthcare-system',
    provider: 'anthropic'
  },
  
  steps: [
    {
      name: 'Requirements Analysis',
      operation: 'analyse',
      input: '${initialInput}',
      outputPath: '${globals.outputDirectory}/analysis.yaml'
    },
    {
      name: 'Create Specification',
      operation: 'create',
      input: 'Based on analysis, create comprehensive healthcare specification',
      outputPath: '${globals.outputDirectory}/specification.specly'
    },
    {
      name: 'Materialize Implementation',
      operation: 'materialise', 
      inputPath: '${globals.outputDirectory}/specification.specly',
      outputPath: '${globals.outputDirectory}/implementation/'
    },
    {
      name: 'Realize Complete Application',
      operation: 'realize',
      inputPath: '${globals.outputDirectory}/specification.specly',
      outputPath: '${globals.outputDirectory}/complete-app/'
    }
  ]
};

// Execute workflow
const result = await orchestrator.executeWorkflow(workflow);

console.log('Workflow completed!');
console.log(`Total time: ${result.totalTime}ms`);
console.log(`Success rate: ${result.metadata.successfulOperations}/${result.metadata.totalOperations}`);
```

## Cost Estimation

```javascript
// Estimate cost for single operation
const singleCost = await orchestrator.estimateCost('create', {
  requirements: 'e-commerce platform with payments',
  scale: 'business'
}, 'openai');

console.log('Cost Estimate:');
console.log(`Tokens: ${singleCost.estimatedTokens}`);
console.log(`OpenAI GPT-4: $${singleCost.costByProvider['openai-gpt-4']?.toFixed(3)}`);
console.log(`Anthropic Claude: $${singleCost.costByProvider['anthropic-claude']?.toFixed(3)}`);

// Estimate cost for entire workflow
const workflowCost = await orchestrator.estimateCost(workflow, undefined, 'anthropic');

console.log('Workflow Cost Estimate:');
console.log(`Total tokens: ${workflowCost.estimatedTokens}`);
console.log(`Total cost with Anthropic: $${workflowCost.costByProvider['anthropic-claude']?.toFixed(2)}`);
```

## Provider Configuration

### Interactive Provider (No API Key Required)
```javascript
import { ProviderFactory } from '@specverse/ai-orchestrator/providers';

// Interactive provider for web-based AI interfaces
const interactive = ProviderFactory.createProvider({
  type: 'interactive',
  interface: 'chatgpt',          // or 'claude', 'generic'
  outputFile: '/tmp/output.txt',
  waitForInput: true
});
```

### API Providers
```javascript
// OpenAI Provider
const openai = ProviderFactory.createProvider({
  type: 'openai',
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4',
  temperature: 0.7
});

// Anthropic Provider
const anthropic = ProviderFactory.createProvider({
  type: 'anthropic',
  apiKey: process.env.ANTHROPIC_API_KEY,
  model: 'claude-3-sonnet-20240229'
});

// Local Provider (Ollama)
const local = ProviderFactory.createProvider({
  type: 'local',
  model: 'llama2',
  baseURL: 'http://localhost:11434'
});
```

## Configuration File

```yaml
# .specverse.yml
version: "3.2"

providers:
  openai:
    type: openai
    apiKey: ${OPENAI_API_KEY}
    model: gpt-4
    enabled: true
    defaultOptions:
      temperature: 0.7
      max_tokens: 4000

  anthropic:
    type: anthropic
    apiKey: ${ANTHROPIC_API_KEY}  
    model: claude-3-sonnet-20240229
    enabled: true

  interactive:
    type: interactive
    interface: chatgpt
    enabled: true
    default: true
    outputFile: /tmp/specverse-response.txt

defaults:
  provider: interactive
  temperature: 0.7
  max_tokens: 4000
  outputFormat: yaml
  interactive: true
```

## Workflow Definition Files

```yaml
# workflows/ecommerce-development.yaml
name: "E-commerce Platform Development"
version: "1.0.0"
description: "Complete e-commerce platform from concept to deployment"

initialInput: "Multi-vendor e-commerce platform with payment processing and inventory management"

globals:
  outputDirectory: "./ecommerce-platform"
  framework: "nextjs"
  scale: "business"
  interactive: false
  provider: "openai"
  temperature: 0.7

steps:
  - name: "Market Analysis"
    operation: "analyse"
    input: "${initialInput}"
    outputPath: "${globals.outputDirectory}/market-analysis.yaml"
    config:
      focus: "competitive-analysis,user-needs,technical-requirements"

  - name: "Create Core Specification"
    operation: "create" 
    input: "Based on market analysis, create comprehensive e-commerce specification"
    outputPath: "${globals.outputDirectory}/core-spec.specly"
    config:
      scale: "${globals.scale}"
      framework: "${globals.framework}"

  - name: "Generate Implementation Plan"
    operation: "materialise"
    inputPath: "${globals.outputDirectory}/core-spec.specly"
    outputPath: "${globals.outputDirectory}/implementation-plan/"
    config:
      include_deployment: true
      include_testing: true

  - name: "Create Production-Ready Application"
    operation: "realize"
    inputPath: "${globals.outputDirectory}/core-spec.specly"
    outputPath: "${globals.outputDirectory}/production-app/"
    config:
      framework: "${globals.framework}"
      deployment_target: "vercel"
      include_docs: true
```

## Interactive Workflows

```javascript
// Interactive workflow with human approval gates
const interactiveWorkflow = {
  name: 'Guided Healthcare Development',
  interactive: true,
  
  steps: [
    {
      name: 'Initial Analysis',
      operation: 'analyse',
      interactive: true,
      waitForApproval: true  // Pause for human review
    },
    {
      name: 'Specification Creation',
      operation: 'create',
      interactive: true,
      waitForApproval: true
    }
  ]
};

// Execute with human oversight
const result = await orchestrator.executeWorkflow(interactiveWorkflow);
```

## Advanced Features

### Session Management
```javascript
// Resume interrupted workflow
const sessionId = 'healthcare-dev-session-123';
const resumedResult = await orchestrator.resumeSession(sessionId);

// Save workflow state
await orchestrator.saveSession(workflow, sessionId);
```

### Custom Providers
```javascript
class CustomProvider {
  async complete(options) {
    // Your custom AI integration
    return { content: 'Generated specification...', usage: { total_tokens: 1500 } };
  }
  
  async test() {
    return true; // Provider health check
  }
}

// Register custom provider
orchestrator.registerProvider('custom', new CustomProvider());
```

### Error Handling and Retries
```javascript
const robustWorkflow = {
  name: 'Robust Development Workflow',
  onError: 'retry',  // 'stop', 'continue', or 'retry'
  maxRetries: 3,
  
  steps: [
    {
      name: 'Critical Step',
      operation: 'create',
      condition: {
        onFailure: true  // Only run if previous step failed
      }
    }
  ]
};
```

## Library Integration

The orchestrator automatically uses the SpecVerse AI API for library-aware prompt generation:

```javascript
// Orchestrator internally calls:
// const enhanced = await enhancePrompt(operation, requirements);
// 
// This provides:
// - Library recommendations based on requirements
// - Enhanced prompts with library context  
// - Cost estimates across providers
// - Execution options from free to premium

const result = await orchestrator.executeSingle('create', {
  requirements: 'healthcare system',
  compliance: ['HIPAA']
});

// Result includes library-aware specification with:
// - @specverse/domains/healthcare models
// - @specverse/deployments/enterprise patterns  
// - @specverse/manifests/oauth authentication
// - Compliance and security configurations
```

## Benefits

### Multi-Provider Flexibility
- **Development**: Use interactive/local providers for experimentation
- **Production**: Use API providers for consistent, automated workflows  
- **Cost Optimization**: Switch providers based on budget and quality needs

### Library-Aware Workflows
- **Automatic Enhancement**: All operations use library-aware prompts
- **Code Reduction**: 60-90% less custom code through library usage
- **Best Practices**: Built-in compliance and security patterns

### Cost Management
- **Transparent Estimation**: Full cost breakdown before execution
- **Budget Controls**: Set spending limits and get approval gates
- **Provider Optimization**: Choose cheapest/fastest options automatically

### Enterprise Features  
- **Audit Trails**: Complete workflow execution logs
- **Session Management**: Resume interrupted long-running workflows
- **Error Recovery**: Robust retry and fallback mechanisms
- **Configuration Management**: Environment-specific settings