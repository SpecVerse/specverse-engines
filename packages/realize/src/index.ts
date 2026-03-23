/**
 * SpecVerse Code Realization
 *
 * Main entry point for code generation (realization) from SpecVerse specifications.
 * Transforms minimal specs into production-ready implementations.
 */

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
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, join, basename } from 'path';
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

    // 2. Controllers (per model)
    const ctrlResolved = tryResolve('service.controller');
    if (ctrlResolved?.instanceFactory?.codeTemplates?.controllers) {
      for (const model of allModels) {
        try {
          const controller = {
            name: `${model.name}Controller`,
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

    // 4. Routes (per model)
    const routeResolved = tryResolve('api.rest');
    if (routeResolved?.instanceFactory?.codeTemplates?.routes) {
      for (const model of allModels) {
        try {
          const controller = { name: `${model.name}Controller`, model: model.name };
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

    console.log(`\n✅ All code generated in: ${outputDir}`);
    if (errors.length) {
      console.warn(`⚠️  ${errors.length} warning(s) during generation`);
    }

    return { files, errors };
  }
}

export const engine = new SpecVerseRealizeEngine();
export default engine;
export { SpecVerseRealizeEngine };
