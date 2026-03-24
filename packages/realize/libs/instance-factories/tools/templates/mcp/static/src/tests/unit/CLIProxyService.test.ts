/**
 * CLIProxyService Unit Tests
 * Tests for dynamic CLI integration functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CLIProxyService } from '../../services/CLIProxyService.js';

// Mock both possible import paths (published package and local)
const mockCapabilities = {
  coreCommands: [
    {
      command: 'validate',
      description: 'Validate a SpecVerse specification',
      args: '<file>',
      options: '-v, --verbose'
    },
    {
      command: 'infer',
      description: 'Generate complete specification using AI',
      args: '<file>',
      options: ''
    }
  ],
  groupedCommands: [
    {
      command: 'gen yaml',
      group: 'gen',
      subcommand: 'yaml',
      description: 'Generate YAML from SpecVerse specification',
      args: '<file>',
      category: 'SpecVerse Generation'
    }
  ],
  aiCommands: [
    {
      command: 'ai',
      description: 'AI prompt building commands',
      args: '<action> [operation]',
      options: ''
    },
    {
      command: 'ai template',
      description: 'AI template for SpecVerse specifications',
      args: '<operation>',
      options: ''
    }
  ]
};

const mockAPI = {
  getAllCliCapabilities: vi.fn(() => mockCapabilities),
  executeCliCommand: vi.fn(async (command, args) => {
    if (command.includes('validate')) {
      return {
        status: 'success',
        message: 'Validation successful',
        file: args.file || 'test.specly',
        timestamp: new Date().toISOString()
      };
    }
    throw new Error(`Command not mocked: ${command}`);
  }),
  getCliPath: vi.fn(() => '/mock/path/to/cli') as ReturnType<typeof vi.fn<[], string | null>>
};

// Mock the published package
vi.mock('@specverse/lang', () => mockAPI);

// Mock the local development path
vi.mock('../../../../../dist/index.js', () => mockAPI);

describe('CLIProxyService', () => {
  let service: CLIProxyService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CLIProxyService();
  });

  describe('capability discovery', () => {
    it('should discover CLI capabilities', async () => {
      const capabilities = await service.discoverCapabilities();
      
      expect(capabilities).toHaveProperty('coreCommands');
      expect(capabilities).toHaveProperty('groupedCommands'); 
      expect(capabilities).toHaveProperty('aiCommands');
      expect(capabilities.coreCommands.length).toBeGreaterThan(0);
    });

    it('should cache capabilities for performance', async () => {
      // First call
      await service.discoverCapabilities();
      // Second call (should use cache)
      await service.discoverCapabilities();

      // Should only call once due to caching
      expect(mockAPI.getAllCliCapabilities).toHaveBeenCalledTimes(1);
    });
  });

  describe('MCP tool generation', () => {
    it('should generate MCP tools from CLI capabilities', async () => {
      const tools = await service.generateMCPTools();
      
      expect(tools).toBeInstanceOf(Array);
      expect(tools.length).toBeGreaterThan(0);
      
      // Check tool structure
      const validateTool = tools.find(t => t.name === 'specverse_validate');
      expect(validateTool).toBeDefined();
      expect(validateTool?.description).toContain('Validate');
      expect(validateTool?.inputSchema).toHaveProperty('properties');
    });

    it('should generate AI tools with proper schemas', async () => {
      const tools = await service.generateMCPTools();
      
      const aiTemplateTool = tools.find(t => t.name === 'specverse_ai_template');
      expect(aiTemplateTool).toBeDefined();
      expect(aiTemplateTool?.inputSchema.properties).toHaveProperty('operation');
      expect(aiTemplateTool?.inputSchema.required).toContain('operation');
    });
  });

  describe('command execution', () => {
    it('should execute CLI commands and return structured results', async () => {
      const result = await service.executeCommand('specverse_validate', { file: 'test.specly' });
      
      expect(result).toHaveProperty('content');
      expect(result.content).toBeInstanceOf(Array);
      expect(result.content[0]).toHaveProperty('type', 'text');
      
      // Parse the JSON result
      const textContent = result.content[0].text;
      expect(textContent).toBeDefined();
      const jsonResult = JSON.parse(textContent!);
      expect(jsonResult).toHaveProperty('status', 'success');
      expect(jsonResult).toHaveProperty('file', 'test.specly');
    });

    it('should handle command failures gracefully', async () => {
      const result = await service.executeCommand('specverse_nonexistent', {});
      
      expect(result).toHaveProperty('isError', true);
      expect(result.content[0].text).toContain('error');
    });

    it('should handle CLI not found scenario', async () => {
      // Mock CLI not found
      mockAPI.getCliPath.mockReturnValueOnce(null);

      const serviceWithoutCli = new CLIProxyService();
      const result = await serviceWithoutCli.executeCommand('specverse_validate', {});

      expect(result).toHaveProperty('isError', true);
      expect(result.content[0].text).toContain('CLI not found');
    });
  });

  describe('tool name mapping', () => {
    it('should map MCP tool names back to CLI commands', async () => {
      const service = new CLIProxyService();
      
      // Access private method for testing (TypeScript will complain, but it works)
      const mapMethod = (service as any).mapToolNameToCommand;
      
      expect(mapMethod('specverse_validate')).toBe('validate');
      expect(mapMethod('specverse_gen_yaml')).toBe('gen yaml');
      expect(mapMethod('specverse_ai_template')).toBe('ai template');
    });
  });

  describe('error scenarios', () => {
    it('should handle discovery failures', async () => {
      // Use the already mocked function
      mockAPI.getAllCliCapabilities.mockImplementationOnce(() => {
        throw new Error('Discovery failed');
      });

      const capabilities = await service.discoverCapabilities();

      // Should return empty capabilities on failure
      expect(capabilities.coreCommands).toEqual([]);
      expect(capabilities.groupedCommands).toEqual([]);
      expect(capabilities.aiCommands).toEqual([]);
    });
  });
});