/**
 * SpecVerse Orchestrator Bridge for MCP Integration
 * 
 * Provides orchestrator capabilities as MCP tools while maintaining
 * compatibility across all deployment environments.
 */

import { EventEmitter } from '../events/EventEmitter.js';

export interface OrchestratorConfig {
  enabled: boolean;
  orchestratorPath?: string;
  workingDirectory?: string;
  autoDetect?: boolean;
  logging?: boolean;
  mode?: string;
}

export interface OrchestratorCapabilities {
  hasFullOrchestrator: boolean;
  availableOperations: string[];
  workingDirectory?: string;
  sessionSupport: boolean;
  inferenceEngine: boolean;
}

export interface OrchestratorExecutionContext {
  operation: 'analyse' | 'create' | 'infer' | 'materialise' | 'realize';
  input?: string;
  inputPath?: string;
  inputType?: 'specification' | 'code' | 'requirements' | 'manifest';
  outputPath?: string;
  framework?: string;
  scale?: 'personal' | 'business' | 'enterprise';
  interactive?: boolean;
  sessionId?: string;
}

export interface OrchestratorExecutionResult {
  success: boolean;
  content: string;
  operation: string;
  provider?: string;
  sessionId?: string;
  executionTime: number;
  metadata?: {
    framework?: string;
    scale?: string;
    inferenceRules?: number;
    processingTime?: number;
    error?: boolean;
  };
  error?: string;
}

export class OrchestratorBridge {
  private config: OrchestratorConfig;
  private eventEmitter: EventEmitter;
  private capabilities: OrchestratorCapabilities;
  private orchestrator: any = null;
  private initialized: boolean = false;

  constructor(config: OrchestratorConfig, eventEmitter: EventEmitter) {
    this.config = config;
    this.eventEmitter = eventEmitter;
    this.capabilities = {
      hasFullOrchestrator: false,
      availableOperations: [],
      sessionSupport: false,
      inferenceEngine: false
    };
  }

  /**
   * Initialize orchestrator bridge with environment detection
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Auto-detect orchestrator availability
      if (this.config.autoDetect !== false) {
        await this.detectOrchestrator();
      }

      if (this.config.enabled && this.capabilities.hasFullOrchestrator) {
        await this.initializeFullOrchestrator();
      } else {
        await this.initializeFallbackMode();
      }

      this.initialized = true;
      this.eventEmitter.emit('orchestrator-initialized', {
        type: 'orchestrator-initialized',
        capabilities: this.capabilities
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (this.config.logging) {
        console.warn(`Orchestrator initialization failed: ${errorMessage}`);
      }
      
      // Fall back to limited mode
      await this.initializeFallbackMode();
      this.initialized = true;
    }
  }

  /**
   * Execute orchestrator operation
   */
  async execute(context: OrchestratorExecutionContext): Promise<OrchestratorExecutionResult> {
    if (!this.initialized) {
      throw new Error('Orchestrator bridge not initialized');
    }

    const startTime = Date.now();

    try {
      let result: OrchestratorExecutionResult;

      if (this.capabilities.hasFullOrchestrator && this.orchestrator) {
        result = await this.executeWithFullOrchestrator(context);
      } else {
        result = await this.executeWithFallback(context);
      }

      const executionTime = Date.now() - startTime;
      result.executionTime = executionTime;

      this.eventEmitter.emit('orchestrator-execution-completed', {
        type: 'orchestrator-execution-completed',
        operation: context.operation,
        executionTime,
        success: result.success
      });

      return result;

    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      this.eventEmitter.emit('orchestrator-execution-failed', {
        type: 'orchestrator-execution-failed',
        operation: context.operation,
        error: errorMessage,
        executionTime
      });

      return {
        success: false,
        content: '',
        operation: context.operation,
        executionTime,
        error: errorMessage
      };
    }
  }

  /**
   * Get orchestrator capabilities
   */
  getCapabilities(): OrchestratorCapabilities {
    return { ...this.capabilities };
  }

  /**
   * Check if orchestrator is available
   */
  isAvailable(): boolean {
    return this.initialized && (this.capabilities.hasFullOrchestrator || true); // Always available in fallback mode
  }

  /**
   * Get supported operations
   */
  getSupportedOperations(): string[] {
    return [...this.capabilities.availableOperations];
  }

  // Private methods

  /**
   * Detect orchestrator availability in current environment
   */
  private async detectOrchestrator(): Promise<void> {
    try {
      // Method 1: Check if we can import the orchestrator from the main project
      const orchestratorPath = this.config.orchestratorPath || '../../../src/orchestrator/index.js';
      
      try {
        const orchestratorModule = await import(orchestratorPath);
        if (orchestratorModule.SpecVerseOrchestrator) {
          this.capabilities.hasFullOrchestrator = true;
          if (this.config.logging && this.config.mode !== 'local') {
            console.log('Full orchestrator detected via import');
          }
          return;
        }
      } catch (importError) {
        // Continue with other detection methods
      }

      // Method 2: Check if orchestrator exists in parent project structure
      const { existsSync } = await import('fs');
      const { resolve, join } = await import('path');

      const possiblePaths = [
        resolve(process.cwd(), '../../../src/orchestrator'),
        resolve(process.cwd(), '../../src/orchestrator'),
        resolve(process.cwd(), '../src/orchestrator'),
        resolve(process.cwd(), 'src/orchestrator'),
        join(process.cwd(), '../../dist/orchestrator')
      ];

      for (const path of possiblePaths) {
        if (existsSync(path)) {
          this.capabilities.hasFullOrchestrator = true;
          this.config.orchestratorPath = path;
          if (this.config.logging && this.config.mode !== 'local') {
            console.log(`Orchestrator detected at: ${path}`);
          }
          return;
        }
      }

      // Method 3: Check for global SpecVerse CLI installation
      try {
        const { execSync } = await import('child_process');
        execSync('specverse --version', { stdio: 'pipe' });
        this.capabilities.hasFullOrchestrator = true;
        if (this.config.logging && this.config.mode !== 'local') {
          console.log('Global SpecVerse CLI detected');
        }
        return;
      } catch (cliError) {
        // CLI not available
      }

      if (this.config.logging && this.config.mode !== 'local') {
        console.log('Full orchestrator not detected, using fallback mode');
      }
      this.capabilities.hasFullOrchestrator = false;

    } catch (error) {
      if (this.config.logging) {
        console.warn(`Orchestrator detection failed: ${error instanceof Error ? error.message : String(error)}`);
      }
      this.capabilities.hasFullOrchestrator = false;
    }
  }

  /**
   * Initialize full orchestrator with all capabilities
   */
  private async initializeFullOrchestrator(): Promise<void> {
    try {
      // Import orchestrator dynamically with multiple path attempts
      let orchestratorModule;
      const possiblePaths = [
        this.config.orchestratorPath, // User-specified path
        '../../dist/orchestrator/index.js', // local package path
        '../../../dist/orchestrator/index.js', // parent repo build
        '../../specverse-lang/dist/orchestrator/index.js', // sibling repo
        '../../../src/orchestrator/index.js', // dev repo path
      ].filter(Boolean);

      for (const path of possiblePaths) {
        if (!path) continue; // Skip undefined paths
        try {
          orchestratorModule = await import(path);
          if (orchestratorModule.SpecVerseOrchestrator) {
            if (this.config.logging) {
              console.log(`Successfully loaded orchestrator from: ${path}`);
            }
            break;
          }
        } catch (error) {
          if (this.config.logging) {
            console.debug(`Failed to load orchestrator from ${path}: ${error instanceof Error ? error.message : String(error)}`);
          }
          continue;
        }
      }

      if (!orchestratorModule) {
        throw new Error('Could not find orchestrator module in any of the expected locations');
      }
      
      if (!orchestratorModule.SpecVerseOrchestrator) {
        throw new Error('SpecVerseOrchestrator not found in module');
      }

      // Create orchestrator instance
      this.orchestrator = new orchestratorModule.SpecVerseOrchestrator();
      
      // Initialize with default or specified config
      await this.orchestrator.initialize();

      // Set capabilities
      this.capabilities = {
        hasFullOrchestrator: true,
        availableOperations: ['analyse', 'create', 'infer', 'materialise', 'realize'],
        workingDirectory: this.config.workingDirectory || process.cwd(),
        sessionSupport: true,
        inferenceEngine: true
      };

      if (this.config.logging) {
        if (this.config.logging && this.config.mode !== 'local') {
          console.log('Full orchestrator initialized successfully');
        }
      }
      if (this.config.logging) {
        if (this.config.logging && this.config.mode !== 'local') {
          console.log(`Available operations: ${this.capabilities.availableOperations.join(', ')}`);
        }
      }

    } catch (error) {
      throw new Error(`Failed to initialize full orchestrator: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Initialize fallback mode with limited capabilities
   */
  private async initializeFallbackMode(): Promise<void> {
    this.capabilities = {
      hasFullOrchestrator: false,
      availableOperations: ['create', 'analyse'], // Basic operations available via prompts
      workingDirectory: this.config.workingDirectory || process.cwd(),
      sessionSupport: false,
      inferenceEngine: false
    };

    if (this.config.logging) {
      if (this.config.logging && this.config.mode !== 'local') {
        console.log('Orchestrator bridge initialized in fallback mode');
      }
    }
    if (this.config.logging) {
      if (this.config.logging && this.config.mode !== 'local') {
        console.log(`Limited operations: ${this.capabilities.availableOperations.join(', ')}`);
      }
    }
  }

  /**
   * Execute operation with full orchestrator
   */
  private async executeWithFullOrchestrator(context: OrchestratorExecutionContext): Promise<OrchestratorExecutionResult> {
    try {
      const orchestrationContext = {
        operation: context.operation,
        input: context.input,
        inputPath: context.inputPath,
        inputType: context.inputType,
        outputPath: context.outputPath,
        framework: context.framework,
        scale: context.scale || 'business',
        interactive: context.interactive || false,
        sessionId: context.sessionId
      };

      if (this.config.logging) {
        if (this.config.logging && this.config.mode !== 'local') {
          console.log(`Executing ${context.operation} with full orchestrator...`);
        }
      }
      
      const result = await this.orchestrator.execute(orchestrationContext);

      return {
        success: true,
        content: result.content,
        operation: context.operation,
        provider: result.provider,
        sessionId: result.sessionId,
        executionTime: 0, // Will be set by caller
        metadata: result.metadata
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (this.config.logging) {
        console.error(`Full orchestrator execution failed: ${errorMessage}`);
      }
      
      return {
        success: false,
        content: '',
        operation: context.operation,
        executionTime: 0,
        error: errorMessage
      };
    }
  }

  /**
   * Execute operation with fallback implementation
   */
  private async executeWithFallback(context: OrchestratorExecutionContext): Promise<OrchestratorExecutionResult> {
    if (this.config.logging) {
      if (this.config.logging && this.config.mode !== 'local') {
        console.log(`Executing ${context.operation} in fallback mode...`);
      }
    }

    switch (context.operation) {
      case 'create':
        return this.executeFallbackCreate(context);
      case 'analyse':
        return this.executeFallbackAnalyse(context);
      case 'infer':
        return this.executeFallbackInfer(context);
      default:
        return {
          success: false,
          content: '',
          operation: context.operation,
          executionTime: 0,
          error: `Operation '${context.operation}' not supported in fallback mode. Full orchestrator required.`
        };
    }
  }

  private async executeFallbackCreate(context: OrchestratorExecutionContext): Promise<OrchestratorExecutionResult> {
    // Fallback create operation - return structured message indicating prompt expansion needed
    const content = `# SpecVerse Creation (Fallback Mode)

**Requirements**: ${context.input || 'No requirements provided'}
**Scale**: ${context.scale || 'business'}
**Framework**: ${context.framework || 'auto-detect'}

## Next Steps

This operation requires the full SpecVerse orchestrator for AI-powered specification creation. 

In fallback mode, you can:
1. Use the \`get_creation_prompt\` MCP tool to get an expanded prompt
2. Use that prompt with your AI assistant to create specifications
3. Use the SpecVerse CLI locally for full orchestrator capabilities

## Fallback Specification Template

\`\`\`yaml
components:
  ${context.framework || 'Application'}Component:
    models:
      # Define your models here based on requirements
      ExampleModel:
        attributes:
          name: String required
          description: String optional
        relationships:
          # Add relationships as needed
\`\`\`

**Note**: For full AI-powered creation, install the complete SpecVerse toolchain locally.`;

    return {
      success: true,
      content,
      operation: context.operation,
      executionTime: 0,
      metadata: {
        scale: context.scale,
        framework: context.framework,
        processingTime: 1
      }
    };
  }

  private async executeFallbackAnalyse(context: OrchestratorExecutionContext): Promise<OrchestratorExecutionResult> {
    // Fallback analyse operation
    const content = `# SpecVerse Analysis (Fallback Mode)

**Target**: ${context.inputPath || context.input || 'No input provided'}
**Framework**: ${context.framework || 'auto-detect'}

## Analysis Summary

This operation requires the full SpecVerse orchestrator for AI-powered codebase analysis.

In fallback mode, you can:
1. Use the \`get_analysis_prompt\` MCP tool to get an expanded analysis prompt
2. Use that prompt with your AI assistant to analyze codebases
3. Install the complete SpecVerse toolchain for full orchestrator capabilities

## Manual Analysis Steps

1. **Identify Models**: Look for data structures, entities, classes
2. **Map Relationships**: Identify how models relate to each other  
3. **Find Controllers**: Locate API endpoints, request handlers
4. **Discover Services**: Find business logic, processing functions
5. **Map Events**: Identify event publishing and handling

**Note**: For full AI-powered analysis, install the complete SpecVerse toolchain locally.`;

    return {
      success: true,
      content,
      operation: context.operation,
      executionTime: 0,
      metadata: {
        framework: context.framework,
        processingTime: 1
      }
    };
  }

  private async executeFallbackInfer(context: OrchestratorExecutionContext): Promise<OrchestratorExecutionResult> {
    return {
      success: false,
      content: '',
      operation: context.operation,
      executionTime: 0,
      error: 'Inference operation requires the full SpecVerse orchestrator with inference engine. Please install the complete SpecVerse toolchain.'
    };
  }
}