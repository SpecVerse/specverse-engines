/**
 * VSCode Extension Generator
 *
 * Generates a complete VSCode extension package from the SpecVerse spec.
 * - package.json with commands derived from CLI spec + entity types
 * - Ships static assets (tmLanguage, themes, schemas, extension.ts)
 *
 * The spec's ToolsSupport component describes WHAT the extension provides.
 * This generator decides HOW to package it.
 */

import type { TemplateContext } from '@specverse/engine-realize';
import { readFileSync, existsSync, readdirSync, statSync, mkdirSync, writeFileSync, copyFileSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __generatorDir = dirname(fileURLToPath(import.meta.url));

export default function generateVSCodeExtension(context: TemplateContext): string {
  const { spec, outputDir } = context;

  const extensionDir = join(outputDir || '.', 'tools', 'vscode-extension');
  if (!existsSync(extensionDir)) mkdirSync(extensionDir, { recursive: true });

  // 1. Extract CLI commands — from spec if available, otherwise use standard SpecVerse commands
  let cliCommands = extractCLICommands(spec);
  if (cliCommands.length === 0) {
    cliCommands = getStandardCommands();
  }

  // 2. Extract entity types for syntax highlighting keywords
  const entityTypes = extractEntityTypes(spec);

  // 3. Generate package.json
  const packageJson = generatePackageJson(cliCommands, entityTypes);
  writeFileSync(join(extensionDir, 'package.json'), JSON.stringify(packageJson, null, 2) + '\n');

  // 4. Copy static assets
  const staticDir = join(__generatorDir, 'static');
  if (existsSync(staticDir)) {
    copyRecursive(staticDir, extensionDir);
  }

  // 5. Create src directory and copy extension.ts
  const srcDir = join(extensionDir, 'src');
  if (!existsSync(srcDir)) mkdirSync(srcDir, { recursive: true });
  const extTs = join(staticDir, 'extension.ts');
  if (existsSync(extTs)) {
    copyFileSync(extTs, join(srcDir, 'extension.ts'));
  }

  // 6. Generate build script
  const buildScript = `const esbuild = require('esbuild');
esbuild.build({
  entryPoints: ['src/extension.ts'],
  bundle: true,
  outfile: 'dist/extension.js',
  external: ['vscode'],
  format: 'cjs',
  platform: 'node',
}).catch(() => process.exit(1));
`;
  const scriptsDir = join(extensionDir, 'scripts');
  if (!existsSync(scriptsDir)) mkdirSync(scriptsDir, { recursive: true });
  writeFileSync(join(scriptsDir, 'build.js'), buildScript);

  return `VSCode extension generated in: ${extensionDir}\n  ${cliCommands.length} commands, ${entityTypes.length} entity keywords`;
}

function extractCLICommands(spec: any): Array<{ command: string; title: string; category: string }> {
  const commands: Array<{ command: string; title: string; category: string }> = [];

  // Walk components looking for CLI commands section
  // Handles both object form (raw spec: components.CLI.commands) and array form (inferred)
  const components = spec?.components || {};
  const componentList = Array.isArray(components) ? components : Object.entries(components).map(([name, data]) => ({ name, ...(data as any) }));

  for (const comp of componentList) {
    const cliCommands = (comp as any)?.commands;
    if (!cliCommands) continue;

    for (const [rootName, rootDef] of Object.entries(cliCommands as Record<string, any>)) {
      const subcommands = (rootDef as any)?.subcommands || {};
      for (const [subName, subDef] of Object.entries(subcommands as Record<string, any>)) {
        const sub = subDef as any;
        const nestedSubs = sub?.subcommands;
        if (nestedSubs) {
          for (const [nestedName, nestedDef] of Object.entries(nestedSubs as Record<string, any>)) {
            commands.push({
              command: `specverse.${subName}.${nestedName}`,
              title: `${capitalize(subName)} ${capitalize(nestedName)}: ${(nestedDef as any).description || ''}`,
              category: 'SpecVerse',
            });
          }
        } else {
          commands.push({
            command: `specverse.${subName}`,
            title: `${capitalize(subName)}: ${sub.description || ''}`,
            category: 'SpecVerse',
          });
        }
      }
    }
  }

  return commands;
}

function extractEntityTypes(spec: any): string[] {
  const types = new Set<string>();
  const components = spec?.components || [];
  for (const component of Array.isArray(components) ? components : Object.values(components)) {
    const comp = component as any;
    const models = comp?.models;
    if (models) {
      if (Array.isArray(models)) {
        models.forEach((m: any) => types.add(m.name));
      } else {
        Object.keys(models).forEach(name => types.add(name));
      }
    }
  }
  return [...types];
}

function generatePackageJson(
  commands: Array<{ command: string; title: string; category: string }>,
  _entityTypes: string[]
) {
  return {
    name: 'specverse',
    displayName: 'SpecVerse',
    description: 'SpecVerse specification language support — syntax highlighting, validation, IntelliSense',
    version: '3.5.2',
    publisher: 'specverse',
    engines: { vscode: '^1.80.0' },
    categories: ['Programming Languages', 'Linters', 'Snippets'],
    activationEvents: ['onLanguage:specverse'],
    main: './dist/extension.js',
    contributes: {
      languages: [{
        id: 'specverse',
        aliases: ['SpecVerse', 'specly'],
        extensions: ['.specly', '.specverse'],
        configuration: './language-configuration.json',
      }],
      grammars: [{
        language: 'specverse',
        scopeName: 'source.specverse',
        path: './syntaxes/specverse.tmLanguage.json',
      }],
      jsonValidation: [{
        fileMatch: ['*.specly', '*.specverse'],
        url: './schemas/specverse-v3-schema.json',
      }],
      themes: [
        { label: 'SpecVerse Dark', uiTheme: 'vs-dark', path: './themes/specverse-complete-theme.json' },
        { label: 'SpecVerse Basic', uiTheme: 'vs-dark', path: './themes/specverse-basic-theme.json' },
      ],
      commands: commands.map(c => ({
        command: c.command,
        title: c.title,
        category: c.category,
      })),
    },
    scripts: {
      'vscode:prepublish': 'npm run build',
      build: 'node scripts/build.js',
      package: 'npx @vscode/vsce package',
    },
    devDependencies: {
      '@types/vscode': '^1.80.0',
      '@vscode/vsce': '^3.0.0',
      esbuild: '^0.19.0',
    },
  };
}

function copyRecursive(src: string, dest: string) {
  for (const entry of readdirSync(src)) {
    if (entry === 'extension.ts') continue; // Handled separately into src/
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

function getStandardCommands(): Array<{ command: string; title: string; category: string }> {
  return [
    { command: 'specverse.validate', title: 'Validate specification', category: 'SpecVerse' },
    { command: 'specverse.infer', title: 'Infer full architecture', category: 'SpecVerse' },
    { command: 'specverse.realize', title: 'Generate code from specification', category: 'SpecVerse' },
    { command: 'specverse.init', title: 'Initialize new project', category: 'SpecVerse' },
    { command: 'specverse.gen.diagrams', title: 'Generate Mermaid diagrams', category: 'SpecVerse' },
    { command: 'specverse.gen.docs', title: 'Generate documentation', category: 'SpecVerse' },
    { command: 'specverse.gen.uml', title: 'Generate UML diagrams', category: 'SpecVerse' },
    { command: 'specverse.dev.format', title: 'Format .specly file', category: 'SpecVerse' },
    { command: 'specverse.dev.watch', title: 'Watch and validate on change', category: 'SpecVerse' },
    { command: 'specverse.dev.quick', title: 'Quick validation', category: 'SpecVerse' },
    { command: 'specverse.cache', title: 'Manage import cache', category: 'SpecVerse' },
    { command: 'specverse.ai.docs', title: 'Generate AI implementation prompt', category: 'SpecVerse' },
    { command: 'specverse.ai.suggest', title: 'Get spec improvement suggestions', category: 'SpecVerse' },
    { command: 'specverse.ai.template', title: 'Load AI prompt template', category: 'SpecVerse' },
  ];
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
