/**
 * Views Entity — Generators (Instance Factories)
 *
 * Views generate code through instance factories in the realize system.
 * The primary generator transforms view definitions into:
 * - React components (forms, lists, detail views, dashboards)
 *
 * The instance factory YAML files and templates remain in libs/instance-factories/
 * until Phase B. This module declares the generator metadata for the entity registry.
 */

import type { EntityGenerator } from '../../../_shared/types.js';

/**
 * Generator metadata for the views entity.
 *
 * Each generator maps to an instance factory definition (YAML)
 * and its associated templates.
 */
export const viewGenerators: EntityGenerator[] = [
  {
    name: 'react-components',
    capability: 'ui.components',
    factoryPath: 'libs/instance-factories/views/react-components.yaml',
  },
];
