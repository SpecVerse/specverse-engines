/**
 * Models Entity — Generators (Instance Factories)
 *
 * Models generate code through instance factories in the realize system.
 * The primary generators transform model definitions into:
 * - ORM schemas (Prisma, TypeORM)
 * - Database DDL (PostgreSQL, MongoDB, Redis)
 * - Service boilerplate (CRUD services from Prisma)
 *
 * The instance factory YAML files and templates remain in libs/instance-factories/
 * until Phase B. This module declares the generator metadata for the entity registry.
 */

import type { EntityGenerator } from '../../../_shared/types.js';

/**
 * Generator metadata for the models entity.
 *
 * Each generator maps to an instance factory definition (YAML)
 * and its associated templates.
 */
export const modelGenerators: EntityGenerator[] = [
  // ORM generators
  {
    name: 'prisma-schema',
    capability: 'storage.database',
    factoryPath: 'libs/instance-factories/orms/prisma.yaml',
  },

  // Storage generators
  {
    name: 'postgresql',
    capability: 'storage.relational',
    factoryPath: 'libs/instance-factories/storage/postgresql.yaml',
  },
  {
    name: 'mongodb',
    capability: 'storage.document',
    factoryPath: 'libs/instance-factories/storage/mongodb.yaml',
  },
  {
    name: 'redis',
    capability: 'storage.cache',
    factoryPath: 'libs/instance-factories/storage/redis.yaml',
  },
];
