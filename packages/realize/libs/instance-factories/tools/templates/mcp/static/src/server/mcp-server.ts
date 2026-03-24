#!/usr/bin/env node
/**
 * SpecVerse AI Support MCP Server - Clean Implementation
 * 
 * Generated from extracted specifications using MCP materialization prompt
 */

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { MCPServerController } from '../controllers/MCPServerController.js';
import type { MCPServerConfig, MCPServerMode } from '../types/index.js';

export class SpecVerseCleanMCPServer {
  private controller: MCPServerController;
  private config: MCPServerConfig;

  constructor(config: MCPServerConfig) {
    this.config = config;
    this.controller = new MCPServerController(config);
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    const eventEmitter = this.controller.getEventEmitter();

    // Log server events if logging is enabled (but not in local/stdio mode)
    if (this.config.logging && this.config.mode !== 'local') {
      eventEmitter.on('server-started', (event) => {
        const serverEvent = event as import('../types/index.js').ServerStartedEvent;
        console.error(`Clean MCP Server started in ${serverEvent.mode} mode (PID: ${serverEvent.pid})`);
        if (serverEvent.port) {
          console.error(`Server listening on port ${serverEvent.port}`);
        }
      });

      eventEmitter.on('tool-called', (event) => {
        const toolEvent = event as import('../types/index.js').ToolCalledEvent;
        console.error(`Tool executed: ${toolEvent.toolName} (${toolEvent.executionTime}ms)`);
      });

      eventEmitter.on('resource-requested', (event) => {
        const resourceEvent = event as import('../types/index.js').ResourceRequestedEvent;
        console.error(`Resource accessed: ${resourceEvent.uri}`);
      });

      eventEmitter.on('error-occurred', (event) => {
        const errorEvent = event as import('../types/index.js').ErrorOccurredEvent;
        console.error(`Error in ${errorEvent.operation}: ${errorEvent.error}`);
        if (errorEvent.context) {
          console.error('Context:', JSON.stringify(errorEvent.context, null, 2));
        }
      });
    }
  }

  async start(): Promise<void> {
    // Initialize the controller first
    await this.controller.initialize();

    if (this.config.mode === 'local') {
      // Local mode: use stdio transport
      const transport = new StdioServerTransport(process.stdin, process.stdout);

      try {
        await this.controller.getServer().connect(transport);
      } catch (error) {
        console.error('MCP Server connection failed:', error);
        process.exit(1);
      }

      // Handle graceful shutdown
      const gracefulShutdown = () => {
        process.exit(0);
      };

      process.on('SIGINT', gracefulShutdown);
      process.on('SIGTERM', gracefulShutdown);
      
      // Keep process alive for stdio transport
      process.stdin.resume();
      
    } else if (this.config.mode === 'remote') {
      // Remote mode: simple HTTP server for web deployments
      if (this.config.logging) {
        console.error('Starting Clean MCP Server in remote mode...');
      }

      // Create a simple health check endpoint for testing
      const { createServer } = await import('http');
      const server = createServer(async (req, res) => {
        if (req.url === '/health') {
          const metrics = this.controller.getMetrics();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            status: 'healthy',
            mode: 'remote',
            metrics 
          }));
        } else if (req.url === '/mcp/resources') {
          // List all available resources
          try {
            const resources = await this.controller.listResources();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
              resources,
              count: resources.length,
              mode: 'remote'
            }));
          } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
              error: error instanceof Error ? error.message : String(error) 
            }));
          }
        } else if (req.url?.startsWith('/mcp/resource/')) {
          // Read specific resource by URI (encoded in path)
          try {
            const uri = decodeURIComponent(req.url.replace('/mcp/resource/', ''));
            const resource = await this.controller.readResource(uri);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(resource));
          } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
              error: error instanceof Error ? error.message : String(error) 
            }));
          }
        } else if (req.url === '/mcp') {
          // Future: Full MCP over HTTP would go here
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            message: 'MCP over HTTP partially implemented',
            mode: 'remote',
            endpoints: [
              '/mcp/resources - List all resources',
              '/mcp/resource/{uri} - Read specific resource'
            ]
          }));
        } else {
          res.writeHead(404);
          res.end('Not found');
        }
      });

      const port = this.config.port || 3000;
      server.listen(port, () => {
        if (this.config.logging) {
          console.error(`Clean MCP Server listening on port ${port}`);
          console.error('Health check: http://localhost:' + port + '/health');
        }
      });

      // Handle graceful shutdown
      const gracefulShutdown = () => {
        if (this.config.logging) {
          console.error('Clean MCP Server shutting down...');
        }
        server.close(() => {
          process.exit(0);
        });
      };

      process.on('SIGINT', gracefulShutdown);
      process.on('SIGTERM', gracefulShutdown);

    } else {
      throw new Error(`Unsupported mode: ${this.config.mode}`);
    }
  }

  getController(): MCPServerController {
    return this.controller;
  }
}

// CLI entry point
async function main(): Promise<void> {
  // Global error handlers
  process.on('uncaughtException', (error) => {
    console.error('Uncaught exception in Clean MCP server:', error);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled rejection in Clean MCP server:', reason);
    process.exit(1);
  });

  // Parse command line arguments
  const args = process.argv.slice(2);
  const mode = (args.includes('--mode') 
    ? args[args.indexOf('--mode') + 1] 
    : 'local') as MCPServerMode;
  
  const port = args.includes('--port')
    ? parseInt(args[args.indexOf('--port') + 1])
    : 3000;

  const config: MCPServerConfig = {
    mode,
    port,
    logging: !args.includes('--silent'),
    resources_path: args.includes('--resources-path')
      ? args[args.indexOf('--resources-path') + 1]
      : undefined,
    features: {
      orchestrator: args.includes('--enable-orchestrator')
    }
  };

  // Suppress all logging in local mode (stdio MCP protocol)
  if (config.logging && config.mode !== 'local') {
    console.error('Starting Clean SpecVerse MCP Server with config:', JSON.stringify(config, null, 2));
  }

  try {
    const server = new SpecVerseCleanMCPServer(config);
    await server.start();
  } catch (error) {
    console.error('Failed to start Clean MCP Server:', error);
    process.exit(1);
  }
}

// Execute main if this file is run directly or as a binary
const condition1 = import.meta.url === `file://${process.argv[1]}`;
const condition2 = process.argv[1]?.includes('mcp-server.js');
const condition3 = process.argv[0]?.includes('specverse-mcp');
const condition4 = process.argv[1]?.includes('specverse-mcp'); // npm wrapper detection
const isMainModule = condition1 || condition2 || condition3 || condition4;


if (isMainModule) {
  main().catch((error) => {
    console.error('Fatal error in Clean MCP Server:', error);
    process.exit(1);
  });
}

export { main };