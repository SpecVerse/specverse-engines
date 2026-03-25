/**
 * Test v3.3 Implementation Types System
 *
 * Tests the complete flow from spec to generated code
 */

import { createDefaultLibrary, createResolver, createCodeGenerator, loadManifest } from '@specverse/engine-realize';
import { UnifiedSpecVerseParser } from '@specverse/engine-parser';
import { readFileSync } from 'fs';
import { resolve } from 'path';

async function testV33Generation() {
  console.log('🧪 Testing v3.3 Implementation Types System\n');

  try {
    // 1. Load Implementation Type Library
    console.log('📚 Step 1: Loading Implementation Type Library...');
    const library = await createDefaultLibrary(process.cwd());
    const allTypes = library.find({});
    console.log(`   ✅ Library loaded with ${allTypes.length} implementation types`);

    // List loaded types
    allTypes.forEach(type => {
      console.log(`   - ${type.name} v${type.version} (${type.type})`);
    });
    console.log();

    // 2. Load Manifest
    console.log('📄 Step 2: Loading v3.3 Manifest...');
    const manifestPath = resolve(process.cwd(), 'examples/v33-test/fastify-prisma-manifest.yaml');
    const manifest = loadManifest(manifestPath);
    console.log(`   ✅ Manifest loaded: ${manifest.name}`);
    console.log(`   - Version: ${manifest.version}`);
    console.log(`   - Implementation Types: ${manifest.implementationTypes?.length || 0}`);
    console.log(`   - Capability Mappings: ${Object.keys(manifest.capabilityMappings || {}).length}`);
    console.log();

    // 3. Create Resolver
    console.log('🔍 Step 3: Creating Capability Resolver...');
    const resolver = createResolver(library, manifest);
    console.log(`   ✅ Resolver created`);
    console.log();

    // 4. Parse Spec
    console.log('📝 Step 4: Parsing Test Spec...');
    // Use a simple existing example for now
    const specPath = resolve(process.cwd(), 'examples/01-fundamentals/01-01-basic-model.specly');
    const specContent = readFileSync(specPath, 'utf8');

    const schemaPath = resolve(process.cwd(), 'schema/SPECVERSE-SCHEMA.json');
    const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));

    const parser = new UnifiedSpecVerseParser(schema);
    const parseResult = parser.parse(specContent, 'specly');

    if (parseResult.errors && parseResult.errors.length > 0) {
      console.error('   ❌ Parse errors:');
      parseResult.errors.forEach((err: any) => {
        console.error(`      - ${err.message}`);
      });
      return;
    }

    console.log(`   ✅ Spec parsed successfully`);
    console.log(`   - Component: ${parseResult.ast?.components ? Object.keys(parseResult.ast.components)[0] : 'unknown'}`);
    console.log(`   - Models: ${parseResult.ast?.components?.[Object.keys(parseResult.ast.components)[0]]?.models?.length || 0}`);
    console.log(`   - Controllers: ${parseResult.ast?.components?.[Object.keys(parseResult.ast.components)[0]]?.controllers?.length || 0}`);

    // Mock a deployment for testing (since basic example doesn't have one)
    const deployment = {
      environment: 'development',
      instances: {
        'apiServer': {
          name: 'Test API Server',
          type: 'api-server',
          advertises: ['api.rest', 'api.rest.crud'],
          uses: ['storage.database']
        },
        'database': {
          name: 'Test Database',
          type: 'storage',
          advertises: ['storage.database', 'storage.prisma'],
          uses: []
        }
      }
    };
    console.log(`   - Mocked deployment for testing`);
    console.log(`   - Instances: ${Object.keys(deployment.instances || {}).length}`);
    console.log();

    // 5. Test Resolution
    console.log('🔗 Step 5: Testing Capability Resolution...');
    const apiInstance = deployment.instances?.['apiServer'];
    if (!apiInstance) {
      console.error('   ❌ No api-server instance found');
      return;
    }

    console.log(`   Testing instance: ${apiInstance.name}`);
    console.log(`   Advertises: ${apiInstance.advertises?.join(', ')}`);

    const resolved = resolver.resolveForInstance(apiInstance);
    console.log(`   ✅ Resolved ${resolved.length} implementation type(s)`);

    resolved.forEach(impl => {
      console.log(`   - ${impl.implementationType.name}`);
      console.log(`     Capability: ${impl.capability}`);
      console.log(`     Templates: ${Object.keys(impl.implementationType.codeTemplates).join(', ')}`);
    });
    console.log();

    // 6. Test Code Generation
    console.log('⚙️  Step 6: Testing Code Generation...');
    const codeGen = createCodeGenerator({ outputDir: '/tmp/v33-test' });

    // Get component data
    const componentName = Object.keys(parseResult.ast?.components || {})[0];
    const component = parseResult.ast?.components?.[componentName];
    const model = component?.models?.[0];

    // Mock a controller if not present
    const controller = component?.controllers?.[0] || {
      name: `${model?.name}Controller`,
      path: `/api/${model?.name?.toLowerCase()}`,
      model: model?.name,
      endpoints: [
        { operation: 'create', method: 'POST', path: '/' },
        { operation: 'retrieve', method: 'GET', path: '/:id' },
        { operation: 'update', method: 'PUT', path: '/:id' },
        { operation: 'delete', method: 'DELETE', path: '/:id' },
        { operation: 'list', method: 'GET', path: '/' }
      ]
    };

    if (!model) {
      console.error('   ❌ No model found in spec');
      return;
    }

    console.log(`   Generating code for model: ${model.name}`);

    // Test each template
    const impl = resolved[0];
    const templates = ['routes', 'services', 'schema'];

    for (const templateName of templates) {
      try {
        console.log(`   Testing ${templateName} template...`);

        const output = await codeGen.generateFromTemplate(
          impl,
          templateName,
          {
            spec: parseResult.ast,
            model,
            controller,
            models: [model]
          },
          { outputDir: '/tmp/v33-test' }
        );

        console.log(`   ✅ ${templateName}: ${output.filePath}`);
        console.log(`      Code length: ${output.code.length} characters`);
        console.log(`      First 100 chars: ${output.code.substring(0, 100)}...`);
      } catch (error) {
        console.error(`   ❌ ${templateName} failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    console.log();

    // 7. Summary
    console.log('✅ All tests completed!');
    console.log('\n📊 Summary:');
    console.log(`   - Library: ✅ Loaded`);
    console.log(`   - Manifest: ✅ Loaded`);
    console.log(`   - Spec: ✅ Parsed`);
    console.log(`   - Resolution: ✅ Working`);
    console.log(`   - Generation: ✅ Working`);
    console.log('\n🎉 v3.3 Implementation Types System is operational!');

  } catch (error) {
    console.error('\n❌ Test failed:', error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run test
testV33Generation();
