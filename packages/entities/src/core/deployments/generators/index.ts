/**
 * Deployments Entity — Generators (Instance Factories)
 *
 * Deployments generate infrastructure artifacts through instance factories
 * in the realize system. The primary generators transform deployment
 * definitions into:
 * - Docker Compose / Kubernetes manifests
 * - Infrastructure-as-code configurations
 *
 * The instance factory YAML files and templates remain in libs/instance-factories/
 * until Phase B. This module declares the generator metadata for the entity registry.
 */

import type { EntityGenerator } from '../../../_shared/types.js';

/**
 * Generator metadata for the deployments entity.
 *
 * Each generator maps to an instance factory definition (YAML)
 * and its associated templates.
 */
export const deploymentGenerators: EntityGenerator[] = [
  {
    name: 'docker-k8s',
    capability: 'infrastructure.deployment',
    factoryPath: 'libs/instance-factories/infrastructure/docker-k8s.yaml',
  },
];
