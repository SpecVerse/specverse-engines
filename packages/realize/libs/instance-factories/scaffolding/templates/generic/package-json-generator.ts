/**
 * Generic Package.json Generator
 *
 * Aggregates requirements from all implementation types in manifest
 * and generates a complete package.json file
 */

import type { TemplateContext } from '@specverse/engine-realize';

export default function generatePackageJson(context: TemplateContext): string {
  const { spec, manifest, configuration } = context;

  // Check if we're in monorepo mode
  const outputStructure = configuration?.outputStructure || 'monorepo';
  const isMonorepo = outputStructure === 'monorepo';

  // Aggregate requirements from all implementation types
  const aggregated = aggregateRequirements(context.instanceFactories || context.implementationTypes || []);

  const pkg: any = {
    name: (spec.metadata?.component || 'specverse-app')
      .toLowerCase()
      .replace(/\s+/g, '-'),
    version: spec.metadata?.version || '1.0.0',
    description: spec.metadata?.description || '',
    private: true,
    type: 'module'
  };

  // Add workspaces for monorepo
  if (isMonorepo) {
    const frontendDir = configuration?.frontendDir || 'frontend';
    const backendDir = configuration?.backendDir || 'backend';

    pkg.workspaces = [backendDir, frontendDir];

    // Add convenience scripts for monorepo
    pkg.scripts = {
      // Build all workspaces
      'build': 'npm run build --workspaces',
      'build:backend': `npm run build --workspace=${backendDir}`,
      'build:frontend': `npm run build --workspace=${frontendDir}`,

      // Production
      'start': `npm run start --workspace=${backendDir}`,

      // Development
      'dev': 'npm run dev --workspaces',
      'dev:backend': `npm run dev --workspace=${backendDir}`,
      'dev:frontend': `npm run dev --workspace=${frontendDir}`,

      // Testing
      'test': 'npm test --workspaces',
      'test:backend': `npm test --workspace=${backendDir}`,
      'test:frontend': `npm test --workspace=${frontendDir}`,

      // Database management (backend)
      'db:setup': `npm run db:setup --workspace=${backendDir}`,
      'db:generate': `npm run db:generate --workspace=${backendDir}`,
      'db:push': `npm run db:push --workspace=${backendDir}`,
      'db:migrate': `npm run db:migrate --workspace=${backendDir}`,
      'db:studio': `npm run db:studio --workspace=${backendDir}`,

      // Linting
      'lint': 'npm run lint --workspaces',
      'lint:fix': 'npm run lint:fix --workspaces'
    };
  } else {
    // Standalone mode - merge all scripts
    pkg.scripts = {
      ...aggregated.scripts,
      // Ensure we have build script if TypeScript
      ...(aggregated.usesTypeScript && !aggregated.scripts.build && {
        build: 'tsc'
      }),
      // Add database setup script
      'db:setup': 'node -e "const{execSync:e}=require(\'child_process\');const{readFileSync:r}=require(\'fs\');try{const d=r(\'.env\',\'utf8\').match(/DATABASE_URL=.*\\/([^?\\"]+)/)?.[1];if(!d)throw new Error(\'DATABASE_URL not found\');console.log(\'Creating database:\',d);try{e(\'createdb \'+d)}catch(err){const errMsg=err.stderr?err.stderr.toString():err.message;if(errMsg.includes(\'already exists\')){console.log(\'✅ Database already exists\')}else throw err}console.log(\'✅ Database created successfully\')}catch(err){console.error(\'❌ Database setup failed:\',err.message);process.exit(1)}"',
      // Add test script if not provided by implementation types
      ...(!aggregated.scripts.test && {
        test: 'echo "Error: no test specified" && exit 1'
      })
    };

    // In standalone mode, include dependencies
    pkg.dependencies = aggregated.dependencies;
    pkg.devDependencies = {
      ...aggregated.devDependencies,
      // Ensure TypeScript is present if needed
      ...(aggregated.usesTypeScript && !aggregated.devDependencies.typescript && {
        typescript: '^5.3.0',
        '@types/node': '^20.0.0'
      })
    };

    // TypeScript-specific fields
    if (aggregated.usesTypeScript) {
      pkg.main = 'dist/main.js';
      pkg.types = 'dist/main.d.ts';
    }
  }

  // Add common Node.js fields
  pkg.engines = {
    node: '>=18.0.0'
  };

  return JSON.stringify(pkg, null, 2);
}

/**
 * Aggregate requirements from all implementation types
 */
function aggregateRequirements(implementationTypes: any[]) {
  const result = {
    dependencies: {} as Record<string, string>,
    devDependencies: {} as Record<string, string>,
    scripts: {} as Record<string, string>,
    environment: [] as any[],
    usesTypeScript: false,
    usesDocker: false
  };

  if (!implementationTypes || implementationTypes.length === 0) {
    return result;
  }

  // Iterate through all implementation types
  for (const implType of implementationTypes) {
    // Handle dependencies from the top level (v3.3 format)
    if (implType.dependencies) {
      // Runtime dependencies
      if (implType.dependencies.runtime && Array.isArray(implType.dependencies.runtime)) {
        for (const dep of implType.dependencies.runtime) {
          if (dep.name && dep.version) {
            result.dependencies[dep.name] = dep.version;
          }
        }
      }
      // Dev dependencies
      if (implType.dependencies.dev && Array.isArray(implType.dependencies.dev)) {
        for (const dep of implType.dependencies.dev) {
          if (dep.name && dep.version) {
            result.devDependencies[dep.name] = dep.version;
          }
        }
      }
    }

    // Also handle old requirements.dependencies.npm structure for backwards compatibility
    const requirements = implType.requirements;
    if (requirements) {
      if (requirements.dependencies?.npm) {
        Object.assign(result.dependencies, requirements.dependencies.npm.dependencies || {});
        Object.assign(result.devDependencies, requirements.dependencies.npm.devDependencies || {});
        Object.assign(result.scripts, requirements.dependencies.npm.scripts || {});
      }

      // Collect environment variables
      if (requirements.environment) {
        result.environment.push(...requirements.environment);
      }
    }

    // Detect TypeScript usage
    if (implType.technology?.language === 'typescript') {
      result.usesTypeScript = true;
    }

    // Detect Docker usage
    if (implType.capabilities?.provides?.includes('container.dev')) {
      result.usesDocker = true;
    }
  }

  return result;
}
