/**
 * MCPServerController
 * Clean implementation with only dynamic CLI tools
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { 
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListToolsRequestSchema,
  CallToolRequestSchema 
} from '@modelcontextprotocol/sdk/types.js';

import { HybridResourcesProvider } from '../services/HybridResourcesProvider.js';
import { CLIProxyService } from '../services/CLIProxyService.js';
import { EntityModuleService } from '../services/EntityModuleService.js';
import { EventEmitter } from '../events/EventEmitter.js';
import type {
  MCPServerConfig,
  SpecVerseResource,
  ServerStartedEvent,
  ResourceRequestedEvent,
  ErrorOccurredEvent
} from '../types/index.js';

export class MCPServerController {
  private server: Server;
  private config: MCPServerConfig;
  private resourcesProvider: HybridResourcesProvider;
  private cliProxy: CLIProxyService;
  private entityModuleService: EntityModuleService;
  private eventEmitter: EventEmitter;

  constructor(config: MCPServerConfig) {
    this.config = config;
    this.eventEmitter = new EventEmitter();
    
    // Initialize server
    this.server = new Server({
      name: 'specverse-dynamic-cli',
      version: '1.0.0'
    }, {
      capabilities: {
        resources: {},
        tools: {}
      }
    });

    // Initialize services
    this.resourcesProvider = new HybridResourcesProvider({
      mode: 'auto',
      resourcesPath: config.resources_path
    });

    // Initialize CLI proxy for dynamic command discovery - this is our main service!
    this.cliProxy = new CLIProxyService();

    // Initialize entity module service for metadata exposure
    this.entityModuleService = new EntityModuleService();

    this.setupHandlers();
  }

  async listResources(): Promise<SpecVerseResource[]> {
    try {
      const startTime = Date.now();
      const resources = await this.resourcesProvider.listResources();

      // Add entity module resources if available
      if (this.entityModuleService.isAvailable()) {
        resources.push(...this.entityModuleService.generateResources());
      }

      this.eventEmitter.emit('resource-requested', {
        uri: 'LIST_ALL',
        requestTime: new Date()
      } as ResourceRequestedEvent);

      if (this.config.logging && this.config.mode !== 'local' && process.env.MCP_DEBUG) {
        console.error(`Listed ${resources.length} resources in ${Date.now() - startTime}ms`);
      }

      return resources;
    } catch (error) {
      this.eventEmitter.emit('error-occurred', {
        operation: 'listResources',
        error: error instanceof Error ? error.message : String(error)
      } as ErrorOccurredEvent);
      throw error;
    }
  }

  async readResource(uri: string): Promise<SpecVerseResource> {
    try {
      const startTime = Date.now();

      // Check entity module resources first
      if (uri.startsWith('specverse://entities/') && this.entityModuleService.isAvailable()) {
        const entityResources = this.entityModuleService.generateResources();
        const resource = entityResources.find(r => r.uri === uri);
        if (resource) {
          this.eventEmitter.emit('resource-requested', { uri, requestTime: new Date() } as ResourceRequestedEvent);
          return resource;
        }
      }

      const content = await this.resourcesProvider.getResourceContent(uri);
      const resources = await this.resourcesProvider.listResources();
      const resource = resources.find(r => r.uri === uri);

      if (!resource) {
        throw new Error(`Resource not found: ${uri}`);
      }

      this.eventEmitter.emit('resource-requested', {
        uri,
        requestTime: new Date()
      } as ResourceRequestedEvent);

      if (this.config.logging && this.config.mode !== 'local' && process.env.MCP_DEBUG) {
        console.error(`Read resource ${uri} in ${Date.now() - startTime}ms`);
      }

      return {
        ...resource,
        content
      };
    } catch (error) {
      this.eventEmitter.emit('error-occurred', {
        operation: 'readResource',
        error: error instanceof Error ? error.message : String(error),
        context: { uri }
      } as ErrorOccurredEvent);
      throw error;
    }
  }

  private setupHandlers(): void {
    // List resources handler
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      const resources = await this.listResources();
      return { resources };
    });

    // Read resource handler
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const resource = await this.readResource(request.params.uri);
      return {
        contents: [{
          uri: resource.uri,
          mimeType: resource.mimeType,
          text: resource.content
        }]
      };
    });

    // List tools handler - dynamic CLI tools + entity module tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      let dynamicCliTools: any[] = [];
      try {
        dynamicCliTools = await this.cliProxy.generateMCPTools();
        if (this.config.logging && this.config.mode !== 'local' && process.env.MCP_DEBUG) {
          console.error(`🔧 Generated ${dynamicCliTools.length} dynamic CLI tools`);
        }
      } catch (error) {
        if (this.config.logging && process.env.MCP_DEBUG) {
          console.error('⚠️ Failed to generate dynamic CLI tools:', error);
        }
      }

      // Add entity module tools
      if (this.entityModuleService.isAvailable()) {
        dynamicCliTools.push(...this.entityModuleService.generateTools());
      }

      return { tools: dynamicCliTools };
    });

    // Call tool handler - dynamic CLI tools + entity module tools
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const { name, arguments: args } = request.params;

        // Entity module tools
        const entityToolNames = ['specverse_expand_constraint', 'specverse_list_conventions', 'specverse_entity_info'];
        if (entityToolNames.includes(name) && this.entityModuleService.isAvailable()) {
          return await this.entityModuleService.executeTool(name, args || {}) as any;
        }

        // Dynamic CLI tools
        if (name.startsWith('specverse_')) {
          const result = await this.cliProxy.executeCommand(name, args || {});
          return { content: result.content };
        } else {
          return {
            content: [{
              type: 'text',
              text: `Error: Unknown tool '${name}'. Only dynamic CLI tools (prefixed with 'specverse_') are supported.`
            }]
          };
        }
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `Error in tool handler: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    });
  }

  /**
   * Start the MCP server
   */
  async start(): Promise<void> {
    try {
      await this.resourcesProvider.initializeResources();

      // Initialize entity module service (non-blocking, fails gracefully)
      const entityAvailable = await this.entityModuleService.initialize();
      if (this.config.logging && process.env.MCP_DEBUG) {
        if (entityAvailable) {
          const modules = this.entityModuleService.getEntityModules();
          console.error(`🧩 Entity modules loaded: ${modules.length} modules, ${modules.reduce((s, m) => s + m.inferenceRuleCount, 0)} rules`);
        } else {
          console.error('⚠️ Entity modules not available in this deployment');
        }
      }

      this.eventEmitter.emit('server-started', {
        serverName: 'SpecVerse Dynamic CLI',
        mode: this.config.mode,
        timestamp: new Date(),
        featuresEnabled: this.config.features,
        pid: process.pid
      } as ServerStartedEvent);

      if (this.config.logging && process.env.MCP_DEBUG) {
        const mode = this.config.mode || 'local';
        const resourceCount = this.resourcesProvider.getCachedResourceCount();
        console.error(`🚀 SpecVerse MCP Server started in ${mode} mode`);
        console.error(`📚 Loaded ${resourceCount} resources`);
        console.error(`🔧 Dynamic CLI integration enabled - all tools from CLI`);
      }
    } catch (error) {
      this.eventEmitter.emit('error-occurred', {
        operation: 'start',
        error: error instanceof Error ? error.message : String(error)
      } as ErrorOccurredEvent);
      throw error;
    }
  }

  /**
   * Stop the MCP server
   */
  async stop(): Promise<void> {
    try {
      await this.server.close();
      
      if (this.config.logging && process.env.MCP_DEBUG) {
        console.error('🛑 SpecVerse MCP Server stopped');
      }
    } catch (error) {
      this.eventEmitter.emit('error-occurred', {
        operation: 'stop',
        error: error instanceof Error ? error.message : String(error)
      } as ErrorOccurredEvent);
      throw error;
    }
  }

  // Methods expected by the main server
  getEventEmitter() {
    return this.eventEmitter;
  }

  async initialize(): Promise<void> {
    await this.start();
  }

  getServer() {
    return this.server;
  }

  getMetrics() {
    return {
      resourceCount: this.resourcesProvider.getCachedResourceCount(),
      cliIntegration: true
    };
  }
}