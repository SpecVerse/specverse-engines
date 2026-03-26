/**
 * SpecVerse Orchestrator
 * Central coordinator for AI-powered specification workflows
 */

import { LLMProvider, LLMCompletionOptions } from '../providers/llm-provider.js';
import { ProviderFactory } from '../providers/provider-factory.js';
import { InteractiveWorkflow } from './interactive-workflow.js';
import { InteractiveProvider } from '../providers/interactive-provider.js';
import { OpenAIProvider } from '../providers/openai-provider.js';
import { AnthropicProvider } from '../providers/anthropic-provider.js';
import { readFileSync } from 'fs';
import { ConfigLoader, SpecVerseConfig } from '../config/index.js';
import { join } from 'path';
import { enhancePrompt } from '../commands/enhance.js';

// Type imports
type UserRequirements = any;
type EnhancedPrompt = any;
type CostEstimate = any;
type AIOperation = any;

export interface OrchestrationContext {
  // Input specification or code
  input?: string;
  inputType?: 'specification' | 'code' | 'requirements' | 'manifest';
  inputPath?: string;

  // Target outputs
  outputPath?: string;
  outputFormat?: 'yaml' | 'json' | 'specly';

  // Operation parameters
  operation: 'analyse' | 'create' | 'infer' | 'materialise' | 'realize';
  framework?: string;
  scale?: 'personal' | 'business' | 'enterprise';

  // AI parameters
  temperature?: number;
  maxTokens?: number;
  streaming?: boolean;

  // Interactive mode options
  interactive?: boolean;
  sessionId?: string;
}

export interface WorkflowStep {
  operation: 'analyse' | 'create' | 'infer' | 'materialise' | 'realize';
  name: string;
  description?: string;

  // Input configuration for this step
  inputSource?: 'initial' | 'previous' | 'file';
  inputPath?: string;

  // Output configuration
  outputPath?: string;
  outputFormat?: 'yaml' | 'json' | 'specly';

  // Operation-specific parameters
  framework?: string;
  scale?: 'personal' | 'business' | 'enterprise';

  // AI parameters
  temperature?: number;
  maxTokens?: number;
  interactive?: boolean;

  // Conditions for execution
  condition?: {
    onSuccess?: boolean;
    onFailure?: boolean;
    ifOutputContains?: string;
  };
}

export interface WorkflowDefinition {
  name: string;
  version: string;
  description: string;

  // Initial inputs
  initialInput?: string;
  initialInputPath?: string;
  initialInputType?: 'specification' | 'code' | 'requirements' | 'manifest';

  // Workflow steps
  steps: WorkflowStep[];

  // Global settings
  globals?: {
    framework?: string;
    scale?: 'personal' | 'business' | 'enterprise';
    interactive?: boolean;
    outputDirectory?: string;
  };

  // Error handling
  onError?: 'stop' | 'continue' | 'retry';
  maxRetries?: number;
}

export interface WorkflowExecutionResult {
  workflowName: string;
  startTime: number;
  endTime: number;
  totalTime: number;

  steps: Array<{
    stepName: string;
    operation: string;
    status: 'success' | 'failed' | 'skipped';
    result?: OrchestrationResult;
    error?: string;
    executionTime: number;
  }>;

  finalOutput?: string;
  finalOutputPath?: string;

  metadata: {
    totalOperations: number;
    successfulOperations: number;
    failedOperations: number;
    skippedOperations: number;
  };
}

export interface OrchestrationResult {
  content: string;
  operation: string;
  provider: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  sessionId?: string;
  metadata?: {
    framework?: string;
    scale?: string;
    inferenceRules?: number;
    processingTime?: number;
    error?: boolean;
  };
}

export class SpecVerseOrchestrator {
  private config!: SpecVerseConfig;
  private configLoader: ConfigLoader;
  private providers: Map<string, LLMProvider> = new Map();
  private defaultProvider?: LLMProvider;

  constructor() {
    this.configLoader = new ConfigLoader();
  }

  /**
   * Initialize orchestrator with configuration
   */
  async initialize(configPath?: string): Promise<void> {
    // Load configuration
    this.config = await this.configLoader.loadConfig(configPath);

    // Set up providers
    await this.setupProviders();

    console.log(`SpecVerse Orchestrator initialized`);
    console.log(`Configuration: ${this.configLoader.getConfigPath() || 'default'}`);
    console.log(`Providers: ${Array.from(this.providers.keys()).join(', ')}`);
    console.log(`Default: ${this.getDefaultProviderName()}\n`);
  }

  /**
   * Execute AI-powered workflow operation
   */
  async execute(context: OrchestrationContext): Promise<OrchestrationResult> {
    const startTime = Date.now();

    console.log(`Executing ${context.operation} operation...`);

    // Validate context
    this.validateContext(context);

    // Get appropriate provider
    const provider = this.getProvider(context.interactive);
    const providerName = this.getProviderName(provider);

    // Check for valid API keys when not in interactive mode
    if (!context.interactive) {
      this.validateApiKeyForNonInteractive(provider, providerName);
    }

    // Use AI commands to enhance prompt with library context
    const enhancedPrompt = await this.enhancePromptWithAPI(context);

    // Prepare LLM options
    const llmOptions: LLMCompletionOptions = {
      messages: [
        { role: 'system', content: enhancedPrompt.systemPrompt },
        { role: 'user', content: enhancedPrompt.userPrompt }
      ],
      temperature: context.temperature ?? this.config.defaults?.temperature ?? 0.7,
      max_tokens: context.maxTokens ?? this.config.defaults?.max_tokens ?? 4000,
      stream: context.streaming ?? this.config.features?.streaming ?? false
    };

    // Execute with appropriate workflow
    let response: any;
    let sessionId: string | undefined;

    // Force validation even if provider is interactive but context is not
    if (!context.interactive && provider instanceof InteractiveProvider) {
      throw new Error(`Cannot use interactive provider '${providerName}' in non-interactive mode. Configure an OpenAI or Anthropic provider with valid API keys.`);
    }

    if (context.interactive || provider instanceof InteractiveProvider) {
      const result = await this.executeInteractive(provider as InteractiveProvider, llmOptions, context);
      response = result.response;
      sessionId = result.sessionId;
    } else {
      response = await provider.complete(llmOptions);
    }

    const processingTime = Date.now() - startTime;

    // Process and validate result
    const processedContent = await this.postProcessResult(response.content, context);

    // Save output if specified
    if (context.outputPath) {
      await this.saveOutput(processedContent, context.outputPath, context.outputFormat);
    }

    console.log(`${context.operation} completed in ${processingTime}ms`);

    return {
      content: processedContent,
      operation: context.operation,
      provider: providerName,
      usage: response.usage,
      sessionId,
      metadata: {
        framework: context.framework,
        scale: context.scale,
        processingTime
      }
    };
  }

  /**
   * Analyze existing codebase and extract specifications
   */
  async analyse(
    codePath: string,
    options: Partial<OrchestrationContext> = {}
  ): Promise<OrchestrationResult> {
    return this.execute({
      operation: 'analyse',
      inputPath: codePath,
      inputType: 'code',
      ...options
    });
  }

  /**
   * Create specifications from natural language requirements
   */
  async create(
    requirements: string,
    options: Partial<OrchestrationContext> = {}
  ): Promise<OrchestrationResult> {
    return this.execute({
      operation: 'create',
      input: requirements,
      inputType: 'requirements',
      scale: options.scale || 'business',
      ...options
    });
  }

  /**
   * Infer expanded specifications using AI rules
   */
  async infer(
    specificationPath: string,
    options: Partial<OrchestrationContext> = {}
  ): Promise<OrchestrationResult> {
    return this.execute({
      operation: 'infer',
      inputPath: specificationPath,
      inputType: 'specification',
      ...options
    });
  }

  /**
   * Materialize clean implementations from specifications
   */
  async materialise(
    specificationPath: string,
    framework: string,
    options: Partial<OrchestrationContext> = {}
  ): Promise<OrchestrationResult> {
    return this.execute({
      operation: 'materialise',
      inputPath: specificationPath,
      inputType: 'specification',
      framework,
      ...options
    });
  }

  /**
   * Realize complete applications from specifications
   */
  async realize(
    specificationPath: string,
    framework: string,
    options: Partial<OrchestrationContext> = {}
  ): Promise<OrchestrationResult> {
    return this.execute({
      operation: 'realize',
      inputPath: specificationPath,
      inputType: 'specification',
      framework,
      ...options
    });
  }

  /**
   * Get available providers
   */
  getAvailableProviders(): Array<{ name: string; type: string; enabled: boolean }> {
    const enabledProviders = this.configLoader.getEnabledProviders();
    return enabledProviders.map(({ name, config }) => ({
      name,
      type: config.type,
      enabled: true
    }));
  }

  /**
   * Switch to different provider
   */
  async switchProvider(providerName: string): Promise<void> {
    const providerConfig = this.configLoader.getProviderConfig(providerName);
    if (!providerConfig) {
      throw new Error(`Provider '${providerName}' not found or disabled`);
    }

    const provider = ProviderFactory.createProvider(providerConfig as any);
    this.defaultProvider = provider;

    console.log(`Switched to ${providerName} provider`);
  }

  /**
   * Execute a workflow with multiple steps
   */
  async executeWorkflow(workflow: WorkflowDefinition): Promise<WorkflowExecutionResult> {
    const startTime = Date.now();

    console.log(`Starting workflow: ${workflow.name}`);
    console.log(`Description: ${workflow.description}`);
    console.log(`Steps: ${workflow.steps.length}`);

    const result: WorkflowExecutionResult = {
      workflowName: workflow.name,
      startTime,
      endTime: 0,
      totalTime: 0,
      steps: [],
      metadata: {
        totalOperations: workflow.steps.length,
        successfulOperations: 0,
        failedOperations: 0,
        skippedOperations: 0
      }
    };

    let currentInput = workflow.initialInput;
    let currentInputPath = workflow.initialInputPath;
    let currentInputType = workflow.initialInputType;

    for (let i = 0; i < workflow.steps.length; i++) {
      const step = workflow.steps[i];
      const stepStartTime = Date.now();

      console.log(`\nStep ${i + 1}/${workflow.steps.length}: ${step.name}`);
      console.log(`   Operation: ${step.operation}`);

      try {
        // Check conditions
        if (step.condition) {
          const shouldSkip = this.shouldSkipStep(step, result.steps);
          if (shouldSkip) {
            console.log(`Skipping step: ${step.name} (condition not met)`);
            result.steps.push({
              stepName: step.name,
              operation: step.operation,
              status: 'skipped',
              executionTime: Date.now() - stepStartTime
            });
            result.metadata.skippedOperations++;
            continue;
          }
        }

        // Prepare execution context
        const context: OrchestrationContext = {
          operation: step.operation as any,
          framework: step.framework || workflow.globals?.framework,
          scale: step.scale || workflow.globals?.scale || 'business',
          temperature: step.temperature,
          maxTokens: step.maxTokens,
          interactive: step.interactive ?? workflow.globals?.interactive ?? false,
          outputPath: this.resolveOutputPath(step, workflow, i),
          outputFormat: step.outputFormat || 'yaml'
        };

        // Set input based on step configuration
        if (step.inputSource === 'file' && step.inputPath) {
          context.inputPath = step.inputPath;
          context.inputType = this.detectInputType(step.inputPath);
        } else if (step.inputSource === 'initial') {
          context.input = workflow.initialInput;
          context.inputPath = workflow.initialInputPath;
          context.inputType = workflow.initialInputType;
        } else {
          // Use previous step output
          context.input = currentInput;
          context.inputPath = currentInputPath;
          context.inputType = currentInputType;
        }

        // Execute the operation
        const stepResult = await this.execute(context);

        // Update current data for next step
        currentInput = stepResult.content;
        currentInputPath = context.outputPath;
        currentInputType = 'specification';

        const executionTime = Date.now() - stepStartTime;

        result.steps.push({
          stepName: step.name,
          operation: step.operation,
          status: 'success',
          result: stepResult,
          executionTime
        });

        result.metadata.successfulOperations++;
        console.log(`Step completed in ${executionTime}ms`);

      } catch (error) {
        const executionTime = Date.now() - stepStartTime;
        const errorMessage = error instanceof Error ? error.message : String(error);

        console.log(`Step failed: ${errorMessage}`);

        result.steps.push({
          stepName: step.name,
          operation: step.operation,
          status: 'failed',
          error: errorMessage,
          executionTime
        });

        result.metadata.failedOperations++;

        // Handle errors based on workflow configuration
        if (workflow.onError === 'stop') {
          console.log('Stopping workflow due to error');
          break;
        } else if (workflow.onError === 'retry' && (workflow.maxRetries || 1) > 1) {
          console.log('Retrying step...');
          // TODO: Implement retry logic
        }
        // Continue to next step if onError === 'continue'
      }
    }

    result.endTime = Date.now();
    result.totalTime = result.endTime - result.startTime;
    result.finalOutput = currentInput;
    result.finalOutputPath = currentInputPath;

    console.log(`\nWorkflow completed: ${workflow.name}`);
    console.log(`Total time: ${result.totalTime}ms`);
    console.log(`Success: ${result.metadata.successfulOperations}/${result.metadata.totalOperations}`);

    return result;
  }

  /**
   * Load workflow definition from file
   */
  async loadWorkflow(workflowPath: string): Promise<WorkflowDefinition> {
    try {
      const content = readFileSync(workflowPath, 'utf8');

      if (workflowPath.endsWith('.json')) {
        return JSON.parse(content);
      } else if (workflowPath.endsWith('.yaml') || workflowPath.endsWith('.yml')) {
        const yaml = await import('js-yaml');
        return yaml.load(content) as WorkflowDefinition;
      } else {
        throw new Error(`Unsupported workflow file format: ${workflowPath}`);
      }
    } catch (error) {
      throw new Error(`Failed to load workflow: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get orchestrator status
   */
  getStatus() {
    return {
      initialized: !!this.config,
      configPath: this.configLoader.getConfigPath(),
      defaultProvider: this.getDefaultProviderName(),
      availableProviders: this.getAvailableProviders(),
      features: this.config?.features,
      promptsLoaded: 4
    };
  }

  /**
   * Extract YAML blocks from AI response content
   */
  private extractYamlBlocks(content: string): string[] {
    const yamlBlocks: string[] = [];

    // Look for YAML code blocks (```yaml or ```yml)
    const codeBlockRegex = /```(?:yaml|yml)\n([\s\S]*?)\n```/g;
    let match;
    while ((match = codeBlockRegex.exec(content)) !== null) {
      yamlBlocks.push(match[1].trim());
    }

    // Look for YAML document separators (---)
    const yamlDocRegex = /---\n([\s\S]*?)(?=\n---|$)/g;
    while ((match = yamlDocRegex.exec(content)) !== null) {
      const yamlContent = match[1].trim();
      if (yamlContent && !yamlBlocks.includes(yamlContent)) {
        yamlBlocks.push(yamlContent);
      }
    }

    // If no specific blocks found, check if the entire content looks like YAML
    if (yamlBlocks.length === 0) {
      const trimmedContent = content.trim();
      if (trimmedContent.includes(':') &&
          (trimmedContent.startsWith('components:') ||
           trimmedContent.startsWith('deployments:') ||
           trimmedContent.includes('\ncomponents:') ||
           trimmedContent.includes('\ndeployments:'))) {
        yamlBlocks.push(trimmedContent);
      }
    }

    return yamlBlocks;
  }

  // Private methods

  private shouldSkipStep(step: WorkflowStep, previousSteps: any[]): boolean {
    if (!step.condition) return false;

    const lastStep = previousSteps[previousSteps.length - 1];
    if (!lastStep) return false;

    if (step.condition.onSuccess !== undefined) {
      const lastSucceeded = lastStep.status === 'success';
      if (step.condition.onSuccess !== lastSucceeded) {
        return true;
      }
    }

    if (step.condition.onFailure !== undefined) {
      const lastFailed = lastStep.status === 'failed';
      if (step.condition.onFailure !== lastFailed) {
        return true;
      }
    }

    if (step.condition.ifOutputContains && lastStep.result) {
      const containsText = lastStep.result.content.includes(step.condition.ifOutputContains);
      if (!containsText) {
        return true;
      }
    }

    return false;
  }

  private resolveOutputPath(step: WorkflowStep, workflow: WorkflowDefinition, stepIndex: number): string | undefined {
    if (step.outputPath) {
      // Handle relative paths from workflow output directory
      if (workflow.globals?.outputDirectory && !step.outputPath.startsWith('/')) {
        return join(workflow.globals.outputDirectory, step.outputPath);
      }
      return step.outputPath;
    }

    // Generate default output path
    if (workflow.globals?.outputDirectory) {
      const stepName = step.name.toLowerCase().replace(/\s+/g, '-');
      const extension = step.outputFormat === 'json' ? 'json' :
                      step.outputFormat === 'yaml' ? 'yaml' : 'specly';
      return join(workflow.globals.outputDirectory, `${stepIndex + 1}-${stepName}.${extension}`);
    }

    return undefined;
  }

  private detectInputType(inputPath: string): 'specification' | 'code' | 'requirements' | 'manifest' {
    const ext = inputPath.split('.').pop()?.toLowerCase();

    switch (ext) {
      case 'specly':
      case 'yaml':
      case 'yml':
        return 'specification';
      case 'js':
      case 'ts':
      case 'py':
      case 'java':
      case 'cs':
      case 'cpp':
      case 'c':
        return 'code';
      case 'txt':
      case 'md':
        return 'requirements';
      case 'json':
        return 'manifest';
      default:
        return 'code';
    }
  }

  private async setupProviders(): Promise<void> {
    const enabledProviders = this.configLoader.getEnabledProviders();

    for (const { name, config } of enabledProviders) {
      try {
        const provider = ProviderFactory.createProvider(config as any);
        this.providers.set(name, provider);

        // Set default provider
        if (!this.defaultProvider || (config as any).default) {
          this.defaultProvider = provider;
        }
      } catch (error) {
        console.warn(`Failed to create provider '${name}': ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    if (!this.defaultProvider) {
      throw new Error('No valid providers available. Check your configuration.');
    }
  }

  private getProvider(forceInteractive?: boolean): LLMProvider {
    if (forceInteractive) {
      // Find interactive provider
      for (const [_name, provider] of this.providers) {
        if (provider instanceof InteractiveProvider) {
          return provider;
        }
      }
      throw new Error('No interactive provider available. Configure an interactive provider in .specverse.yml');
    }

    return this.defaultProvider!;
  }

  private getProviderName(provider: LLMProvider): string {
    for (const [name, p] of this.providers) {
      if (p === provider) return name;
    }
    return provider.getInfo().name;
  }

  private getDefaultProviderName(): string {
    return this.getProviderName(this.defaultProvider!);
  }

  private validateApiKeyForNonInteractive(provider: LLMProvider, providerName: string): void {
    // If we're trying to use an interactive provider in non-interactive mode, fail immediately
    if (provider instanceof InteractiveProvider) {
      throw new Error(`Cannot use interactive provider '${providerName}' in non-interactive mode. Configure an OpenAI or Anthropic provider with valid API keys.`);
    }

    // For OpenAI and Anthropic providers, check if they have valid API keys
    if (provider instanceof OpenAIProvider) {
      const config = (provider as any).config;
      if (!config.apiKey || config.apiKey === 'test-key' || config.apiKey.startsWith('test-')) {
        throw new Error(`OpenAI API key not configured or invalid. Set OPENAI_API_KEY environment variable for non-interactive operations.`);
      }
    }

    if (provider instanceof AnthropicProvider) {
      const config = (provider as any).config;
      if (!config.apiKey || config.apiKey === 'test-key' || config.apiKey.startsWith('test-')) {
        throw new Error(`Anthropic API key not configured or invalid. Set ANTHROPIC_API_KEY environment variable for non-interactive operations.`);
      }
    }
  }

  private validateContext(context: OrchestrationContext): void {
    if (!context.operation) {
      throw new Error('Operation is required');
    }

    const validOperations = ['analyse', 'create', 'infer', 'materialise', 'realize'];
    if (!validOperations.includes(context.operation)) {
      throw new Error(`Invalid operation: ${context.operation}`);
    }

    if (['analyse', 'infer', 'materialise', 'realize'].includes(context.operation) && !context.inputPath && !context.input) {
      throw new Error(`Operation '${context.operation}' requires input path or content`);
    }

    if (['materialise', 'realize'].includes(context.operation) && !context.framework) {
      throw new Error(`Operation '${context.operation}' requires framework specification`);
    }
  }

  /**
   * Enhance prompt using AI commands API
   */
  private async enhancePromptWithAPI(context: OrchestrationContext): Promise<EnhancedPrompt> {
    const requirements: UserRequirements = {
      requirements: context.input || 'Specification generation request',
      scale: context.scale || 'business',
      framework: context.framework
    };

    return await enhancePrompt(context.operation, requirements);
  }

  private buildUserPrompt(context: OrchestrationContext): string {
    let prompt = `Please perform a ${context.operation} operation.`;

    if (context.input) {
      prompt += `\n\nInput content:\n${context.input}`;
    } else if (context.inputPath) {
      prompt += `\n\nInput file: ${context.inputPath}`;
    }

    if (context.framework) {
      prompt += `\n\nTarget framework: ${context.framework}`;
    }

    if (context.scale) {
      prompt += `\n\nProject scale: ${context.scale}`;
    }

    return prompt;
  }

  private async executeInteractive(
    provider: InteractiveProvider,
    options: LLMCompletionOptions,
    context: OrchestrationContext
  ): Promise<{ response: any; sessionId: string }> {

    if (context.sessionId) {
      // Resume existing session
      const workflow = new InteractiveWorkflow(provider);
      const response = await workflow.resumeSession(context.sessionId);
      return { response, sessionId: context.sessionId };
    } else {
      // Create new interactive session
      const workflow = new InteractiveWorkflow(provider, {
        sessionFile: `.specverse/sessions/${context.operation}-session.json`,
        responseFile: `.specverse/responses/${context.operation}-response.txt`,
        autoWatch: (this.config as any).interactive?.workflow?.autoWatch ?? true,
        timeout: (this.config as any).interactive?.workflow?.timeout ?? 300000
      });

      const response = await workflow.executeWithCollection(options);
      const sessions = provider.getSessions();
      const sessionId = sessions[sessions.length - 1]?.id;

      return { response, sessionId };
    }
  }

  private async postProcessResult(content: string, context: OrchestrationContext): Promise<string> {
    // Apply post-processing based on operation type
    switch (context.operation) {
      case 'analyse':
        return this.postProcessAnalysis(content);
      case 'create':
        return this.postProcessCreation(content);
      case 'infer':
        return this.postProcessInference(content, context);
      case 'materialise':
        return this.postProcessMaterialization(content);
      case 'realize':
        return this.postProcessRealization(content);
      default:
        return content;
    }
  }

  private postProcessAnalysis(content: string): string {
    // Extract SpecVerse specification from analysis
    console.log('Post-processing analysis output...');

    const yamlBlocks = this.extractYamlBlocks(content);

    for (const yamlBlock of yamlBlocks) {
      // Return first valid-looking YAML block
      if (yamlBlock.length > 10) {
        console.log('Specification extracted from analysis');
        return yamlBlock;
      }
    }

    console.log('No valid specifications found in analysis output');
    return content + '\n\n# Note: No valid SpecVerse specifications extracted from analysis';
  }

  private postProcessCreation(content: string): string {
    console.log('Post-processing creation output...');

    const yamlBlocks = this.extractYamlBlocks(content);
    for (const yamlBlock of yamlBlocks) {
      if (yamlBlock.length > 10) {
        console.log('Specification extracted from creation response');
        return yamlBlock;
      }
    }

    return content;
  }

  private postProcessInference(content: string, context: OrchestrationContext): string {
    console.log('Post-processing inference output...');

    try {
      // Inference operation already returns structured JSON, validate it
      JSON.parse(content);
      return content;
    } catch {
      console.log('Inference content is not JSON, treating as text');
      return content;
    }
  }

  private postProcessMaterialization(content: string): string {
    console.log('Post-processing materialization output...');
    return content;
  }

  private postProcessRealization(content: string): string {
    console.log('Post-processing realization output...');
    return content;
  }

  private async saveOutput(content: string, outputPath: string, _format?: string): Promise<void> {
    const fs = await import('fs');
    const path = await import('path');

    // Ensure directory exists
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Save content
    fs.writeFileSync(outputPath, content, 'utf8');
    console.log(`Output saved to: ${outputPath}`);
  }

  /**
   * Execute single-step operation using AI commands
   */
  async executeSingle(
    operation: AIOperation,
    requirements: UserRequirements,
    providerName?: string
  ): Promise<OrchestrationResult> {
    const startTime = Date.now();

    console.log(`Executing single-step ${operation} operation...`);

    // Step 1: Use AI commands to enhance the prompt
    const enhanced = await enhancePrompt(operation, requirements);

    console.log(`Enhanced prompt ready:`);
    console.log(`   Token estimate: ${enhanced.estimatedTokens}`);
    console.log(`   Library suggestions: ${enhanced.libraryContext.total}`);

    // Step 2: Select provider
    const provider = providerName ?
      this.providers.get(providerName) :
      this.defaultProvider;

    if (!provider) {
      throw new Error(`Provider '${providerName || 'default'}' not found`);
    }

    // Step 3: Execute with the provider
    const llmOptions: LLMCompletionOptions = {
      messages: [
        { role: 'system', content: enhanced.systemPrompt },
        { role: 'user', content: enhanced.userPrompt }
      ],
      temperature: this.config.defaults?.temperature ?? 0.7,
      max_tokens: this.config.defaults?.max_tokens ?? 4000,
      stream: false
    };

    const response = await provider.complete(llmOptions);
    const processingTime = Date.now() - startTime;

    return {
      content: response.content,
      operation,
      provider: providerName || this.getDefaultProviderName(),
      usage: response.usage,
      metadata: {
        framework: requirements.framework,
        scale: requirements.scale,
        processingTime,
        error: false
      }
    };
  }

  /**
   * Estimate cost for single or multi-step operations
   */
  async estimateCost(
    operation: AIOperation | WorkflowDefinition,
    requirements?: UserRequirements,
    providerName?: string
  ): Promise<CostEstimate> {
    // If it's a workflow, aggregate costs
    if (typeof operation === 'object' && 'steps' in operation) {
      return this.estimateWorkflowCost(operation, providerName);
    }

    // Single operation cost estimation
    if (!requirements) {
      throw new Error('Requirements needed for single operation cost estimation');
    }

    const enhanced = await enhancePrompt(operation as AIOperation, requirements);

    // Get provider-specific costs
    const costByProvider: Record<string, number> = {};
    enhanced.executionOptions.forEach((option: any) => {
      const key = `${option.provider}${option.model ? `-${option.model}` : ''}`;
      costByProvider[key] = option.estimatedCost || 0;
    });

    return {
      estimatedTokens: enhanced.estimatedTokens,
      costByProvider,
      cheapestOption: 'local',
      fastestOption: 'openai-gpt-3.5-turbo'
    };
  }

  /**
   * Estimate cost for workflow execution
   */
  private async estimateWorkflowCost(
    workflow: WorkflowDefinition,
    providerName?: string
  ): Promise<CostEstimate> {
    let totalTokens = 0;
    const stepCosts: number[] = [];

    // Estimate each step
    for (const step of workflow.steps) {
      const requirements: UserRequirements = {
        requirements: workflow.initialInput || '',
        scale: step.scale || workflow.globals?.scale || 'business',
        framework: step.framework || workflow.globals?.framework
      };

      const stepCost = await this.estimateCost(step.operation, requirements, providerName);
      totalTokens += stepCost.estimatedTokens;

      const providerKey = providerName || stepCost.cheapestOption;
      stepCosts.push(stepCost.costByProvider[providerKey] || 0);
    }

    // Calculate total costs by provider
    const costByProvider: Record<string, number> = {
      'openai-gpt-4': (totalTokens / 1000) * 0.03,
      'openai-gpt-3.5-turbo': (totalTokens / 1000) * 0.002,
      'anthropic-claude': (totalTokens / 1000) * 0.015,
      'local': 0,
      'interactive': 0
    };

    return {
      estimatedTokens: totalTokens,
      costByProvider,
      cheapestOption: 'local',
      fastestOption: 'openai-gpt-3.5-turbo'
    };
  }

  /**
   * Execute workflow with library-aware prompts
   */
  async executeEnhancedWorkflow(
    workflow: WorkflowDefinition
  ): Promise<WorkflowExecutionResult> {
    console.log(`Executing enhanced workflow: ${workflow.name}`);
    console.log(`   Using library-aware AI commands for each step`);

    return this.executeWorkflow(workflow);
  }
}

// Export singleton instance
export const specverseOrchestrator = new SpecVerseOrchestrator();
