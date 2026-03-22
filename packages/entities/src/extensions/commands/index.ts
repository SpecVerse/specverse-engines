import type { EntityModule, EntityConventionProcessor } from '../../_shared/types.js';
import { CommandProcessor } from './conventions/command-processor.js';
import type { CommandSpec } from './conventions/command-processor.js';
import { commandInferenceRules } from './inference/index.js';
import { commandGenerators } from './generators/index.js';
import { commandDocs } from './docs/index.js';
import { commandTests } from './tests/index.js';

export { CommandProcessor, type CommandSpec } from './conventions/command-processor.js';
export { commandInferenceRules } from './inference/index.js';
export { commandGenerators } from './generators/index.js';
export { commandDocs } from './docs/index.js';
export { commandTests } from './tests/index.js';

function createCommandConventionProcessor(): EntityConventionProcessor<any, CommandSpec[]> {
  return {
    process(input: any): CommandSpec[] {
      const processor = new CommandProcessor({ warnings: [], addWarning(msg: string) { this.warnings.push(msg); } });
      return processor.process(input);
    }
  };
}

export const commandsModule: EntityModule = {
  name: 'commands',
  type: 'extension',
  version: '0.1.0',
  dependsOn: ['models'],
  conventionProcessor: createCommandConventionProcessor(),
  inferenceRules: commandInferenceRules,
  generators: commandGenerators,
  diagramPlugins: [],
  docs: commandDocs,
  tests: commandTests,
};

export default commandsModule;
