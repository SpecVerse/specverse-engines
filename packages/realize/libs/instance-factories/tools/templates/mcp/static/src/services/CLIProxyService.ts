/**
 * CLIProxyService
 * Dynamic CLI integration service for MCP server
 * 
 * This service uses the shared CLI discovery utility to dynamically discover
 * and execute CLI commands with --json output, ensuring the MCP server
 * always stays in sync with CLI capabilities.
 */

// Runtime import resolution for development vs published package
async function loadSpecVerseAPI() {
  const { createRequire } = await import('module');
  const { fileURLToPath } = await import('url');
  const { join, dirname } = await import('path');
  const require = createRequire(import.meta.url);

  // Construct import paths dynamically to avoid TypeScript compile-time resolution
  const publishedPackage = '@' + 'specverse/lang';

  // Get current file location and calculate path to dist/index.js
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  // Determine if we're in src/ (tests) or dist/ (runtime)
  // Runtime: tools/specverse-mcp/dist/local/services/ -> go up 5 to root
  // Tests:   tools/specverse-mcp/src/services/        -> go up 4 to root
  const isInDist = __dirname.includes('/dist/');
  const levelsUp = isInDist ? 5 : 4;
  const pathParts = Array(levelsUp).fill('..').concat(['dist', 'index.js']);
  const localPath = join(__dirname, ...pathParts);

  // In development, prefer local build over published package
  // Use import directly - if it fails, we'll fall back to published
  try {
    return await import(localPath);
  } catch (localError) {
    // Local build doesn't exist or failed to load
    try {
      // Try to resolve the published package
      require.resolve(publishedPackage);
      return await import(publishedPackage);
    } catch (publishedError) {
      // Neither worked - throw original error
      throw new Error(`Failed to load SpecVerse API: local (${localError.message}) and published (${publishedError.message})`);
    }
  }
}

// This will be initialized in the class constructor
let specverseAPI: any = null;

type CLICapabilities = any;
type CLICommand = any;
type GroupedCommand = any;
import { writeFileSync, unlinkSync, mkdtempSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import type { MCPToolResult } from '../types/index.js';

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

export class CLIProxyService {
  private capabilities: CLICapabilities | null = null;
  private cliPath: string | null = null;
  private lastDiscovery: number = 0;
  private readonly DISCOVERY_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private initialized = false;

  constructor(private workingDirectory?: string) {
    // API will be loaded lazily in init()
  }

  /**
   * Initialize the API - called once before first use
   */
  private async init() {
    if (this.initialized) return;
    
    specverseAPI = await loadSpecVerseAPI();
    this.cliPath = specverseAPI.getCliPath(this.workingDirectory);
    
    if (!this.cliPath && process.env.MCP_DEBUG) {
      // Only warn to stderr in debug mode - stdout must be clean for MCP protocol
      console.error('⚠️ SpecVerse CLI not found. CLI proxy functionality will be limited.');
    }
    
    this.initialized = true;
  }

  /**
   * Discover CLI capabilities (cached for performance)
   */
  async discoverCapabilities(): Promise<CLICapabilities> {
    await this.init();
    
    const now = Date.now();
    
    // Return cached capabilities if still fresh
    if (this.capabilities && (now - this.lastDiscovery) < this.DISCOVERY_CACHE_TTL) {
      return this.capabilities;
    }

    // Discover fresh capabilities
    try {
      this.capabilities = specverseAPI.getAllCliCapabilities(this.cliPath || undefined);
      this.lastDiscovery = now;
      
      // Don't log to console in MCP mode - it breaks the JSON protocol
      // Only log if explicitly in debug mode
      if (process.env.MCP_DEBUG) {
        console.error(`🔍 Discovered ${this.capabilities.coreCommands.length} core commands, ` +
                     `${this.capabilities.groupedCommands.length} grouped commands, ` +
                     `${this.capabilities.aiCommands.length} AI commands`);
      }
      
      return this.capabilities;
    } catch (error) {
      // Log errors to stderr, not stdout
      if (process.env.MCP_DEBUG) {
        console.error('❌ Failed to discover CLI capabilities:', error);
      }
      // Return empty capabilities as fallback
      return {
        coreCommands: [],
        groupedCommands: [],
        aiCommands: []
      };
    }
  }

  /**
   * Generate MCP tool definitions from CLI capabilities
   */
  async generateMCPTools(): Promise<MCPTool[]> {
    const capabilities = await this.discoverCapabilities();
    const tools: MCPTool[] = [];

    // Add MCP-specific debug tool first
    tools.push({
      name: 'specverse_mcp_debug',
      description: 'Show MCP server diagnostic information including SpecVerse installation details, path resolution, and environment analysis',
      inputSchema: {
        type: 'object',
        properties: {
          verbose: {
            type: 'boolean',
            description: 'Show detailed path resolution information'
          }
        },
        required: []
      }
    });

    // Core commands (validate, infer, init)
    for (const cmd of capabilities.coreCommands) {
      tools.push(this.createMCPToolFromCommand(cmd));
    }

    // Grouped commands (gen yaml, dev format, test cycle, etc.)
    for (const cmd of capabilities.groupedCommands) {
      tools.push(this.createMCPToolFromGroupedCommand(cmd));
    }

    // AI commands are handled specially since they have complex arguments
    for (const cmd of capabilities.aiCommands) {
      tools.push(...this.createAIMCPTools());
      break; // Only need to process AI commands once
    }

    // Add content-based tools for direct LLM interaction
    tools.push(...this.createContentBasedTools());

    return tools;
  }

  /**
   * Execute a CLI command via the proxy
   */
  async executeCommand(toolName: string, args: Record<string, any>): Promise<MCPToolResult> {
    try {
      // Initialize if not already done
      await this.init();

      // Handle MCP-specific debug tool
      if (toolName === 'specverse_mcp_debug') {
        return await this.executeMCPDebugTool(args.verbose || false);
      }

      if (!this.cliPath) {
        return {
          content: [{
            type: 'text',
            text: 'SpecVerse CLI not found. Please ensure SpecVerse is installed and accessible.'
          }],
          isError: true
        };
      }

      // Handle content-based tools by creating temporary files
      if (toolName.endsWith('_content')) {
        return await this.handleContentBasedCommand(toolName, args);
      }

      // Map MCP tool name back to CLI command
      const baseCommand = this.mapToolNameToCommand(toolName);
      
      // Handle commands with positional arguments
      let command = baseCommand;
      let commandArgs = { ...args };
      
      // Handle AI commands - append operation as positional argument
      if (baseCommand.startsWith('ai ') && args.operation) {
        command = `${baseCommand} ${args.operation}`;
        const { operation, ...remainingArgs } = args;
        commandArgs = remainingArgs;
      }

      // Handle lib commands with positional arguments
      else if (baseCommand.startsWith('lib ')) {
        if (baseCommand === 'lib search' && args.query) {
          command = `${baseCommand} "${args.query}"`;
          const { query, ...remainingArgs } = args;
          commandArgs = remainingArgs;
        } else if (baseCommand === 'lib info' && args.name) {
          command = `${baseCommand} "${args.name}"`;
          const { name, ...remainingArgs } = args;
          commandArgs = remainingArgs;
        }
        // lib list, lib tags, lib cache don't have positional arguments
      }

      // Handle init command - append name as positional argument
      else if (baseCommand === 'init') {
        // Init command special handling
        console.error(`MCP Debug: Received args.name: "${args.name}"`);
        console.error(`MCP Debug: Full args object:`, JSON.stringify(args, null, 2));
        if (args.name) {
          // Pass the full path to executeInitCommand in args, use basename for CLI
          const fullPath = args.name;
          const projectName = args.name.includes('/') ? args.name.split('/').pop() : args.name;
          command = `${baseCommand} "${projectName}"`;
          const { name, ...remainingArgs } = args;
          // Preserve the full path in commandArgs for proper directory handling
          commandArgs = { ...remainingArgs, fullPath };
        }
        
        // Init doesn't support --json, so we need to handle its output specially
        try {
          const result = await this.executeInitCommand(command, commandArgs);
          return {
            content: [{
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }]
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                status: 'error',
                message: 'Init command failed',
                details: errorMessage,
                timestamp: new Date().toISOString()
              }, null, 2)
            }],
            isError: true
          };
        }
      }
      
      // Handle other commands with positional file arguments
      else if (args.file) {
        command = `${baseCommand} "${args.file}"`;
        const { file, ...remainingArgs } = args;
        commandArgs = remainingArgs;
      }
      
      // Execute with JSON output
      const result = await specverseAPI.executeCliCommand(command, commandArgs, { 
        cliPath: this.cliPath,
        timeout: 60000 // 1 minute timeout
      });

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }]
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Try to parse error as JSON (CLI returns structured errors)
      try {
        const parsedError = JSON.parse(errorMessage);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(parsedError, null, 2)
          }],
          isError: true
        };
      } catch {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              status: 'error',
              message: 'CLI command execution failed',
              details: errorMessage,
              timestamp: new Date().toISOString()
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  }

  /**
   * Create MCP tool definition from core CLI command
   */
  private createMCPToolFromCommand(cmd: CLICommand): MCPTool {
    const properties: Record<string, any> = {};
    const required: string[] = [];

    // Parse arguments and options
    if (cmd.args) {
      if (cmd.args.includes('<file>')) {
        properties.file = {
          type: 'string',
          description: 'SpecVerse specification file path'
        };
        required.push('file');
      }
      if (cmd.args.includes('[name]')) {
        properties.name = {
          type: 'string',
          description: 'Project name (optional)'
        };
      }
    }
    
    // Special handling for init command based on known CLI structure
    if (cmd.command === 'init') {
      properties.name = {
        type: 'string',
        description: 'Project name'
      };
      // Add template option that init supports
      properties.template = {
        type: 'string',
        description: 'Template to use (default: "default")'
      };
      // Add MCP-specific flags
      properties.zip = {
        type: 'boolean',
        description: 'Return project as ZIP file'
      };
      properties.json = {
        type: 'boolean',
        description: 'Return project as JSON file structure'
      };
      // Don't add verbose for init - it doesn't support it
    } else if (cmd.command === 'validate' || cmd.command === 'infer') {
      // These commands support verbose
      properties.verbose = {
        type: 'boolean',
        description: 'Show detailed output'
      };
    }
    
    // Add zip parameter for file-generating commands
    if (this.isFileGeneratingCommand(cmd.command)) {
      properties.zip = {
        type: 'boolean',
        description: 'Return files as ZIP package instead of creating locally (useful for remote servers or consistent delivery)'
      };
    }

    return {
      name: `specverse_${cmd.command}`,
      description: cmd.description,
      inputSchema: {
        type: 'object',
        properties,
        required
      }
    };
  }

  /**
   * Check if a command generates files that could benefit from ZIP packaging
   */
  private isFileGeneratingCommand(command: string): boolean {
    return ['init'].includes(command);
  }

  /**
   * Check if a grouped command generates files that could benefit from ZIP packaging
   */
  private isFileGeneratingGroupedCommand(cmd: any): boolean {
    // All gen commands generate files
    if (cmd.group === 'gen') {
      return true;
    }
    // Other commands that generate files can be added here
    return false;
  }

  /**
   * Create MCP tool definition from grouped command
   */
  private createMCPToolFromGroupedCommand(cmd: GroupedCommand): MCPTool {
    const properties: Record<string, any> = {};
    const required: string[] = [];

    // Most grouped commands need a file
    if (cmd.args?.includes('<file>')) {
      properties.file = {
        type: 'string',
        description: 'SpecVerse specification file path'
      };
      required.push('file');
    }

    // Add group-specific options
    if (cmd.group === 'gen') {
      properties.output = {
        type: 'string',
        description: 'Output file or directory path'
      };
    } else if (cmd.group === 'dev' && cmd.subcommand === 'watch') {
      properties.directory = {
        type: 'string',
        description: 'Directory to watch for changes'
      };
    } else if (cmd.group === 'lib') {
      // Add lib-specific options based on subcommand
      if (cmd.subcommand === 'search') {
        if (cmd.args?.includes('[query]')) {
          properties.query = {
            type: 'string',
            description: 'Search term (name, description, tags)'
          };
        }
        properties.type = {
          type: 'string',
          enum: ['component', 'deployment', 'manifest'],
          description: 'Filter by type'
        };
        properties.category = {
          type: 'string',
          description: 'Filter by category'
        };
        properties.tags = {
          type: 'string',
          description: 'Filter by tags (comma-separated: auth,jwt,session)'
        };
        properties.limit = {
          type: 'number',
          description: 'Results limit (default: 20)'
        };
        properties.format = {
          type: 'string',
          enum: ['table', 'json'],
          description: 'Output format (default: table)'
        };
      } else if (cmd.subcommand === 'info') {
        if (cmd.args?.includes('<name>')) {
          properties.name = {
            type: 'string',
            description: 'Library name'
          };
          required.push('name');
        }
        properties.version = {
          type: 'string',
          description: 'Specific version (default: latest)'
        };
        properties.format = {
          type: 'string',
          enum: ['table', 'json'],
          description: 'Output format (default: table)'
        };
        properties.content = {
          type: 'boolean',
          description: 'Show library content'
        };
      } else if (cmd.subcommand === 'list') {
        properties.cached = {
          type: 'boolean',
          description: 'Show locally cached libraries'
        };
        properties.used = {
          type: 'boolean',
          description: 'Show libraries used in current project'
        };
        properties.format = {
          type: 'string',
          enum: ['table', 'json'],
          description: 'Output format (default: table)'
        };
      } else if (cmd.subcommand === 'tags') {
        properties.format = {
          type: 'string',
          enum: ['table', 'json'],
          description: 'Output format (default: table)'
        };
      }
    }
    
    // Add zip parameter for file-generating grouped commands  
    if (this.isFileGeneratingGroupedCommand(cmd)) {
      properties.zip = {
        type: 'boolean',
        description: 'Return files as ZIP package instead of creating locally (useful for remote servers or consistent delivery)'
      };
    }

    return {
      name: `specverse_${cmd.command.replace(/\s+/g, '_')}`,
      description: cmd.description,
      inputSchema: {
        type: 'object',
        properties,
        required
      }
    };
  }

  /**
   * Create MCP tools for AI commands
   */
  private createAIMCPTools(): MCPTool[] {
    return [
      {
        name: 'specverse_ai_template',
        description: 'Get AI prompt templates for SpecVerse operations',
        inputSchema: {
          type: 'object',
          properties: {
            operation: {
              type: 'string',
              enum: ['analyse', 'create', 'materialise', 'realize'],
              description: 'AI operation type'
            },
            pver: {
              type: 'string',
              description: 'Prompt version (v1|v2|v3|v4|v5|v6|v7) (default: v1)'
            },
            output: {
              type: 'string',
              description: 'Output file path'
            },
            copy: {
              type: 'boolean',
              description: 'Copy result to clipboard'
            }
          },
          required: ['operation']
        }
      },
      {
        name: 'specverse_ai_fill',
        description: 'Fill AI prompt templates with requirements',
        inputSchema: {
          type: 'object',
          properties: {
            operation: {
              type: 'string',
              enum: ['analyse', 'create', 'materialise', 'realize'],
              description: 'AI operation type'
            },
            requirements: {
              type: 'string',
              description: 'Project requirements'
            },
            scale: {
              type: 'string',
              enum: ['personal', 'business', 'enterprise'],
              description: 'Project scale (default: business)'
            },
            framework: {
              type: 'string',
              description: 'Framework preference'
            },
            domain: {
              type: 'string',
              description: 'Project domain'
            },
            compliance: {
              type: 'string',
              description: 'Compliance requirements (comma-separated)'
            },
            tech: {
              type: 'string',
              description: 'Technology preferences (comma-separated)'
            },
            pver: {
              type: 'string',
              description: 'Prompt version (v1|v2|v3|v4|v5|v6|v7) (default: v1)'
            },
            output: {
              type: 'string',
              description: 'Output file path'
            },
            copy: {
              type: 'boolean',
              description: 'Copy result to clipboard'
            }
          },
          required: ['operation', 'requirements']
        }
      },
      {
        name: 'specverse_ai_suggest',
        description: 'Get AI library suggestions for project requirements',
        inputSchema: {
          type: 'object',
          properties: {
            requirements: {
              type: 'string',
              description: 'Project requirements'
            },
            domain: {
              type: 'string',
              description: 'Project domain'
            },
            scale: {
              type: 'string',
              enum: ['personal', 'business', 'enterprise'],
              default: 'business',
              description: 'Project scale'
            }
          },
          required: ['requirements']
        }
      },
      {
        name: 'specverse_ai_enhance',
        description: 'Get enhanced AI prompts with library context (BEST)',
        inputSchema: {
          type: 'object',
          properties: {
            operation: {
              type: 'string',
              enum: ['analyse', 'create', 'materialise', 'realize'],
              description: 'AI operation type'
            },
            requirements: {
              type: 'string',
              description: 'Project requirements'
            },
            scale: {
              type: 'string',
              enum: ['personal', 'business', 'enterprise'],
              description: 'Project scale (default: business)'
            },
            framework: {
              type: 'string',
              description: 'Framework preference'
            },
            domain: {
              type: 'string',
              description: 'Project domain'
            },
            compliance: {
              type: 'string',
              description: 'Compliance requirements (comma-separated)'
            },
            tech: {
              type: 'string',
              description: 'Technology preferences (comma-separated)'
            },
            pver: {
              type: 'string',
              description: 'Prompt version (v1|v2|v3|v4|v5|v6|v7) (default: v1)'
            },
            output: {
              type: 'string',
              description: 'Output file path'
            },
            copy: {
              type: 'boolean',
              description: 'Copy result to clipboard'
            }
          },
          required: ['operation', 'requirements']
        }
      }
    ];
  }

  /**
   * Create content-based tools for direct LLM interaction
   */
  private createContentBasedTools(): MCPTool[] {
    return [
      {
        name: 'specverse_validate_content',
        description: 'Validate SpecVerse specification content directly (no file required)',
        inputSchema: {
          type: 'object',
          properties: {
            content: {
              type: 'string',
              description: 'SpecVerse specification content (.specly format)'
            },
            filename: {
              type: 'string',
              description: 'Optional filename for error reporting (default: temp.specly)'
            },
            verbose: {
              type: 'boolean',
              description: 'Show detailed validation results'
            }
          },
          required: ['content']
        }
      },
      {
        name: 'specverse_infer_content',
        description: 'Generate complete specification from content using AI inference',
        inputSchema: {
          type: 'object',
          properties: {
            content: {
              type: 'string',
              description: 'Minimal SpecVerse specification content (.specly format)'
            },
            filename: {
              type: 'string',
              description: 'Optional filename (default: temp.specly)'
            },
            controllers: {
              type: 'boolean',
              description: 'Generate controllers (default: true)'
            },
            services: {
              type: 'boolean',
              description: 'Generate services (default: true)'
            },
            events: {
              type: 'boolean',
              description: 'Generate events (default: true)'
            },
            views: {
              type: 'boolean',
              description: 'Generate views (default: true)'
            },
            deployment: {
              type: 'boolean',
              description: 'Generate deployment specification (default: false)'
            },
            environment: {
              type: 'string',
              enum: ['development', 'staging', 'production'],
              description: 'Target environment for deployment'
            },
            verbose: {
              type: 'boolean',
              description: 'Show detailed inference process'
            }
          },
          required: ['content']
        }
      },
      {
        name: 'specverse_gen_yaml_content',
        description: 'Generate YAML from SpecVerse specification content',
        inputSchema: {
          type: 'object',
          properties: {
            content: {
              type: 'string',
              description: 'SpecVerse specification content (.specly format)'
            },
            filename: {
              type: 'string',
              description: 'Optional filename (default: temp.specly)'
            }
          },
          required: ['content']
        }
      }
    ];
  }

  /**
   * Handle content-based commands by creating temporary files
   */
  private async handleContentBasedCommand(toolName: string, args: Record<string, any>): Promise<MCPToolResult> {
    const { content, filename = 'temp.specly', ...otherArgs } = args;
    
    if (!content) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            status: 'error',
            message: 'Content is required for content-based commands',
            timestamp: new Date().toISOString()
          }, null, 2)
        }],
        isError: true
      };
    }

    // Create temporary directory and file
    let tempDir: string;
    let tempFile: string;
    
    try {
      tempDir = mkdtempSync(join(tmpdir(), 'specverse-mcp-'));
      tempFile = join(tempDir, filename);
      writeFileSync(tempFile, content, 'utf8');

      // Map content tool name to CLI command
      const cliCommand = this.mapContentToolToCommand(toolName);
      
      // Execute CLI command with temporary file
      // Note: Most commands expect file as positional argument, not --file flag
      const result = await specverseAPI.executeCliCommand(`${cliCommand} "${tempFile}"`, otherArgs, {
        cliPath: this.cliPath,
        timeout: 60000
      });

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }]
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      try {
        const parsedError = JSON.parse(errorMessage);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(parsedError, null, 2)
          }],
          isError: true
        };
      } catch {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              status: 'error',
              message: 'Content-based command execution failed',
              details: errorMessage,
              timestamp: new Date().toISOString()
            }, null, 2)
          }],
          isError: true
        };
      }
    } finally {
      // Clean up temporary file
      try {
        if (tempFile) unlinkSync(tempFile);
      } catch {
        // Ignore cleanup errors
      }
    }
  }

  /**
   * Map content-based tool names to CLI commands
   */
  private mapContentToolToCommand(toolName: string): string {
    const mapping: Record<string, string> = {
      'specverse_validate_content': 'validate',
      'specverse_infer_content': 'infer', 
      'specverse_gen_yaml_content': 'gen yaml'
    };
    
    return mapping[toolName] || toolName.replace(/^specverse_/, '').replace(/_content$/, '').replace(/_/g, ' ');
  }

  /**
   * Check if we're running in a remote environment where local file creation won't work
   */
  private async isRemoteEnvironment(): Promise<boolean> {
    // Allow explicit override to force local mode
    if (process.env.MCP_FORCE_LOCAL === 'true') {
      return false;
    }
    
    // Check for common remote environment indicators
    return (
      // Vercel/Netlify/similar serverless
      process.env.VERCEL === '1' ||
      process.env.NETLIFY === 'true' ||
      process.env.AWS_LAMBDA_FUNCTION_NAME !== undefined ||
      
      // Web deployment mode indicators
      process.env.NODE_ENV === 'production' && (
        process.env.PORT !== undefined || 
        process.env.HOST !== undefined
      ) ||
      
      // Environment explicitly marked as remote
      process.env.MCP_REMOTE === 'true' ||
      
      // Detect if we can't write to current directory (more reliable than just checking root)
      await this.isDirectoryReadOnly()
    );
  }

  /**
   * Check if we should use remote environment detection specifically for root directory
   * Only triggers if running from root AND no full paths are provided
   */
  private isProblematicRootEnvironment(args: Record<string, any>): boolean {
    if (process.cwd() !== '/') {
      return false; // Not running from root, so no problem
    }
    
    // If user provided full paths, it should work fine from root
    const hasFullPaths = (
      (args.name && args.name.startsWith('/')) ||           // /full/path/project
      (args.file && args.file.startsWith('/')) ||           // /full/path/file.specly  
      (args.output && args.output.startsWith('/')) ||       // /full/path/output
      (args.directory && args.directory.startsWith('/'))    // /full/path/directory
    );
    
    if (hasFullPaths) {
      return false; // Full paths work fine from root
    }
    
    // Only problematic if we have relative names that would create files in root
    const hasRelativeName = args.name && !args.name.startsWith('/');
    
    // Return true only for the actually problematic case
    return hasRelativeName;
  }

  /**
   * Check if current directory is read-only
   */
  private async isDirectoryReadOnly(): Promise<boolean> {
    try {
      const { writeFileSync, unlinkSync } = await import('fs');
      const testFile = '.mcp-write-test-' + Date.now();
      writeFileSync(testFile, 'test');
      unlinkSync(testFile);
      return false;
    } catch {
      return true;
    }
  }

  /**
   * Read project files into structured format for direct delivery
   */
  private async readProjectFilesStructured(projectPath: string): Promise<{files: any[], summary: any}> {
    const { readdir, readFile, stat } = await import('fs/promises');
    const { join, relative, extname } = await import('path');
    
    const files: any[] = [];
    let totalSize = 0;
    const directories: string[] = [];
    
    const readDirectory = async (dirPath: string) => {
      const entries = await readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = join(dirPath, entry.name);
        const relativePath = relative(projectPath, fullPath);
        
        if (entry.isDirectory()) {
          directories.push(relativePath + '/');
          await readDirectory(fullPath);
        } else if (entry.isFile()) {
          try {
            const content = await readFile(fullPath, 'utf8');
            const stats = await stat(fullPath);
            const extension = extname(entry.name).toLowerCase();
            
            // Determine file type from extension
            let fileType = 'text';
            if (extension === '.js' || extension === '.ts') fileType = 'javascript';
            else if (extension === '.py') fileType = 'python';
            else if (extension === '.md') fileType = 'markdown';
            else if (extension === '.json') fileType = 'json';
            else if (extension === '.yaml' || extension === '.yml') fileType = 'yaml';
            else if (extension === '.specly') fileType = 'specverse';
            else if (extension === '.sh') fileType = 'shell';
            else if (extension === '.html') fileType = 'html';
            else if (extension === '.css') fileType = 'css';
            
            files.push({
              path: relativePath,
              content: content,
              type: fileType,
              size: stats.size,
              encoding: 'utf-8'
            });
            
            totalSize += stats.size;
          } catch (error) {
            console.error(`Failed to read file ${fullPath}:`, error);
            // Skip files that can't be read
          }
        }
      }
    };
    
    await readDirectory(projectPath);
    
    return {
      files,
      summary: {
        total_files: files.length,
        total_size: totalSize < 1024 ? `${totalSize}B` : 
                   totalSize < 1024 * 1024 ? `${(totalSize / 1024).toFixed(1)}KB` :
                   `${(totalSize / 1024 / 1024).toFixed(2)}MB`,
        directories: [...new Set(directories)].sort(),
        file_types: [...new Set(files.map(f => f.type))].sort()
      }
    };
  }

  /**
   * Package project files into ZIP for remote delivery (DEPRECATED - keeping for fallback)
   */
  private async packageProjectFiles(projectPath: string): Promise<{zipData: string, fileName: string, size: number}> {
    const { execSync } = await import('child_process');
    const { readFile, unlink } = await import('fs/promises');
    const { basename, dirname, join } = await import('path');
    const { tmpdir } = await import('os');
    
    const projectName = basename(projectPath);
    const parentDir = dirname(projectPath);
    const tempZipPath = join(tmpdir(), `${projectName}-${Date.now()}.zip`);
    
    console.error(`MCP Packaging Debug: Project path: ${projectPath}`);
    console.error(`MCP Packaging Debug: Project name: ${projectName}`);
    console.error(`MCP Packaging Debug: Parent dir: ${parentDir}`);
    console.error(`MCP Packaging Debug: Temp ZIP path: ${tempZipPath}`);
    
    try {
      // Create ZIP file using system zip command (available on most systems)
      const zipCommand = `cd "${parentDir}" && zip -r "${tempZipPath}" "${projectName}"`;
      console.error(`MCP Packaging Debug: Running command: ${zipCommand}`);
      
      execSync(zipCommand, {
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      console.error(`MCP Packaging Debug: ZIP file created successfully`);
      
      // Read ZIP file as base64
      const zipBuffer = await readFile(tempZipPath);
      console.error(`MCP Packaging Debug: ZIP buffer size: ${zipBuffer.length} bytes`);
      console.error(`MCP Packaging Debug: ZIP buffer size: ${(zipBuffer.length / 1024 / 1024).toFixed(2)} MB`);
      
      const zipData = zipBuffer.toString('base64');
      console.error(`MCP Packaging Debug: Base64 string length: ${zipData.length} chars`);
      
      // Clean up temp ZIP file
      await unlink(tempZipPath);
      console.error(`MCP Packaging Debug: Temp file cleaned up`);
      
      return {
        zipData,
        fileName: `${projectName}.zip`,
        size: zipBuffer.length
      };
    } catch (error) {
      console.error(`MCP Packaging Debug: ZIP command failed, trying fallback:`, error);
      // Fallback: try creating ZIP with Node.js if zip command fails
      return await this.createZipFallback(projectPath);
    }
  }

  /**
   * Fallback ZIP creation using pure Node.js
   */
  private async createZipFallback(projectPath: string): Promise<{zipData: string, fileName: string, size: number}> {
    // Simple ZIP implementation fallback
    // For now, let's use tar.gz which is more universally available
    const { execSync } = await import('child_process');
    const { readFile, unlink } = await import('fs/promises');
    const { basename, dirname, join } = await import('path');
    const { tmpdir } = await import('os');
    
    const projectName = basename(projectPath);
    const parentDir = dirname(projectPath);
    const tempTarPath = join(tmpdir(), `${projectName}-${Date.now()}.tar.gz`);
    
    try {
      // Create tar.gz file (more universally available than zip)
      execSync(`cd "${parentDir}" && tar -czf "${tempTarPath}" "${projectName}"`, {
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      // Read tar.gz file as base64
      const tarBuffer = await readFile(tempTarPath);
      const tarData = tarBuffer.toString('base64');
      
      // Clean up temp tar file
      await unlink(tempTarPath);
      
      return {
        zipData: tarData,
        fileName: `${projectName}.tar.gz`,
        size: tarBuffer.length
      };
    } catch (error) {
      throw new Error(`Failed to create project archive: ${error}`);
    }
  }

  /**
   * Execute init command without --json flag (not supported)
   * For remote deployments, returns project files as JSON structure
   */
  private async executeInitCommand(command: string, args: Record<string, any>): Promise<any> {
    const { execSync } = await import('child_process');
    
    // Build command with arguments (excluding --json, --zip, --local, and fullPath which are MCP-only)
    const argString = Object.entries(args)
      .filter(([key, value]) => 
        value !== undefined && 
        value !== null && 
        key !== 'zip' && // ZIP is handled by MCP service, not CLI
        key !== 'local' && // Local is MCP server flag, not CLI flag
        key !== 'fullPath' && // fullPath is used internally for directory handling
        key !== 'name' // name is passed as positional argument, not flag
      )
      .map(([key, value]) => {
        if (typeof value === 'boolean') {
          return value ? `--${key}` : '';
        } else {
          return `--${key} "${value}"`;
        }
      })
      .filter(Boolean)
      .join(' ');

    const baseCommand = this.cliPath === 'specverse' ? 'specverse' : `node ${this.cliPath}`;
    const fullCommand = `${baseCommand} ${command} ${argString}`.trim();
    
    // Use fullPath from args if available (contains the complete path), otherwise extract from command
    const rawName = args.fullPath || command.match(/"([^"]+)"/)?.[1] || args.name || 'project';
    
    // Handle full path vs relative path
    let projectName: string;
    let targetWorkingDir: string;
    
    if (rawName.startsWith('/')) {
      // Full absolute path - extract parent directory and project name
      const { dirname, basename } = await import('path');
      projectName = basename(rawName);
      targetWorkingDir = dirname(rawName);
    } else {
      // Relative path - use current directory
      projectName = rawName;
      targetWorkingDir = process.cwd();
    }
    
    const forceZip = args.zip === true;
    const forceJson = args.json === true;
    
    console.error(`MCP Init Debug: Working directory: ${process.cwd()}`);
    console.error(`MCP Init Debug: Target working directory: ${targetWorkingDir}`);
    console.error(`MCP Init Debug: Raw name: ${rawName}`);
    console.error(`MCP Init Debug: Project name: ${projectName}`);
    console.error(`MCP Init Debug: Force ZIP: ${forceZip}`);
    console.error(`MCP Init Debug: Force JSON: ${forceJson}`);
    console.error(`MCP Init Debug: Executing command: ${fullCommand}`);
    
    // Simple decision logic
    if (forceZip) {
      console.error(`MCP Init Debug: ZIP requested - will return ZIP file`);
      return await this.executeInitWithZip(fullCommand, projectName, args);
    } else if (forceJson) {
      console.error(`MCP Init Debug: JSON requested - will return JSON structure`);
      return await this.executeInitWithJson(fullCommand, projectName, args);
    } else if (await this.canCreateLocalFiles(projectName, targetWorkingDir)) {
      console.error(`MCP Init Debug: Local filesystem - will create files locally`);
      return await this.executeInitLocal(fullCommand, projectName, targetWorkingDir);
    } else {
      console.error(`MCP Init Debug: Cannot create local files - will return JSON structure`);
      return await this.executeInitWithJson(fullCommand, projectName, args);
    }
  }

  private async canCreateLocalFiles(projectName: string, targetWorkingDir?: string): Promise<boolean> {
    try {
      // Use provided target directory, or fall back to old logic for compatibility
      const targetDir = targetWorkingDir || await (async () => {
        const cwd = process.cwd();
        
        if (projectName.startsWith('/')) {
          // Absolute path - extract parent directory
          const { dirname } = await import('path');
          return dirname(projectName);
        } else {
          // Relative path - check if current directory is problematic
          if (cwd === '/') {
            return null; // Don't create relative paths in root
          }
          return cwd;
        }
      })();
      
      // If we couldn't determine a valid target directory, return false
      if (!targetDir) {
        return false;
      }
      
      // Try to write a test file in the target directory
      const { writeFileSync, unlinkSync } = await import('fs');
      const { join } = await import('path');
      const testFile = join(targetDir, '.mcp-write-test-' + Date.now());
      writeFileSync(testFile, 'test');
      unlinkSync(testFile);
      return true;
    } catch {
      return false;
    }
  }

  private async executeInitLocal(fullCommand: string, projectName: string, targetWorkingDir?: string): Promise<any> {
    const { execSync } = await import('child_process');
    const { join } = await import('path');
    
    // Use provided target directory or fallback to current directory
    const workingDir = targetWorkingDir || process.cwd();
    
    try {
      const result = execSync(fullCommand, { 
        encoding: 'utf8',
        timeout: 30000,
        stdio: 'pipe',
        cwd: workingDir
      });
      
      return {
        status: 'success',
        message: `Project '${projectName}' created successfully`,
        project_path: join(workingDir, projectName),
        delivery_method: 'local_filesystem',
        created: true
      };
    } catch (error: any) {
      const errorOutput = error.stdout || error.stderr || error.message;
      throw new Error(`Failed to create project '${projectName}': ${errorOutput}`);
    }
  }

  private async executeInitWithZip(fullCommand: string, projectName: string, args: Record<string, any>): Promise<any> {
    const { execSync } = await import('child_process');
    const { mkdtemp, rm } = await import('fs/promises');
    const { tmpdir } = await import('os');
    const { join } = await import('path');
    
    // Create in temp directory
    const tempDir = await mkdtemp(join(tmpdir(), 'specverse-zip-'));
    
    try {
      const result = execSync(fullCommand, { 
        encoding: 'utf8',
        timeout: 30000,
        stdio: 'pipe',
        cwd: tempDir
      });
      
      // Package as ZIP
      const projectPath = join(tempDir, projectName);
      const zipData = await this.packageProjectFiles(projectPath);
      
      // Cleanup
      await rm(tempDir, { recursive: true, force: true });
      
      return {
        status: 'success',
        message: `Project '${projectName}' packaged as ZIP`,
        delivery_method: 'zip_file',
        zip_data: zipData.zipData,
        file_name: zipData.fileName,
        size: zipData.size
      };
    } catch (error: any) {
      await rm(tempDir, { recursive: true, force: true }).catch(() => {});
      const errorOutput = error.stdout || error.stderr || error.message;
      throw new Error(`Failed to create project '${projectName}': ${errorOutput}`);
    }
  }

  private async executeInitWithJson(fullCommand: string, projectName: string, args: Record<string, any>): Promise<any> {
    const { execSync } = await import('child_process');
    const { mkdtemp, rm } = await import('fs/promises');
    const { tmpdir } = await import('os');
    const { join } = await import('path');
    
    // Create in temp directory
    const tempDir = await mkdtemp(join(tmpdir(), 'specverse-json-'));
    
    try {
      const result = execSync(fullCommand, { 
        encoding: 'utf8',
        timeout: 30000,
        stdio: 'pipe',
        cwd: tempDir
      });
      
      // Read files as JSON structure
      const projectPath = join(tempDir, projectName);
      const structuredFiles = await this.readProjectFilesStructured(projectPath);
      
      // Cleanup
      await rm(tempDir, { recursive: true, force: true });
      
      return {
        status: 'success',
        instruction: 'create_file_attachments_for_each_file_described_in_files',
        message: `Project '${projectName}' created successfully`,
        project: projectName,
        files: structuredFiles.files,
        summary: structuredFiles.summary,
        delivery_method: 'json_structure'
      };
    } catch (error: any) {
      await rm(tempDir, { recursive: true, force: true }).catch(() => {});
      const errorOutput = error.stdout || error.stderr || error.message;
      throw new Error(`Failed to create project '${projectName}': ${errorOutput}`);
    }
  }

  /**
   * Map MCP tool name back to CLI command
   */
  private mapToolNameToCommand(toolName: string): string {
    // Remove 'specverse_' prefix and convert underscores back to spaces
    const command = toolName.replace(/^specverse_/, '').replace(/_/g, ' ');
    
    // Handle special cases
    if (command.startsWith('ai ')) {
      return command; // ai commands are already correct
    }
    
    return command;
  }

  /**
   * Get MCP package version using Node.js built-in package resolution
   */
  private async getMCPVersion(): Promise<string> {
    try {
      // Method 1: Development mode - look for local package.json first (most reliable)
      const { readFile } = await import('fs/promises');
      const { join, dirname } = await import('path');
      const { fileURLToPath } = await import('url');
      
      // Get current file location and find project root
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = dirname(__filename);
      
      // In development, package.json should be 2-3 levels up from dist/services/
      const packagePaths = [
        join(__dirname, '..', '..', 'package.json'),     // dist/services -> root
        join(__dirname, '..', '..', '..', 'package.json') // dist/target/services -> root
      ];
      
      for (const packagePath of packagePaths) {
        try {
          const content = await readFile(packagePath, 'utf8');
          const packageInfo = JSON.parse(content);
          // Verify this is the MCP package
          if (packageInfo.name === '@specverse/mcp') {
            return packageInfo.version;
          }
        } catch {
          continue;
        }
      }
      
      // Method 2: Try npm installed package resolution
      try {
        const { createRequire } = await import('module');
        const require = createRequire(import.meta.url);
        const packageInfo = require('@specverse/mcp/package.json');
        return packageInfo.version;
      } catch {
        // Method 3: Try import.meta.resolve (newer Node versions)
        try {
          const packageJsonUrl = import.meta.resolve('@specverse/mcp/package.json');
          const content = await readFile(new URL(packageJsonUrl), 'utf8');
          const packageInfo = JSON.parse(content);
          return packageInfo.version;
        } catch {
          // Fallback to environment variable or unknown
          return process.env.MCP_VERSION || 'unknown';
        }
      }
    } catch {
      // Final fallback
      return process.env.MCP_VERSION || 'unknown';
    }
  }

  /**
   * Execute MCP-specific debug tool
   */
  private async executeMCPDebugTool(verbose: boolean): Promise<MCPToolResult> {
    try {
      const mcpVersion = await this.getMCPVersion();
      
      const diagnostics: any = {
        timestamp: new Date().toISOString(),
        mcp_server: {
          version: mcpVersion,
          mode: 'diagnostic'
        }
      };

      // Get SpecVerse installation info
      try {
        const { resolvePackageRoot } = specverseAPI;
        const packageRoot = resolvePackageRoot();
        
        // Read package.json for version info
        const { readFile } = await import('fs/promises');
        const { join } = await import('path');
        const packageJsonPath = join(packageRoot, 'package.json');
        const packageContent = await readFile(packageJsonPath, 'utf8');
        const packageData = JSON.parse(packageContent);

        diagnostics.specverse_installation = {
          type: 'npm_package',
          version: packageData.version,
          location: packageRoot,
          package_name: packageData.name,
          status: 'found'
        };
      } catch (error) {
        diagnostics.specverse_installation = {
          status: 'error',
          error: error instanceof Error ? error.message : String(error)
        };
      }

      // CLI detection
      diagnostics.cli_detection = {
        cli_path: this.cliPath,
        working_directory: this.workingDirectory || process.cwd(),
        status: this.cliPath ? 'found' : 'not_found'
      };

      // Health check
      diagnostics.health_check = {
        can_import_specverse: !!diagnostics.specverse_installation.version,
        cli_accessible: !!this.cliPath,
        capabilities_loaded: !!this.capabilities,
        overall_status: (!!diagnostics.specverse_installation.version && !!this.cliPath) ? 'healthy' : 'degraded'
      };

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(diagnostics, null, 2)
        }]
      };

    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            status: 'error',
            message: 'MCP debug tool execution failed',
            error: error instanceof Error ? error.message : String(error),
            timestamp: new Date().toISOString()
          }, null, 2)
        }],
        isError: true
      };
  }
}
}
