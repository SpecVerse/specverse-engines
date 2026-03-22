/**
 * Command Generator
 *
 * Generates individual command files from command specifications.
 * Each command registers itself on a Commander program and wires
 * to its corresponding service for business logic delegation.
 */
/**
 * Generate a single command file.
 * Called once per command in the spec.
 */
export default function generateCommand(context) {
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
        .filter(([_, arg]) => arg.positional)
        .sort((a, b) => (a[1].position || 0) - (b[1].position || 0))
        .map(([argName, arg]) => {
        const required = arg.required;
        return required ? `<${argName}>` : `[${argName}]`;
    })
        .join(' ');
    const commandStr = positionalArgs ? `${name} ${positionalArgs}` : name;
    // Build options
    const optionDefs = Object.entries(flags).map(([flagName, flag]) => {
        const alias = flag.alias ? `${flag.alias}, ` : '';
        const flagType = flag.type?.toLowerCase();
        const valuePart = flagType === 'boolean' ? '' : ` <${flagName.replace(/^--/, '')}>`;
        const defaultVal = flag.default !== undefined ? `, ${JSON.stringify(flag.default)}` : '';
        const desc = flag.description || `${flagName} option`;
        return `    .option('${alias}${flagName}${valuePart}', '${desc}'${defaultVal})`;
    });
    // Build type interface for options
    const optionTypes = Object.entries(flags).map(([flagName, flag]) => {
        const tsType = mapFlagTypeToTS(flag.type);
        const key = flagName.replace(/^--/, '').replace(/-([a-z])/g, (_, c) => c.toUpperCase());
        return `  ${key}${flag.required ? '' : '?'}: ${tsType};`;
    });
    // Build positional arg types
    const argTypes = Object.entries(args)
        .filter(([_, arg]) => arg.positional)
        .map(([argName, arg]) => {
        const tsType = mapArgTypeToTS(arg.type);
        return `${argName}: ${tsType}`;
    });
    // Generate action handler
    const actionParams = argTypes.length > 0
        ? argTypes.join(', ') + ', options: CommandOptions'
        : 'options: CommandOptions';
    // Generate exit code comments
    const exitCodeComments = Object.entries(exitCodes).length > 0
        ? Object.entries(exitCodes).map(([code, meaning]) => `  //   ${code}: ${meaning}`).join('\n')
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
    return `/**
 * ${name} command
 * ${description}
 * Generated from SpecVerse specification
 */

import { Command } from 'commander';
${serviceImport}

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
function generateLeafCommand(name, description, commandStr, optionDefs, actionParams, serviceRef, exitCodes) {
    const handler = serviceRef
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
function generateCommandWithSubcommands(name, description, subcommands, optionDefs) {
    const subcmdRegistrations = Object.entries(subcommands).map(([subName, subDef]) => {
        const subDesc = subDef.description || '';
        const subArgs = subDef.arguments || {};
        const subFlags = subDef.flags || {};
        const positionalStr = Object.entries(subArgs)
            .filter(([_, a]) => a.positional)
            .map(([n, a]) => a.required ? `<${n}>` : `[${n}]`)
            .join(' ');
        const subCmdStr = positionalStr ? `${subName} ${positionalStr}` : subName;
        const subOptionDefs = Object.entries(subFlags).map(([flagName, flag]) => {
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
function generateSubcommandRegistrations(_parentName, _subcommands) {
    return ''; // Subcommands are registered inline
}
function mapFlagTypeToTS(type) {
    if (!type)
        return 'string';
    const lower = type.toLowerCase();
    if (lower === 'boolean')
        return 'boolean';
    if (lower === 'number' || lower === 'integer')
        return 'number';
    return 'string';
}
function mapArgTypeToTS(type) {
    if (!type)
        return 'string';
    const lower = type.toLowerCase();
    if (lower === 'filepath' || lower === 'string')
        return 'string';
    if (lower === 'number' || lower === 'integer')
        return 'number';
    if (lower === 'boolean')
        return 'boolean';
    return 'string';
}
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
//# sourceMappingURL=command-generator.js.map