/**
 * SpecVerse Code Realization
 *
 * Main entry point for code generation (realization) from SpecVerse specifications.
 * Transforms minimal specs into production-ready implementations.
 */

// Types (TemplateContext, etc.)
export * from './types/index.js';

// Utilities
export * from './utils/index.js';

// Generators
export * from './generators/index.js';

// Library
export { InstanceFactoryLibrary, createDefaultLibrary } from './library/library.js';
export { createResolver } from './library/resolver.js';

// Code generator
export { createCodeGenerator } from './engines/code-generator.js';

// ============================================================================
// Engine adapter — implements SpecVerseEngine for discovery via EngineRegistry
// ============================================================================

import type { RealizeEngine, EngineInfo, GeneratedOutput } from '@specverse/types';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync, copyFileSync } from 'fs';
import { dirname, join, basename } from 'path';
import { fileURLToPath } from 'url';
import { createDefaultLibrary } from './library/library.js';
import { createResolver } from './library/resolver.js';
import { createCodeGenerator } from './engines/code-generator.js';
import { loadManifest } from './utils/manifest-loader.js';

class SpecVerseRealizeEngine implements RealizeEngine {
  name = 'realize';
  version = '3.5.2';
  capabilities = ['realize', 'code-generation', 'manifest-resolution', 'instance-factories'];

  private library: any = null;
  private resolver: any = null;
  private codeGenerator: any = null;
  private manifest: any = null;
  private initialized = false;

  async initialize(config?: {
    manifestPath?: string;
    workingDir?: string;
  }): Promise<void> {
    const workingDir = config?.workingDir || process.cwd();

    // Load instance factory library
    this.library = await createDefaultLibrary(workingDir);

    // Load and resolve manifest if provided
    if (config?.manifestPath) {
      this.manifest = loadManifest(config.manifestPath);
      this.resolver = createResolver(this.library, this.manifest);
    }

    // Create code generator
    this.codeGenerator = createCodeGenerator();

    this.initialized = true;
  }

  getInfo(): EngineInfo {
    return { name: this.name, version: this.version, capabilities: this.capabilities };
  }

  resolve(capability: string): any {
    if (!this.resolver) throw new Error('Realize engine not initialized with manifest.');
    return this.resolver.resolveCapability(capability);
  }

  async generate(resolved: any, template: string, context: any): Promise<GeneratedOutput> {
    if (!this.codeGenerator) throw new Error('Realize engine not initialized.');
    return this.codeGenerator.generateFromTemplate(resolved, template, context);
  }

  /**
   * Realize all code from an AI-optimized spec.
   * This is the full pipeline equivalent of the hand-written CLI's `case 'all':`.
   */
  async realizeAll(spec: any, outputDir: string): Promise<{ files: string[]; errors: string[] }> {
    if (!this.initialized || !this.resolver || !this.codeGenerator) {
      throw new Error('Realize engine not initialized. Call initialize() with manifestPath.');
    }

    const files: string[] = [];
    const errors: string[] = [];
    const allModels: any[] = Object.values(spec.models || {});

    const writeOutput = (output: { code: string; filePath: string }) => {
      const dir = dirname(output.filePath);
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      writeFileSync(output.filePath, output.code, 'utf-8');
      files.push(basename(output.filePath));
    };

    const tryResolve = (capability: string) => {
      try { return this.resolver.resolveCapability(capability); }
      catch { return null; }
    };

    // 1. ORM Schema
    const ormResolved = tryResolve('orm.schema');
    if (ormResolved?.instanceFactory?.codeTemplates?.schema) {
      try {
        const output = await this.codeGenerator.generateFromTemplate(
          ormResolved, 'schema', { spec, models: allModels }, { outputDir }
        );
        writeOutput(output);
        console.log(`   ✅ ORM schema: ${output.filePath}`);
      } catch (e: any) { errors.push(`ORM: ${e.message}`); }
    }

    // 2. Controllers (per model) — use spec controllers if available, else generate from model
    const ctrlResolved = tryResolve('service.controller');
    if (ctrlResolved?.instanceFactory?.codeTemplates?.controllers) {
      // Build controller lookup from spec
      const specControllers = Array.isArray(spec.controllers)
        ? spec.controllers
        : Object.values(spec.controllers || {});
      const controllerLookup: Record<string, any> = {};
      for (const c of specControllers) controllerLookup[(c as any).name] = c;

      for (const model of allModels) {
        try {
          const ctrlName = `${model.name}Controller`;
          const specCtrl = controllerLookup[ctrlName];
          const controller = specCtrl ? {
            ...specCtrl,
            model: specCtrl.modelReference || specCtrl.model || model.name,
            modelReference: specCtrl.modelReference || specCtrl.model || model.name,
            cured: specCtrl.cured || { create: {}, retrieve: {}, update: {}, validate: {}, evolve: {}, delete: {} },
          } : {
            name: ctrlName,
            model: model.name,
            modelReference: model.name,
            cured: { create: {}, retrieve: {}, update: {}, validate: {}, evolve: {}, delete: {} },
          };
          const output = await this.codeGenerator.generateFromTemplate(
            ctrlResolved, 'controllers', { spec, model, controller, models: allModels }, { outputDir }
          );
          writeOutput(output);
        } catch (e: any) { errors.push(`Controller ${model.name}: ${e.message}`); }
      }
      console.log(`   ✅ Controllers: ${allModels.length} controller(s)`);
    }

    // 3. Services
    const servicesList = Array.isArray(spec.services) ? spec.services : Object.values(spec.services || {});
    if (ctrlResolved?.instanceFactory?.codeTemplates?.services) {
      for (const service of servicesList) {
        try {
          const svcName = (service as any).name || 'Service';
          const output = await this.codeGenerator.generateFromTemplate(
            ctrlResolved, 'services', { spec, service: { name: svcName, ...service } }, { outputDir }
          );
          writeOutput(output);
        } catch (e: any) { errors.push(`Service: ${e.message}`); }
      }
      console.log(`   ✅ Services: ${servicesList.length} service(s)`);
    }

    // 4. Routes (per model) — use spec controllers for endpoint data
    const routeResolved = tryResolve('api.rest');
    if (routeResolved?.instanceFactory?.codeTemplates?.routes) {
      const specControllers2 = Array.isArray(spec.controllers)
        ? spec.controllers
        : Object.values(spec.controllers || {});
      const ctrlLookup2: Record<string, any> = {};
      for (const c of specControllers2) ctrlLookup2[(c as any).name] = c;

      for (const model of allModels) {
        try {
          const ctrlName = `${model.name}Controller`;
          const specCtrl = ctrlLookup2[ctrlName];
          const controller = specCtrl || {
            name: ctrlName,
            model: model.name,
            modelReference: model.name,
            cured: { create: {}, retrieve: {}, update: {}, validate: {}, evolve: {}, delete: {} },
          };
          const output = await this.codeGenerator.generateFromTemplate(
            routeResolved, 'routes', { spec, model, controller, models: allModels }, { outputDir }
          );
          writeOutput(output);
        } catch (e: any) { errors.push(`Route ${model.name}: ${e.message}`); }
      }
      console.log(`   ✅ Routes: ${allModels.length} route handler(s)`);
    }

    // 5. Views, Forms, Hooks
    const viewsResolved = tryResolve('ui.components');
    if (viewsResolved && spec.views) {
      const views = Array.isArray(spec.views) ? spec.views : Object.values(spec.views);
      let viewCount = 0, formCount = 0, hookCount = 0;

      for (const viewData of views) {
        const modelRef = (viewData as any).primaryModel || (viewData as any).model;
        const model = modelRef ? allModels.find((m: any) => m.name === modelRef) : undefined;

        // View component
        if (viewsResolved.instanceFactory.codeTemplates?.components) {
          try {
            const output = await this.codeGenerator.generateFromTemplate(
              viewsResolved, 'components', { spec, view: viewData, model, models: allModels }, { outputDir }
            );
            writeOutput(output);
            viewCount++;
          } catch { /* view generation is optional */ }
        }

        // Form
        if (model && viewsResolved.instanceFactory.codeTemplates?.forms) {
          try {
            const output = await this.codeGenerator.generateFromTemplate(
              viewsResolved, 'forms', { spec, model, view: viewData, models: allModels }, { outputDir }
            );
            writeOutput(output);
            formCount++;
          } catch { /* form generation is optional */ }
        }

        // Hook
        if (model && viewsResolved.instanceFactory.codeTemplates?.hooks) {
          try {
            const output = await this.codeGenerator.generateFromTemplate(
              viewsResolved, 'hooks', { spec, model, view: viewData, models: allModels }, { outputDir }
            );
            writeOutput(output);
            hookCount++;
          } catch { /* hook generation is optional */ }
        }
      }
      if (viewCount) console.log(`   ✅ Views: ${viewCount} component(s)`);
      if (formCount) console.log(`   ✅ Forms: ${formCount} form(s)`);
      if (hookCount) console.log(`   ✅ Hooks: ${hookCount} hook(s)`);
    }

    // 6. Types (per model)
    if (viewsResolved?.instanceFactory?.codeTemplates?.types) {
      for (const model of allModels) {
        try {
          const output = await this.codeGenerator.generateFromTemplate(
            viewsResolved, 'types', { spec, model, models: allModels }, { outputDir }
          );
          writeOutput(output);
        } catch { /* type generation is optional */ }
      }
      console.log(`   ✅ Types: ${allModels.length} model type(s)`);
    }

    // 7. Scaffolding (package.json, tsconfig, etc.)
    const scaffoldResolved = tryResolve('project.scaffold');
    if (scaffoldResolved?.instanceFactory?.codeTemplates) {
      const scaffoldFiles: string[] = [];
      for (const [templateName] of Object.entries(scaffoldResolved.instanceFactory.codeTemplates)) {
        try {
          const output = await this.codeGenerator.generateFromTemplate(
            scaffoldResolved, templateName,
            { spec, models: allModels, manifest: this.manifest, instanceFactories: [] },
            { outputDir }
          );
          writeOutput(output);
          scaffoldFiles.push(basename(output.filePath));
        } catch { /* scaffolding is optional */ }
      }
      if (scaffoldFiles.length) console.log(`   ✅ Project scaffolding: ${scaffoldFiles.join(', ')}`);
    }

    // 8. Backend app entry point
    const appResolved = tryResolve('app.entrypoint');
    if (appResolved?.instanceFactory?.codeTemplates) {
      const appFiles: string[] = [];
      for (const [templateName] of Object.entries(appResolved.instanceFactory.codeTemplates)) {
        try {
          const output = await this.codeGenerator.generateFromTemplate(
            appResolved, templateName, { spec, models: allModels, manifest: this.manifest }, { outputDir }
          );
          writeOutput(output);
          appFiles.push(basename(output.filePath));
        } catch { /* app generation is optional */ }
      }
      if (appFiles.length) console.log(`   ✅ Backend application: ${appFiles.join(', ')}`);
    }

    // 9. Frontend app
    const frontendResolved = tryResolve('app.frontend');
    if (frontendResolved?.instanceFactory?.codeTemplates) {
      const frontendFiles: string[] = [];
      for (const [templateName] of Object.entries(frontendResolved.instanceFactory.codeTemplates)) {
        try {
          const output = await this.codeGenerator.generateFromTemplate(
            frontendResolved, templateName,
            { spec, models: allModels, views: spec.views, manifest: this.manifest },
            { outputDir }
          );
          writeOutput(output);
          frontendFiles.push(basename(output.filePath));
        } catch { /* frontend is optional */ }
      }
      if (frontendFiles.length) console.log(`   ✅ Frontend application: ${frontendFiles.join(', ')}`);
    }

    // 10. Ship assets (templates, examples, schema) from engine packages
    try {
      const assetsCopied = await this.copyAssets(outputDir);
      if (assetsCopied.length > 0) {
        console.log(`   ✅ Assets: ${assetsCopied.join(', ')}`);
      }
    } catch { /* assets are optional */ }

    console.log(`\n✅ All code generated in: ${outputDir}`);
    if (errors.length) {
      console.warn(`⚠️  ${errors.length} warning(s) during generation`);
    }

    return { files, errors };
  }

  /**
   * Copy static assets (templates, examples, schema) from engine packages
   * into the output directory so the generated project is self-contained.
   */
  private async copyAssets(outputDir: string): Promise<string[]> {
    const copied: string[] = [];

    const copyDir = (src: string, dest: string, label: string) => {
      if (!existsSync(src)) return;
      if (!existsSync(dest)) mkdirSync(dest, { recursive: true });
      const copyRecursive = (s: string, d: string) => {
        for (const entry of readdirSync(s)) {
          const srcPath = join(s, entry);
          const destPath = join(d, entry);
          if (statSync(srcPath).isDirectory()) {
            if (!existsSync(destPath)) mkdirSync(destPath, { recursive: true });
            copyRecursive(srcPath, destPath);
          } else {
            copyFileSync(srcPath, destPath);
          }
        }
      };
      copyRecursive(src, dest);
      copied.push(label);
    };

    // Find engine package asset directories via node_modules or relative paths
    const realizeAssets = this.resolvePackageAssets('@specverse/engine-realize', 'assets');
    const aiAssets = this.resolvePackageAssets('@specverse/engine-ai', 'assets');

    if (realizeAssets) {
      copyDir(join(realizeAssets, 'templates'), join(outputDir, 'templates'), 'templates');
      copyDir(join(realizeAssets, 'examples'), join(outputDir, 'examples'), 'examples');
    }

    if (aiAssets) {
      copyDir(join(aiAssets, 'prompts'), join(outputDir, 'prompts'), 'prompts');
    }

    // Copy composed schema if available
    const thisDir = dirname(fileURLToPath(import.meta.url));
    const schemaCandidates = [
      join(thisDir, '..', 'schema', 'SPECVERSE-SCHEMA.json'),
      join(thisDir, '../..', 'schema', 'SPECVERSE-SCHEMA.json'),
      join(thisDir, '..', '..', '..', 'schema', 'SPECVERSE-SCHEMA.json'),
    ];
    for (const schemaFile of schemaCandidates) {
      if (existsSync(schemaFile)) {
        const destSchema = join(outputDir, 'backend', 'schema');
        if (!existsSync(destSchema)) mkdirSync(destSchema, { recursive: true });
        copyFileSync(schemaFile, join(destSchema, 'SPECVERSE-SCHEMA.json'));
        copied.push('schema');
        break;
      }
    }

    return copied;
  }

  private resolvePackageAssets(packageName: string, subdir: string): string | null {
    const thisDir = dirname(fileURLToPath(import.meta.url));
    const isSelf = packageName === '@specverse/engine-realize';
    const candidates: string[] = [];

    if (isSelf) {
      // For our own package, look relative to this file
      candidates.push(join(thisDir, '..', subdir));
      candidates.push(join(thisDir, '../..', subdir));
    }

    // Try via node_modules (workspace layout and npm install)
    for (let i = 2; i <= 5; i++) {
      const up = Array(i).fill('..').join('/');
      candidates.push(join(thisDir, up, 'node_modules', ...packageName.split('/'), subdir));
    }
    candidates.push(join(process.cwd(), 'node_modules', ...packageName.split('/'), subdir));

    for (const candidate of candidates) {
      if (existsSync(candidate)) return candidate;
    }
    return null;
  }
}

export const engine = new SpecVerseRealizeEngine();
export default engine;
export { SpecVerseRealizeEngine };
