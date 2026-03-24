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

  // Engine-specific imports for known commands
  const engineImports = ENGINE_HANDLERS[name]?.imports || '';

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
    imports: `import { existsSync } from 'fs';
import { resolve } from 'path';`,
    handler: `if (!existsSync(file)) {
          console.error('File not found:', file);
          process.exit(1);
        }

        // Delegate to specverse realize command (engine wiring requires full pipeline)
        const { execSync } = await import('child_process');
        const manifestFlag = options.manifest ? '-m ' + options.manifest : '';
        const outputFlag = options.output ? '-o ' + options.output : '';
        execSync('specverse realize ' + type + ' ' + file + ' ' + outputFlag + ' ' + manifestFlag, { stdio: 'inherit' });`
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

    return `
  cmd
    .command('${subCmdStr}')
    .description('${subDesc}')
${subOptionDefs.join('\n')}
    .action(async (...args: any[]) => {
      try {
        console.log('Executing ${name} ${subName}...');
        // TODO: Wire to service
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
