/**
 * Entity Module Bootstrap
 *
 * Registers all core and built-in extension entity modules with the entity registry
 * in dependency order. This is the single entry point for initializing the entity
 * module system.
 *
 * Call bootstrapEntityModules() at application startup (parser init, CLI init, etc.)
 * to make all entity modules available through the registry.
 *
 * External extension entities (from node_modules/@specverse/entity-*) will be
 * discovered and registered after built-in modules in a future phase.
 */

import { getEntityRegistry, type EntityRegistry } from './_registry.js';

// Core entity modules — imported in dependency order
import { modelsModule } from './core/models/index.js';
import { controllersModule } from './core/controllers/index.js';
import { servicesModule } from './core/services/index.js';
import { eventsModule } from './core/events/index.js';
import { viewsModule } from './core/views/index.js';
import { deploymentsModule } from './core/deployments/index.js';

// Extension entity modules — built-in extensions (shipped with specverse-lang)
import { commandsModule } from './extensions/commands/index.js';
import { measuresModule } from './extensions/measures/index.js';
import { conventionsModule } from './extensions/conventions/index.js';

/**
 * All core entity modules in dependency order.
 */
const CORE_MODULES = [
  modelsModule,
  controllersModule,
  servicesModule,
  eventsModule,
  viewsModule,
  deploymentsModule,
];

/**
 * Built-in extension entity modules.
 * These ship with specverse-lang but are structurally identical
 * to external extensions distributed via npm.
 */
const EXTENSION_MODULES = [
  commandsModule,
  measuresModule,
  conventionsModule,
];

/**
 * Bootstrap the entity module system by registering all core and
 * built-in extension modules.
 *
 * Safe to call multiple times — skips modules already registered.
 * Returns the registry instance for convenience.
 */
export function bootstrapEntityModules(): EntityRegistry {
  const registry = getEntityRegistry();

  // Register core modules first (extensions may depend on them)
  for (const module of CORE_MODULES) {
    if (!registry.hasModule(module.name)) {
      registry.register(module);
    }
  }

  // Register built-in extension modules
  for (const module of EXTENSION_MODULES) {
    if (!registry.hasModule(module.name)) {
      registry.register(module);
    }
  }

  return registry;
}

/**
 * Get the list of core module names (for validation/testing).
 */
export function getCoreModuleNames(): string[] {
  return CORE_MODULES.map(m => m.name);
}

/**
 * Get the list of built-in extension module names (for validation/testing).
 */
export function getExtensionModuleNames(): string[] {
  return EXTENSION_MODULES.map(m => m.name);
}
