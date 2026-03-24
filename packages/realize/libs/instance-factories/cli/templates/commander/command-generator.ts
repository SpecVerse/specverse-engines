/**
 * Command Generator
 *
 * Generates individual command files from command specifications.
 * Each command registers itself on a Commander program and wires
 * to its corresponding service for business logic delegation.
 */

import type { TemplateContext } from '@specverse/engine-realize';

/**
 * Generate a single command file.
 * Called once per command in the spec.
 */
export default function generateCommand(context: TemplateContext): string {
  const { command } = context;

  if (!command) {
    throw new Error('Command is required in template context');
  }

  const name = command.name;
  const description = command.description || '';
  const args = command.arguments || {};
  const flags = command.flags || {};
  const exitCodes = command.exitCodes || {};
  const subcommands = command.subcommands || {};
  const serviceRef = command.serviceRef;

  // Build positional argument string for Commander
  const positionalArgs = Object.entries(args)
    .filter(([_, arg]: [string, any]) => arg.positional)
    .sort((a: any, b: any) => (a[1].position || 0) - (b[1].position || 0))
    .map(([argName, arg]: [string, any]) => {
      const required = arg.required;
      return required ? `<${argName}>` : `[${argName}]`;
    })
    .join(' ');

  const commandStr = positionalArgs ? `${name} ${positionalArgs}` : name;

  // Build options
  const optionDefs = Object.entries(flags).map(([flagName, flag]: [string, any]) => {
    const alias = flag.alias ? `${flag.alias}, ` : '';
    const flagType = flag.type?.toLowerCase();
    const valuePart = flagType === 'boolean' ? '' : ` <${flagName.replace(/^--/, '')}>`;
    const defaultVal = flag.default !== undefined ? `, ${JSON.stringify(flag.default)}` : '';
    const desc = flag.description || `${flagName} option`;
    return `    .option('${alias}${flagName}${valuePart}', '${desc}'${defaultVal})`;
  });

  // Build type interface for options
  const optionTypes = Object.entries(flags).map(([flagName, flag]: [string, any]) => {
    const tsType = mapFlagTypeToTS(flag.type);
    const key = flagName.replace(/^--/, '').replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
    return `  ${key}${flag.required ? '' : '?'}: ${tsType};`;
  });

  // Build positional arg types
  const argTypes = Object.entries(args)
    .filter(([_, arg]: [string, any]) => arg.positional)
    .map(([argName, arg]: [string, any]) => {
      const tsType = mapArgTypeToTS(arg.type);
      return `${argName}: ${tsType}`;
    });

  // Generate action handler
  const actionParams = argTypes.length > 0
    ? argTypes.join(', ') + ', options: CommandOptions'
    : 'options: CommandOptions';

  // Generate exit code comments
  const exitCodeComments = Object.entries(exitCodes).length > 0
    ? Object.entries(exitCodes).map(([code, meaning]) =>
        `  //   ${code}: ${meaning}`
      ).join('\n')
    : '';

  // Handle subcommands
  const hasSubcommands = Object.keys(subcommands).length > 0;
  const subcommandRegistrations = hasSubcommands
    ? generateSubcommandRegistrations(name, subcommands)
    : '';

  // Service import
  const serviceImport = serviceRef
    ? `import { ${serviceRef} } from '../services/${serviceRef}.js';`
    : '';

  // Collect engine imports — deduplicate across parent and subcommand handlers
  const allImportSets: string[] = [];
  if (ENGINE_HANDLERS[name]?.imports) allImportSets.push(ENGINE_HANDLERS[name].imports);
  if (hasSubcommands) {
    for (const subName of Object.keys(subcommands)) {
      const key = `${name}.${subName}`;
      if (ENGINE_HANDLERS[key]?.imports) allImportSets.push(ENGINE_HANDLERS[key].imports);
    }
  }
  const engineImports = deduplicateImports(allImportSets);

  return `/**
 * ${name} command
 * ${description}
 * Generated from SpecVerse specification
 */

import { Command } from 'commander';
${serviceImport}
${engineImports}

interface CommandOptions {
${optionTypes.length > 0 ? optionTypes.join('\n') : '  [key: string]: any;'}
}

${exitCodeComments ? `/**\n * Exit codes:\n${exitCodeComments}\n */` : ''}

/**
 * Register the ${name} command on the program.
 */
export function register${capitalize(name)}Command(program: Command): void {
  ${hasSubcommands ? generateCommandWithSubcommands(name, description, subcommands, optionDefs) : generateLeafCommand(name, description, commandStr, optionDefs, actionParams, serviceRef, exitCodes)}
}
${subcommandRegistrations}
`;
}

/**
 * Engine-wired command handlers for known SpecVerse commands.
 * Each generates the action body that calls the actual engine.
 * Unknown commands get a stub.
 */
const ENGINE_HANDLERS: Record<string, { imports: string; handler: string }> = {
  validate: {
    imports: `import { readFileSync, existsSync } from 'fs';
import { EngineRegistry } from '@specverse/engine-entities';
import type { ParserEngine } from '@specverse/types';`,
    handler: `if (!existsSync(file)) {
          console.error('File not found:', file);
          process.exit(1);
        }

        // Discover and initialize parser engine
        const registry = new EngineRegistry();
        await registry.discover();
        const parser = registry.getEngineForCapability('parse') as ParserEngine;
        if (!parser) {
          console.error('No parser engine found. Install @specverse/engine-parser.');
          process.exit(1);
        }
        await parser.initialize();

        const content = readFileSync(file, 'utf8');
        const result = parser.parseContent(content, file);

        if (result.errors.length > 0) {
          console.error('Validation failed');
          result.errors.forEach((e: string) => console.error(' ', e));
          if (result.warnings && result.warnings.length > 0) {
            console.warn('Warnings:');
            result.warnings.forEach((w: string) => console.warn(' ', w));
          }
          process.exit(1);
        }

        if (options.json) {
          console.log(JSON.stringify({ valid: true, warnings: result.warnings }, null, 2));
        } else {
          console.log('Validation successful');
          if (result.warnings && result.warnings.length > 0) {
            console.warn('Warnings:');
            result.warnings.forEach((w: string) => console.warn(' ', w));
          }
        }`
  },
  infer: {
    imports: `import { readFileSync, writeFileSync, existsSync } from 'fs';
import { EngineRegistry } from '@specverse/engine-entities';
import type { ParserEngine, InferenceEngine } from '@specverse/types';`,
    handler: `if (!existsSync(file)) {
          console.error('File not found:', file);
          process.exit(1);
        }

        console.log('Running inference on', file, '...');

        // Discover engines
        const registry = new EngineRegistry();
        await registry.discover();

        const parser = registry.getEngineForCapability('parse') as ParserEngine;
        if (!parser) { console.error('No parser engine found.'); process.exit(1); }
        await parser.initialize();

        const inferEngine = registry.getEngineForCapability('infer') as InferenceEngine;
        if (!inferEngine) { console.error('No inference engine found.'); process.exit(1); }
        await inferEngine.initialize({ options: { verbose: options.verbose } });

        const content = readFileSync(file, 'utf8');
        const parseResult = parser.parseContent(content, file);

        if (parseResult.errors.length > 0) {
          console.error('Cannot infer from invalid specification:');
          parseResult.errors.forEach((e: string) => console.error(' ', e));
          process.exit(1);
        }

        const ast = parseResult.ast!;
        const inferResult = await inferEngine.infer(ast, {
          generateControllers: true,
          generateServices: true,
          generateEvents: true,
          generateViews: true,
          generateDeployment: options.deployment || false,
          verbose: options.verbose || false,
        });

        const outputFile = options.output || file.replace(/\\.specly$/, '-inferred.specly');
        writeFileSync(outputFile, inferResult.yaml, 'utf8');
        console.log('Inferred specification written to:', outputFile);`
  },
  realize: {
    imports: `import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { EngineRegistry } from '@specverse/engine-entities';
import type { ParserEngine, RealizeEngine } from '@specverse/types';`,
    handler: `if (!existsSync(file)) {
          console.error('File not found:', file);
          process.exit(1);
        }

        const __fn = fileURLToPath(import.meta.url);
        const __dn = dirname(__fn);
        const schemaPath = resolve(__dn, '../../../schema/SPECVERSE-SCHEMA.json');

        // Discover engines
        const registry = new EngineRegistry();
        await registry.discover();

        // Parse the spec
        const parser = registry.getEngineForCapability('parse') as ParserEngine;
        if (!parser) { console.error('No parser engine found.'); process.exit(1); }
        const schema = existsSync(schemaPath) ? JSON.parse(readFileSync(schemaPath, 'utf8')) : {};
        await parser.initialize({ schema });

        // Infer full architecture
        const inferEngine = registry.getEngineForCapability('infer') as any;
        if (!inferEngine) { console.error('No inference engine found.'); process.exit(1); }
        await inferEngine.initialize();

        const content = readFileSync(file, 'utf8');
        const parseResult = parser.parseContent(content, file);
        if (parseResult.errors.length > 0) {
          console.error('Invalid spec:');
          parseResult.errors.forEach((e: string) => console.error(' ', e));
          process.exit(1);
        }

        const inferResult = await inferEngine.infer(parseResult.ast!, {
          generateControllers: true, generateServices: true,
          generateEvents: true, generateViews: true,
        });

        // Load AI-optimized spec from inferred YAML
        const yaml = await import('js-yaml');
        const inferredSpec = yaml.load(inferResult.yaml);

        // Initialize realize engine with manifest
        const realizeEngine = registry.getEngineForCapability('realize') as RealizeEngine;
        if (!realizeEngine) { console.error('No realize engine found.'); process.exit(1); }
        const manifestPath = options.manifest || resolve(process.cwd(), 'manifests/implementation.yaml');
        if (!existsSync(manifestPath)) {
          console.error('Manifest not found:', manifestPath);
          process.exit(1);
        }
        await realizeEngine.initialize({ manifestPath, workingDir: process.cwd() });

        const outputDir = options.output || resolve(process.cwd(), 'generated/code');
        console.log('Realizing ' + type + ' from ' + file + '...');
        await (realizeEngine as any).realizeAll(inferredSpec, outputDir);`
  },
  init: {
    imports: ``,
    handler: `if (options.list) {
          console.log('Available templates: default, backend-only, frontend-only, full-stack');
          return;
        }
        // Delegate to specverse init
        const { execSync } = await import('child_process');
        const templateFlag = options.template ? '--template ' + options.template : '';
        const nameArg = name || 'my-project';
        execSync('specverse init ' + nameArg + ' ' + templateFlag, { stdio: 'inherit' });`
  },
  // === gen subcommands ===
  'gen.diagrams': {
    imports: `import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, dirname, basename, join } from 'path';
import { fileURLToPath } from 'url';
import { EngineRegistry } from '@specverse/engine-entities';
import type { ParserEngine } from '@specverse/types';`,
    handler: `const __fn = fileURLToPath(import.meta.url);
        const __dn = dirname(__fn);
        const schemaPath = resolve(__dn, '../../../schema/SPECVERSE-SCHEMA.json');

        const registry = new EngineRegistry();
        await registry.discover();
        const parser = registry.getEngineForCapability('parse') as ParserEngine;
        if (!parser) { console.error('No parser engine found.'); process.exit(1); }
        const schema = existsSync(schemaPath) ? JSON.parse(readFileSync(schemaPath, 'utf8')) : {};
        await parser.initialize({ schema });

        const content = readFileSync(file, 'utf8');
        const parseResult = parser.parseContent(content, file);
        if (parseResult.errors.length > 0) {
          console.error('Invalid spec:');
          parseResult.errors.forEach((e: string) => console.error(' ', e));
          process.exit(1);
        }

        const gen = registry.getEngineForCapability('generate-diagrams') as any;
        if (!gen) { console.error('No generators engine found.'); process.exit(1); }
        await gen.initialize();

        const diagrams = await gen.generateDiagrams(parseResult.ast!, { type: options.type || 'all' });
        const outputDir = options.output || basename(file, '.specly') + '-diagrams';
        if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });
        for (const [diagramType, diagramContent] of diagrams.entries()) {
          writeFileSync(join(outputDir, diagramType + '.mmd'), diagramContent);
          console.log('  ' + diagramType);
        }
        console.log('Generated ' + diagrams.size + ' diagrams in: ' + outputDir);`
  },
  'gen.docs': {
    imports: `import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname, basename } from 'path';
import { fileURLToPath } from 'url';
import { EngineRegistry } from '@specverse/engine-entities';
import type { ParserEngine } from '@specverse/types';`,
    handler: `const __fn = fileURLToPath(import.meta.url);
        const __dn = dirname(__fn);
        const schemaPath = resolve(__dn, '../../../schema/SPECVERSE-SCHEMA.json');

        const registry = new EngineRegistry();
        await registry.discover();
        const parser = registry.getEngineForCapability('parse') as ParserEngine;
        if (!parser) { console.error('No parser engine found.'); process.exit(1); }
        const schema = existsSync(schemaPath) ? JSON.parse(readFileSync(schemaPath, 'utf8')) : {};
        await parser.initialize({ schema });

        const content = readFileSync(file, 'utf8');
        const parseResult = parser.parseContent(content, file);
        if (parseResult.errors.length > 0) {
          console.error('Invalid spec:');
          parseResult.errors.forEach((e: string) => console.error(' ', e));
          process.exit(1);
        }

        const gen = registry.getEngineForCapability('generate-docs') as any;
        if (!gen) { console.error('No generators engine found.'); process.exit(1); }
        await gen.initialize();

        const docs = await gen.generateDocs(parseResult.ast!, { format: options.format || 'markdown' });
        const ext = options.format === 'html' ? '.html' : '.md';
        const outputFile = options.output || basename(file, '.specly') + '-docs' + ext;
        writeFileSync(outputFile, docs);
        console.log('Documentation generated: ' + outputFile);`
  },
  'gen.uml': {
    imports: `import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname, basename } from 'path';
import { fileURLToPath } from 'url';
import { EngineRegistry } from '@specverse/engine-entities';
import type { ParserEngine } from '@specverse/types';`,
    handler: `const __fn = fileURLToPath(import.meta.url);
        const __dn = dirname(__fn);
        const schemaPath = resolve(__dn, '../../../schema/SPECVERSE-SCHEMA.json');

        const registry = new EngineRegistry();
        await registry.discover();
        const parser = registry.getEngineForCapability('parse') as ParserEngine;
        if (!parser) { console.error('No parser engine found.'); process.exit(1); }
        const schema = existsSync(schemaPath) ? JSON.parse(readFileSync(schemaPath, 'utf8')) : {};
        await parser.initialize({ schema });

        const content = readFileSync(file, 'utf8');
        const parseResult = parser.parseContent(content, file);
        if (parseResult.errors.length > 0) {
          console.error('Invalid spec:');
          parseResult.errors.forEach((e: string) => console.error(' ', e));
          process.exit(1);
        }

        const gen = registry.getEngineForCapability('generate-uml') as any;
        if (!gen) { console.error('No generators engine found.'); process.exit(1); }
        await gen.initialize();

        const uml = await gen.generateUML(parseResult.ast!, { type: options.type || 'all' });
        const outputFile = basename(file, '.specly') + '-uml.puml';
        writeFileSync(outputFile, uml);
        console.log('UML generated: ' + outputFile);`
  },
  // === dev subcommands ===
  'dev.format': {
    imports: `import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { EngineRegistry } from '@specverse/engine-entities';
import type { ParserEngine } from '@specverse/types';`,
    handler: `const __fn = fileURLToPath(import.meta.url);
        const __dn = dirname(__fn);
        const schemaPath = resolve(__dn, '../../../schema/SPECVERSE-SCHEMA.json');

        const registry = new EngineRegistry();
        await registry.discover();
        const parser = registry.getEngineForCapability('parse') as ParserEngine;
        if (!parser) { console.error('No parser engine found.'); process.exit(1); }
        const schema = existsSync(schemaPath) ? JSON.parse(readFileSync(schemaPath, 'utf8')) : {};
        await parser.initialize({ schema });

        const content = readFileSync(file, 'utf8');
        const result = parser.parseContent(content, file);
        if (result.errors.length > 0) {
          console.error('Cannot format invalid spec:');
          result.errors.forEach((e: string) => console.error(' ', e));
          process.exit(1);
        }
        const yaml = await import('js-yaml');
        const formatted = yaml.dump(yaml.load(content), { lineWidth: 120, noRefs: true });
        if (options.write) {
          writeFileSync(file, formatted);
          console.log('Formatted and saved: ' + file);
        } else {
          console.log(formatted);
        }`
  },
  'dev.watch': {
    imports: `import { readFileSync, existsSync, watch } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { EngineRegistry } from '@specverse/engine-entities';
import type { ParserEngine } from '@specverse/types';`,
    handler: `const __fn = fileURLToPath(import.meta.url);
        const __dn = dirname(__fn);
        const schemaPath = resolve(__dn, '../../../schema/SPECVERSE-SCHEMA.json');

        const registry = new EngineRegistry();
        await registry.discover();
        const parser = registry.getEngineForCapability('parse') as ParserEngine;
        if (!parser) { console.error('No parser engine found.'); process.exit(1); }
        const schema = existsSync(schemaPath) ? JSON.parse(readFileSync(schemaPath, 'utf8')) : {};
        await parser.initialize({ schema });

        console.log('Watching ' + file + ' for changes...');
        const doValidate = () => {
          try {
            const c = readFileSync(file, 'utf8');
            const r = parser.parseContent(c, file);
            if (r.errors.length > 0) {
              console.log('[' + new Date().toLocaleTimeString() + '] FAILED');
              r.errors.forEach((e: string) => console.error(' ', e));
            } else {
              console.log('[' + new Date().toLocaleTimeString() + '] Valid');
            }
          } catch (e: any) { console.error('Watch error:', e.message); }
        };
        doValidate();
        watch(file, doValidate);
        await new Promise(() => {});`
  },
  'dev.quick': {
    imports: `import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { EngineRegistry } from '@specverse/engine-entities';
import type { ParserEngine } from '@specverse/types';`,
    handler: `const __fn = fileURLToPath(import.meta.url);
        const __dn = dirname(__fn);
        const schemaPath = resolve(__dn, '../../../schema/SPECVERSE-SCHEMA.json');

        const registry = new EngineRegistry();
        await registry.discover();
        const parser = registry.getEngineForCapability('parse') as ParserEngine;
        if (!parser) { console.error('No parser engine found.'); process.exit(1); }
        const schema = existsSync(schemaPath) ? JSON.parse(readFileSync(schemaPath, 'utf8')) : {};
        await parser.initialize({ schema });

        const content = readFileSync(file, 'utf8');
        const result = parser.parseContent(content, file);
        if (result.errors.length > 0) {
          console.error('Quick check: FAILED');
          result.errors.forEach((e: string) => console.error(' ', e));
          process.exit(1);
        }
        console.log('Quick check: OK');`
  },
  // === cache command (leaf, not subcommand) ===
  cache: {
    imports: `import { EngineRegistry } from '@specverse/engine-entities';
import type { ParserEngine } from '@specverse/types';`,
    handler: `const registry = new EngineRegistry();
        await registry.discover();
        const parser = registry.getEngineForCapability('parse') as ParserEngine;
        if (!parser) { console.error('No parser engine found.'); process.exit(1); }
        await parser.initialize();

        // Access ImportResolver cache via parser
        const resolverModule = await import('@specverse/engine-parser');
        const resolver = new resolverModule.ImportResolver({ basePath: process.cwd() });

        const cacheDir = (resolver as any).getCacheDir ? (resolver as any).getCacheDir() : null;
        if (options.stats) {
          console.log('Cache directory:', cacheDir || 'default');
        } else if (options.list) {
          if (cacheDir) {
            const fs = await import('fs');
            if (fs.existsSync(cacheDir)) {
              const items = fs.readdirSync(cacheDir);
              if (items.length === 0) { console.log('Cache is empty'); }
              else { items.forEach((item: string) => console.log(' ', item)); }
            } else { console.log('Cache directory does not exist'); }
          } else { console.log('No cache directory configured'); }
        } else if (options.clear) {
          if (resolver.clearCache) { resolver.clearCache(); }
          console.log('Cache cleared');
        } else {
          console.log('Use --stats, --list, or --clear');
        }`
  },
  // === ai subcommands ===
  'ai.docs': {
    imports: `import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname, basename } from 'path';
import { fileURLToPath } from 'url';
import { EngineRegistry } from '@specverse/engine-entities';
import type { ParserEngine } from '@specverse/types';`,
    handler: `const __fn = fileURLToPath(import.meta.url);
        const __dn = dirname(__fn);
        const schemaPath = resolve(__dn, '../../../schema/SPECVERSE-SCHEMA.json');

        const registry = new EngineRegistry();
        await registry.discover();
        const parser = registry.getEngineForCapability('parse') as ParserEngine;
        if (!parser) { console.error('No parser engine found.'); process.exit(1); }
        const schema = existsSync(schemaPath) ? JSON.parse(readFileSync(schemaPath, 'utf8')) : {};
        await parser.initialize({ schema });

        const content = readFileSync(file, 'utf8');
        const parseResult = parser.parseContent(content, file);
        if (parseResult.errors.length > 0) {
          console.error('Invalid spec:');
          parseResult.errors.forEach((e: string) => console.error(' ', e));
          process.exit(1);
        }

        const aiEngine = registry.getEngineForCapability('ai-prompts') as any;
        if (!aiEngine) {
          console.error('AI engine not available. Install @specverse/engine-ai.');
          process.exit(1);
        }
        await aiEngine.initialize({ provider: options.provider });
        const prompt = await aiEngine.generatePrompt(parseResult.ast!, { type: 'docs' });
        const outputFile = options.output || basename(file, '.specly') + '-ai-docs.md';
        writeFileSync(outputFile, prompt);
        console.log('AI documentation prompt generated: ' + outputFile);`
  },
  'ai.suggest': {
    imports: `import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { EngineRegistry } from '@specverse/engine-entities';
import type { ParserEngine } from '@specverse/types';`,
    handler: `const __fn = fileURLToPath(import.meta.url);
        const __dn = dirname(__fn);
        const schemaPath = resolve(__dn, '../../../schema/SPECVERSE-SCHEMA.json');

        const registry = new EngineRegistry();
        await registry.discover();
        const parser = registry.getEngineForCapability('parse') as ParserEngine;
        if (!parser) { console.error('No parser engine found.'); process.exit(1); }
        const schema = existsSync(schemaPath) ? JSON.parse(readFileSync(schemaPath, 'utf8')) : {};
        await parser.initialize({ schema });

        const content = readFileSync(file, 'utf8');
        const parseResult = parser.parseContent(content, file);
        if (parseResult.errors.length > 0) {
          console.error('Invalid spec:');
          parseResult.errors.forEach((e: string) => console.error(' ', e));
          process.exit(1);
        }

        const aiEngine = registry.getEngineForCapability('ai-suggestions') as any;
        if (!aiEngine) {
          console.error('AI engine not available. Install @specverse/engine-ai.');
          process.exit(1);
        }
        await aiEngine.initialize();
        const suggestions = await aiEngine.suggest(parseResult.ast!);
        if (suggestions.length === 0) {
          console.log('No suggestions — spec looks good!');
        } else {
          const warnings = suggestions.filter((s: any) => s.severity === 'warning');
          const improvements = suggestions.filter((s: any) => s.severity === 'improvement');
          const info = suggestions.filter((s: any) => s.severity === 'info');
          if (warnings.length > 0) {
            console.log('\\nWarnings:');
            warnings.forEach((s: any) => console.log('  [' + s.target + '] ' + s.description));
          }
          if (improvements.length > 0) {
            console.log('\\nSuggested improvements:');
            improvements.forEach((s: any) => console.log('  [' + s.target + '] ' + s.description));
          }
          if (info.length > 0) {
            console.log('\\nInfo:');
            info.forEach((s: any) => console.log('  [' + s.target + '] ' + s.description));
          }
          console.log('\\n' + suggestions.length + ' suggestion(s): ' + warnings.length + ' warning, ' + improvements.length + ' improvement, ' + info.length + ' info');
        }`
  },
  'ai.template': {
    imports: `import { writeFileSync } from 'fs';
import { EngineRegistry } from '@specverse/engine-entities';`,
    handler: `const registry = new EngineRegistry();
        await registry.discover();
        const aiEngine = registry.getEngineForCapability('ai-templates') as any;
        if (!aiEngine) {
          console.error('AI engine not available. Install @specverse/engine-ai.');
          process.exit(1);
        }
        await aiEngine.initialize();
        const template = await aiEngine.template(operation, { config: options.config });
        if (options.output) {
          writeFileSync(options.output, template);
          console.log('Template written to: ' + options.output);
        } else {
          console.log(template);
        }`
  },
};

function generateLeafCommand(
  name: string,
  description: string,
  commandStr: string,
  optionDefs: string[],
  actionParams: string,
  serviceRef: string | undefined,
  exitCodes: Record<string, string>
): string {
  // Check for engine-wired handler
  const engineHandler = ENGINE_HANDLERS[name];
  const handler = engineHandler
    ? engineHandler.handler
    : serviceRef
      ? `const service = new ${serviceRef}();
      const result = await service.execute(${actionParams.includes(':') ? '{ ' + actionParams.split(',').map(p => p.trim().split(':')[0].trim()).join(', ') + ', ...options }' : 'options'});
      console.log(result);`
      : `console.log('Executing ${name}...');
      // TODO: Wire to service`;

  return `const cmd = program
    .command('${commandStr}')
    .description('${description}')
${optionDefs.join('\n')}
    .action(async (${actionParams}) => {
      try {
        ${handler}
      } catch (error: any) {
        console.error('Error:', error.message);
        process.exit(${Object.keys(exitCodes).find(k => k !== '0') || '1'});
      }
    });`;
}

function generateCommandWithSubcommands(
  name: string,
  description: string,
  subcommands: Record<string, any>,
  optionDefs: string[]
): string {
  const subcmdRegistrations = Object.entries(subcommands).map(([subName, subDef]) => {
    const subDesc = subDef.description || '';
    const subArgs = subDef.arguments || {};
    const subFlags = subDef.flags || {};

    const positionalStr = Object.entries(subArgs)
      .filter(([_, a]: [string, any]) => a.positional)
      .map(([n, a]: [string, any]) => a.required ? `<${n}>` : `[${n}]`)
      .join(' ');

    const subCmdStr = positionalStr ? `${subName} ${positionalStr}` : subName;

    const subOptionDefs = Object.entries(subFlags).map(([flagName, flag]: [string, any]) => {
      const alias = flag.alias ? `${flag.alias}, ` : '';
      const flagType = flag.type?.toLowerCase();
      const valuePart = flagType === 'boolean' ? '' : ` <${flagName.replace(/^--/, '')}>`;
      const defaultVal = flag.default !== undefined ? `, ${JSON.stringify(flag.default)}` : '';
      return `    .option('${alias}${flagName}${valuePart}', '${flag.description || flagName}'${defaultVal})`;
    });

    // Look up engine handler for this subcommand
    const handlerKey = `${name}.${subName}`;
    const engineHandler = ENGINE_HANDLERS[handlerKey];

    // Build action parameters from subcommand args
    const subArgTypes = Object.entries(subArgs)
      .filter(([_, a]: [string, any]) => a.positional)
      .map(([n, a]: [string, any]) => `${n}: ${mapArgTypeToTS(a.type)}`);
    const subActionParams = subArgTypes.length > 0
      ? subArgTypes.join(', ') + ', options: any'
      : 'options: any';

    const handler = engineHandler
      ? engineHandler.handler
      : `console.log('${name} ${subName}: not yet implemented via engine');`;

    return `
  cmd
    .command('${subCmdStr}')
    .description('${subDesc}')
${subOptionDefs.join('\n')}
    .action(async (${subActionParams}) => {
      try {
        ${handler}
      } catch (error: any) {
        console.error('Error:', error.message);
        process.exit(1);
      }
    });`;
  });

  return `const cmd = program
    .command('${name}')
    .description('${description}');
${subcmdRegistrations.join('\n')}`;
}

function generateSubcommandRegistrations(
  _parentName: string,
  _subcommands: Record<string, any>
): string {
  return ''; // Subcommands are registered inline
}

function mapFlagTypeToTS(type: string): string {
  if (!type) return 'string';
  const lower = type.toLowerCase();
  if (lower === 'boolean') return 'boolean';
  if (lower === 'number' || lower === 'integer') return 'number';
  return 'string';
}

function mapArgTypeToTS(type: string): string {
  if (!type) return 'string';
  const lower = type.toLowerCase();
  if (lower === 'filepath' || lower === 'string') return 'string';
  if (lower === 'number' || lower === 'integer') return 'number';
  if (lower === 'boolean') return 'boolean';
  return 'string';
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Deduplicate import statements across multiple handler import blocks.
 * Merges named imports from the same module and removes exact duplicates.
 */
function deduplicateImports(importBlocks: string[]): string {
  const seen = new Map<string, Set<string>>(); // module -> set of named imports
  const typeImports = new Map<string, Set<string>>(); // module -> set of type imports
  const rawLines = new Set<string>(); // non-mergeable lines

  for (const block of importBlocks) {
    for (const line of block.split('\n').map(l => l.trim()).filter(l => l)) {
      // Match: import { X, Y } from 'module';
      const namedMatch = line.match(/^import\s+\{\s*(.+?)\s*\}\s+from\s+'(.+?)';?$/);
      if (namedMatch) {
        const names = namedMatch[1].split(',').map(n => n.trim());
        const mod = namedMatch[2];
        if (!seen.has(mod)) seen.set(mod, new Set());
        names.forEach(n => seen.get(mod)!.add(n));
        continue;
      }
      // Match: import type { X } from 'module';
      const typeMatch = line.match(/^import\s+type\s+\{\s*(.+?)\s*\}\s+from\s+'(.+?)';?$/);
      if (typeMatch) {
        const names = typeMatch[1].split(',').map(n => n.trim());
        const mod = typeMatch[2];
        if (!typeImports.has(mod)) typeImports.set(mod, new Set());
        names.forEach(n => typeImports.get(mod)!.add(n));
        continue;
      }
      rawLines.add(line);
    }
  }

  const result: string[] = [];
  for (const [mod, names] of seen.entries()) {
    result.push(`import { ${[...names].join(', ')} } from '${mod}';`);
  }
  for (const [mod, names] of typeImports.entries()) {
    // Remove type imports that are already in regular imports
    const regularNames = seen.get(mod) || new Set();
    const typeOnly = [...names].filter(n => !regularNames.has(n));
    if (typeOnly.length > 0) {
      result.push(`import type { ${typeOnly.join(', ')} } from '${mod}';`);
    }
  }
  for (const line of rawLines) {
    result.push(line);
  }
  return result.join('\n');
}
