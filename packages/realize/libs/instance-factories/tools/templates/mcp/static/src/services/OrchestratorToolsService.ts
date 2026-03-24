/**
 * Orchestrator Tools Service for MCP Integration
 * 
 * Provides orchestrator workflow capabilities as MCP tools
 */

import { OrchestratorBridge, OrchestratorExecutionContext } from './OrchestratorBridge.js';
import { EventEmitter } from '../events/EventEmitter.js';

export interface OrchestratorToolsConfig {
  orchestratorBridge: OrchestratorBridge;
  eventEmitter: EventEmitter;
}

export interface AnalyseCodebaseParams {
  codePath: string;
  framework?: string;
  outputPath?: string;
  interactive?: boolean;
}

export interface CreateSpecificationParams {
  requirements: string;
  scale?: 'personal' | 'business' | 'enterprise';
  framework?: string;
  outputPath?: string;
  interactive?: boolean;
}

export interface InferSpecificationParams {
  specificationPath: string;
  outputPath?: string;
  framework?: string;
}

export interface MaterialiseImplementationParams {
  specificationPath: string;
  framework: string;
  outputPath?: string;
  scale?: 'personal' | 'business' | 'enterprise';
  interactive?: boolean;
}

export interface RealizeApplicationParams {
  specificationPath: string;
  framework: string;
  outputPath?: string;
  scale?: 'personal' | 'business' | 'enterprise';
  interactive?: boolean;
}

export interface WorkflowStatusParams {
  sessionId?: string;
}

export class OrchestratorToolsService {
  private orchestratorBridge: OrchestratorBridge;
  private eventEmitter: EventEmitter;

  constructor(config: OrchestratorToolsConfig) {
    this.orchestratorBridge = config.orchestratorBridge;
    this.eventEmitter = config.eventEmitter;
  }

  /**
   * Analyze existing codebase and extract SpecVerse specifications
   */
  async analyseCodebase(params: AnalyseCodebaseParams): Promise<string> {
    this.eventEmitter.emit('tool-called', {
      toolName: 'analyse_codebase',
      arguments: params,
      executionTime: 0
    });

    try {
      const context: OrchestratorExecutionContext = {
        operation: 'analyse',
        inputPath: params.codePath,
        inputType: 'code',
        outputPath: params.outputPath,
        framework: params.framework,
        interactive: params.interactive || false
      };

      const result = await this.orchestratorBridge.execute(context);

      if (result.success) {
        const response = {
          operation: 'analyse',
          success: true,
          result: result.content,
          metadata: {
            codePath: params.codePath,
            framework: params.framework || 'auto-detected',
            outputPath: params.outputPath,
            executionTime: result.executionTime,
            provider: result.provider,
            sessionId: result.sessionId
          }
        };

        if (result.sessionId) {
          response.metadata.sessionId = result.sessionId;
        }

        return JSON.stringify(response, null, 2);
      } else {
        const errorResponse = {
          operation: 'analyse',
          success: false,
          error: result.error,
          metadata: {
            codePath: params.codePath,
            executionTime: result.executionTime
          }
        };

        return JSON.stringify(errorResponse, null, 2);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      this.eventEmitter.emit('error-occurred', {
        operation: 'analyse_codebase',
        error: errorMessage,
        context: params
      });

      const errorResponse = {
        operation: 'analyse',
        success: false,
        error: errorMessage,
        metadata: {
          codePath: params.codePath
        }
      };

      return JSON.stringify(errorResponse, null, 2);
    }
  }

  /**
   * Create SpecVerse specifications from natural language requirements
   */
  async createSpecification(params: CreateSpecificationParams): Promise<string> {
    this.eventEmitter.emit('tool-called', {
      toolName: 'create_specification',
      arguments: params,
      executionTime: 0
    });

    try {
      const context: OrchestratorExecutionContext = {
        operation: 'create',
        input: params.requirements,
        inputType: 'requirements',
        outputPath: params.outputPath,
        framework: params.framework,
        scale: params.scale || 'business',
        interactive: params.interactive || false
      };

      const result = await this.orchestratorBridge.execute(context);

      if (result.success) {
        const response = {
          operation: 'create',
          success: true,
          result: result.content,
          metadata: {
            requirements: params.requirements,
            scale: params.scale || 'business',
            framework: params.framework,
            outputPath: params.outputPath,
            executionTime: result.executionTime,
            provider: result.provider,
            sessionId: result.sessionId
          }
        };

        return JSON.stringify(response, null, 2);
      } else {
        const errorResponse = {
          operation: 'create',
          success: false,
          error: result.error,
          metadata: {
            requirements: params.requirements,
            executionTime: result.executionTime
          }
        };

        return JSON.stringify(errorResponse, null, 2);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      this.eventEmitter.emit('error-occurred', {
        operation: 'create_specification',
        error: errorMessage,
        context: params
      });

      const errorResponse = {
        operation: 'create',
        success: false,
        error: errorMessage,
        metadata: {
          requirements: params.requirements
        }
      };

      return JSON.stringify(errorResponse, null, 2);
    }
  }

  /**
   * Infer expanded specifications using AI inference engine
   */
  async inferSpecification(params: InferSpecificationParams): Promise<string> {
    this.eventEmitter.emit('tool-called', {
      toolName: 'infer_specification',
      arguments: params,
      executionTime: 0
    });

    try {
      // Check if inference is available
      const capabilities = this.orchestratorBridge.getCapabilities();
      if (!capabilities.inferenceEngine) {
        const fallbackResponse = {
          operation: 'infer',
          success: false,
          error: 'Inference operation requires full SpecVerse orchestrator with inference engine',
          suggestion: 'Use get_creation_prompt or get_analysis_prompt tools for AI-assisted specification development',
          metadata: {
            specificationPath: params.specificationPath,
            availableCapabilities: capabilities
          }
        };

        return JSON.stringify(fallbackResponse, null, 2);
      }

      const context: OrchestratorExecutionContext = {
        operation: 'infer',
        inputPath: params.specificationPath,
        inputType: 'specification',
        outputPath: params.outputPath,
        framework: params.framework
      };

      const result = await this.orchestratorBridge.execute(context);

      if (result.success) {
        const response = {
          operation: 'infer',
          success: true,
          result: result.content,
          metadata: {
            specificationPath: params.specificationPath,
            outputPath: params.outputPath,
            framework: params.framework,
            executionTime: result.executionTime,
            inferenceRules: result.metadata?.inferenceRules,
            provider: result.provider
          }
        };

        return JSON.stringify(response, null, 2);
      } else {
        const errorResponse = {
          operation: 'infer',
          success: false,
          error: result.error,
          metadata: {
            specificationPath: params.specificationPath,
            executionTime: result.executionTime
          }
        };

        return JSON.stringify(errorResponse, null, 2);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      this.eventEmitter.emit('error-occurred', {
        operation: 'infer_specification',
        error: errorMessage,
        context: params
      });

      const errorResponse = {
        operation: 'infer',
        success: false,
        error: errorMessage,
        metadata: {
          specificationPath: params.specificationPath
        }
      };

      return JSON.stringify(errorResponse, null, 2);
    }
  }

  /**
   * Materialize clean implementation from specifications
   */
  async materialiseImplementation(params: MaterialiseImplementationParams): Promise<string> {
    this.eventEmitter.emit('tool-called', {
      toolName: 'materialise_implementation',
      arguments: params,
      executionTime: 0
    });

    try {
      const context: OrchestratorExecutionContext = {
        operation: 'materialise',
        inputPath: params.specificationPath,
        inputType: 'specification',
        outputPath: params.outputPath,
        framework: params.framework,
        scale: params.scale || 'business',
        interactive: params.interactive || false
      };

      const result = await this.orchestratorBridge.execute(context);

      if (result.success) {
        const response = {
          operation: 'materialise',
          success: true,
          result: result.content,
          metadata: {
            specificationPath: params.specificationPath,
            framework: params.framework,
            scale: params.scale || 'business',
            outputPath: params.outputPath,
            executionTime: result.executionTime,
            provider: result.provider,
            sessionId: result.sessionId
          }
        };

        return JSON.stringify(response, null, 2);
      } else {
        const errorResponse = {
          operation: 'materialise',
          success: false,
          error: result.error,
          metadata: {
            specificationPath: params.specificationPath,
            framework: params.framework,
            executionTime: result.executionTime
          }
        };

        return JSON.stringify(errorResponse, null, 2);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      this.eventEmitter.emit('error-occurred', {
        operation: 'materialise_implementation',
        error: errorMessage,
        context: params
      });

      const errorResponse = {
        operation: 'materialise',
        success: false,
        error: errorMessage,
        metadata: {
          specificationPath: params.specificationPath,
          framework: params.framework
        }
      };

      return JSON.stringify(errorResponse, null, 2);
    }
  }

  /**
   * Realize complete application from specifications
   */
  async realizeApplication(params: RealizeApplicationParams): Promise<string> {
    this.eventEmitter.emit('tool-called', {
      toolName: 'realize_application',
      arguments: params,
      executionTime: 0
    });

    try {
      const context: OrchestratorExecutionContext = {
        operation: 'realize',
        inputPath: params.specificationPath,
        inputType: 'specification',
        outputPath: params.outputPath,
        framework: params.framework,
        scale: params.scale || 'business',
        interactive: params.interactive || false
      };

      const result = await this.orchestratorBridge.execute(context);

      if (result.success) {
        const response = {
          operation: 'realize',
          success: true,
          result: result.content,
          metadata: {
            specificationPath: params.specificationPath,
            framework: params.framework,
            scale: params.scale || 'business',
            outputPath: params.outputPath,
            executionTime: result.executionTime,
            provider: result.provider,
            sessionId: result.sessionId
          }
        };

        return JSON.stringify(response, null, 2);
      } else {
        const errorResponse = {
          operation: 'realize',
          success: false,
          error: result.error,
          metadata: {
            specificationPath: params.specificationPath,
            framework: params.framework,
            executionTime: result.executionTime
          }
        };

        return JSON.stringify(errorResponse, null, 2);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      this.eventEmitter.emit('error-occurred', {
        operation: 'realize_application',
        error: errorMessage,
        context: params
      });

      const errorResponse = {
        operation: 'realize',
        success: false,
        error: errorMessage,
        metadata: {
          specificationPath: params.specificationPath,
          framework: params.framework
        }
      };

      return JSON.stringify(errorResponse, null, 2);
    }
  }

  /**
   * Get orchestrator workflow status and capabilities
   */
  async getWorkflowStatus(params: WorkflowStatusParams = {}): Promise<string> {
    this.eventEmitter.emit('tool-called', {
      toolName: 'get_workflow_status',
      arguments: params,
      executionTime: 0
    });

    try {
      const capabilities = this.orchestratorBridge.getCapabilities();
      const isAvailable = this.orchestratorBridge.isAvailable();
      const supportedOperations = this.orchestratorBridge.getSupportedOperations();

      const status = {
        orchestratorAvailable: isAvailable,
        capabilities,
        supportedOperations,
        workflowInformation: {
          fullWorkflowSupport: capabilities.hasFullOrchestrator,
          sessionSupport: capabilities.sessionSupport,
          inferenceEngine: capabilities.inferenceEngine,
          workingDirectory: capabilities.workingDirectory,
          ...(params.sessionId ? {
            sessionId: params.sessionId,
            sessionStatus: 'Session support requires full orchestrator'
          } : {})
        }
      };

      const response = {
        operation: 'workflow_status',
        success: true,
        result: status,
        metadata: {
          queryTime: Date.now(),
          hasFullOrchestrator: capabilities.hasFullOrchestrator,
          availableOperations: supportedOperations.length
        }
      };

      return JSON.stringify(response, null, 2);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      this.eventEmitter.emit('error-occurred', {
        operation: 'get_workflow_status',
        error: errorMessage,
        context: params
      });

      const errorResponse = {
        operation: 'workflow_status',
        success: false,
        error: errorMessage,
        metadata: {
          queryTime: Date.now()
        }
      };

      return JSON.stringify(errorResponse, null, 2);
    }
  }
}