/**
 * MCP Server Generator
 *
 * Generates a Model Context Protocol server from the SpecVerse spec.
 * Ships the core server framework as static assets, generates tool/resource
 * registration from the spec's ToolsSupport and CLI components.
 */

import type { TemplateContext } from '@specverse/engine-realize';
import { existsSync, mkdirSync, writeFileSync, readdirSync, statSync, copyFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __generatorDir = dirname(fileURLToPath(import.meta.url));

export default function generateMCPServer(context: TemplateContext): string {
  const { spec, outputDir } = context;

  const mcpDir = join(outputDir || '.', 'tools', 'specverse-mcp');
  if (!existsSync(mcpDir)) mkdirSync(mcpDir, { recursive: true });

  // 1. Copy static MCP server framework
  const staticDir = join(__generatorDir, 'static');
  if (existsSync(staticDir)) {
    copyRecursive(staticDir, mcpDir);
  }

  // 2. Generate tool registry from spec
  const tools = extractMCPTools(spec);
  const resources = extractMCPResources(spec);
  const cliCommands = extractCLICommands(spec);

  // 3. Generate a spec-driven registration file
  const registryCode = generateToolRegistry(tools, resources, cliCommands);
  const registryDir = join(mcpDir, 'src', 'generated');
  if (!existsSync(registryDir)) mkdirSync(registryDir, { recursive: true });
  writeFileSync(join(registryDir, 'spec-registry.ts'), registryCode);

  return `MCP server generated in: ${mcpDir}\n  ${tools.length} tools, ${resources.length} resources, ${cliCommands.length} CLI commands`;
}

function extractMCPTools(spec: any): Array<{ name: string; description: string; isEntityTool: boolean }> {
  const tools: Array<{ name: string; description: string; isEntityTool: boolean }> = [];
  const components = spec?.components || [];
  for (const component of Array.isArray(components) ? components : Object.values(components)) {
    const models = (component as any)?.models;
    if (!models) continue;
    const modelList = Array.isArray(models) ? models : Object.entries(models).map(([n, d]) => ({ name: n, ...(d as any) }));
    for (const model of modelList) {
      if (model.name === 'MCPTool') {
        // This is the meta-model — extract default tools from the spec description
        tools.push(
          { name: 'specverse-create', description: 'Create a SpecVerse specification from requirements', isEntityTool: false },
          { name: 'specverse-analyse', description: 'Analyse existing code and extract a specification', isEntityTool: false },
          { name: 'specverse-validate', description: 'Validate a .specly specification', isEntityTool: false },
          { name: 'specverse-realize', description: 'Generate code from a specification', isEntityTool: false },
          { name: 'specverse-suggest', description: 'Get improvement suggestions for a specification', isEntityTool: false },
        );
      }
    }
  }
  if (tools.length === 0) {
    // Default tools if no MCPTool model found
    tools.push(
      { name: 'specverse-validate', description: 'Validate a specification', isEntityTool: false },
      { name: 'specverse-create', description: 'Create a specification', isEntityTool: false },
    );
  }
  return tools;
}

function extractMCPResources(spec: any): Array<{ uri: string; name: string; description: string }> {
  return [
    { uri: 'specverse://schema', name: 'SpecVerse Schema', description: 'JSON Schema for .specly validation' },
    { uri: 'specverse://conventions', name: 'Convention Reference', description: 'Convention syntax patterns' },
    { uri: 'specverse://library-catalog', name: 'Library Catalog', description: 'Available SpecVerse libraries' },
    { uri: 'specverse://prompts', name: 'Prompt Templates', description: 'AI prompt template versions' },
  ];
}

function extractCLICommands(spec: any): string[] {
  const commands: string[] = [];
  const components = spec?.components || [];
  for (const component of Array.isArray(components) ? components : Object.values(components)) {
    const cliCommands = (component as any)?.commands;
    if (!cliCommands) continue;
    for (const [, rootDef] of Object.entries(cliCommands as Record<string, any>)) {
      const subs = (rootDef as any)?.subcommands || {};
      for (const subName of Object.keys(subs)) {
        commands.push(subName);
      }
    }
  }
  return commands;
}

function generateToolRegistry(
  tools: Array<{ name: string; description: string; isEntityTool: boolean }>,
  resources: Array<{ uri: string; name: string; description: string }>,
  cliCommands: string[]
): string {
  return `/**
 * Spec-Driven MCP Registry
 * Generated from SpecVerse self-specification.
 *
 * Tools, resources, and CLI command mappings derived from the spec.
 */

export const SPEC_TOOLS = ${JSON.stringify(tools, null, 2)};

export const SPEC_RESOURCES = ${JSON.stringify(resources, null, 2)};

export const CLI_COMMANDS = ${JSON.stringify(cliCommands, null, 2)};

export function getToolByName(name: string) {
  return SPEC_TOOLS.find(t => t.name === name);
}

export function getResourceByUri(uri: string) {
  return SPEC_RESOURCES.find(r => r.uri === uri);
}
`;
}

function copyRecursive(src: string, dest: string) {
  for (const entry of readdirSync(src)) {
    const srcPath = join(src, entry);
    const destPath = join(dest, entry);
    if (statSync(srcPath).isDirectory()) {
      if (!existsSync(destPath)) mkdirSync(destPath, { recursive: true });
      copyRecursive(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}
