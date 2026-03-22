import { AbstractProcessor } from '@specverse/types';

export interface CommandSpec {
  name: string;
  description?: string;
  arguments?: { [name: string]: CommandArgument };
  flags?: { [name: string]: CommandFlag };
  returns?: string;
  exitCodes?: { [code: number]: string };
  subcommands?: { [name: string]: any };
}

export interface CommandArgument {
  type: string;
  required?: boolean;
  positional?: boolean;
  description?: string;
  default?: any;
}

export interface CommandFlag {
  type: string;
  default?: any;
  description?: string;
  alias?: string;
}

export class CommandProcessor extends AbstractProcessor<any, CommandSpec[]> {
  process(commandsData: any): CommandSpec[] {
    return Object.entries(commandsData).map(([cmdName, cmdDef]: [string, any]) => ({
      name: cmdName,
      description: cmdDef.description,
      arguments: cmdDef.arguments,
      flags: cmdDef.flags,
      returns: cmdDef.returns,
      exitCodes: cmdDef.exitCodes,
      subcommands: cmdDef.subcommands,
    }));
  }
}
