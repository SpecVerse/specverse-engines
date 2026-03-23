/**
 * CLI Entry Point Generator
 *
 * Generates the main CLI entry point that registers all commands from the spec.
 * Uses Commander.js for argument parsing, help text, and command routing.
 */
/**
 * Generate the CLI entry point from the commands spec.
 */
export default function generateCLIEntry(context) {
    const { spec } = context;
    // Extract commands from spec — could be in spec.commands or in a component's commands section
    const commands = extractCommands(spec);
    if (commands.length === 0) {
        return generateMinimalCLI(spec);
    }
    // Find the root command (usually the app name)
    const rootCommand = commands[0];
    const subcommands = rootCommand.subcommands
        ? Object.entries(rootCommand.subcommands)
        : [];
    const imports = subcommands.map(([name, _]) => `import { register${capitalize(name)}Command } from './commands/${name}.js';`).join('\n');
    const registrations = subcommands.map(([name, _]) => `  register${capitalize(name)}Command(program);`).join('\n');
    // Get version from spec
    const version = spec.version || spec.components?.[0]?.version || '1.0.0';
    return `#!/usr/bin/env node
/**
 * ${rootCommand.description || 'CLI Application'}
 * Generated from SpecVerse specification
 */

import { Command } from 'commander';
${imports}

const program = new Command();

program
  .name('${rootCommand.name}')
  .description('${rootCommand.description || ''}')
  .version('${version}');

// Register all commands
${registrations}

// Parse and execute
program.parseAsync(process.argv).catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
`;
}
/**
 * Extract commands from the spec.
 * Checks spec.commands, then each component's commands section.
 */
function extractCommands(spec) {
    // Direct commands on spec
    if (spec.commands) {
        if (Array.isArray(spec.commands))
            return spec.commands;
        return Object.entries(spec.commands).map(([name, def]) => ({
            name,
            ...def
        }));
    }
    // Check components for commands sections
    const components = spec.components || [];
    const componentList = Array.isArray(components)
        ? components
        : Object.entries(components).map(([name, c]) => ({ name, ...c }));
    for (const comp of componentList) {
        if (comp.commands) {
            if (Array.isArray(comp.commands))
                return comp.commands;
            return Object.entries(comp.commands).map(([name, def]) => ({
                name,
                ...def
            }));
        }
    }
    return [];
}
/**
 * Generate a minimal CLI when no commands are found.
 */
function generateMinimalCLI(spec) {
    return `#!/usr/bin/env node
/**
 * CLI Application
 * Generated from SpecVerse specification
 */

import { Command } from 'commander';

const program = new Command();

program
  .name('app')
  .description('Generated CLI application')
  .version('1.0.0');

program
  .command('status')
  .description('Show application status')
  .action(() => {
    console.log('Application is running');
  });

program.parseAsync(process.argv);
`;
}
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
//# sourceMappingURL=cli-entry-generator.js.map