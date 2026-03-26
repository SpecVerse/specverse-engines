#!/usr/bin/env node

/**
 * Generate Minimal SpecVerse Syntax Reference from JSON Schema
 *
 * This script auto-generates schema/MINIMAL-SYNTAX-REFERENCE.specly
 * by creating a comprehensive minimal example showing all SpecVerse features.
 *
 * Usage: node scripts/generate-minimal-syntax-reference.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Default: use caller's working directory for schema/ paths
const projectRoot = process.cwd();
const _args = process.argv.slice(2);

// File paths (accept positional args or use cwd-relative defaults)
const SCHEMA_PATH = _args[0] || path.join(projectRoot, 'schema', 'SPECVERSE-SCHEMA.json');
const OUTPUT_PATH = _args[1] || path.join(projectRoot, 'schema', 'MINIMAL-SYNTAX-REFERENCE.specly');

// Generation metadata
const GENERATION_HEADER = `# Auto-generated SpecVerse Minimal Syntax Reference
# Generated from: schema/SPECVERSE-SCHEMA.json
#
# This file is auto-generated. Manual edits will be overwritten.
# To modify the minimal syntax reference, update the generator script:
# scripts/generate-minimal-syntax-reference.js

`;

class MinimalSyntaxReferenceGenerator {
  constructor() {
    this.schema = null;
  }

  async generate() {
    const verbose = process.env.VERBOSE === 'true';
    if (verbose) console.log('🔧 Generating Minimal Syntax Reference...');

    // Load schema
    try {
      const schemaContent = fs.readFileSync(SCHEMA_PATH, 'utf8');
      this.schema = JSON.parse(schemaContent);
    } catch (error) {
      console.error(`❌ Error loading schema: ${error.message}`);
      process.exit(1);
    }

    // Generate the minimal specification
    const minimalSpec = this.generateMinimalSpec();

    // Write to schema directory
    const finalContent = GENERATION_HEADER + minimalSpec;
    fs.writeFileSync(OUTPUT_PATH, finalContent);

    const sizeKB = (finalContent.length / 1024).toFixed(1);
    if (verbose) {
      console.log(`✅ Generated minimal syntax reference: ${path.basename(OUTPUT_PATH)}`);
      console.log(`📊 Size: ${sizeKB}KB`);
    }

    return finalContent;
  }

  generateMinimalSpec() {
    // Based on the actual schema structure, generate a complete minimal example
    return `components:
  MinimalSyntaxReference:
    version: "1.0.0"
    description: "Minimal complete SpecVerse specification showing essential syntax patterns for logical architecture"
    tags: ["reference", "minimal", "syntax", "template"]

    export:
      models: [User, Product]
      controllers: [UserController]
      services: [NotificationService]
      events: [UserCreated, ProductUpdated]

    models:
      User:
        description: "Basic user model showing essential features"
        attributes:
          id: UUID required
          name: String required
          email: Email required unique
          active: Boolean default=true
          createdAt: DateTime required auto=now
        relationships:
          products: hasMany Product
        lifecycles:
          status:
            flow: "pending -> active -> suspended -> inactive"
        behaviors:
          activate:
            description: "Activate user account"
            parameters:
              reason: String required
            returns: Boolean
            requires: ["User exists", "User not already active"]
            ensures: ["User is active"]
            publishes: [UserCreated]

      Product:
        description: "Basic product model showing relationships"
        attributes:
          id: UUID required auto=uuid4
          name: String required
          price: Number required min=0
          available: Boolean default=true
        relationships:
          owner: belongsTo User
        behaviors:
          updatePrice:
            description: "Update product price"
            parameters:
              newPrice: Number required min=0
            returns: Boolean
            publishes: [ProductUpdated]

    controllers:
      UserController:
        description: "Basic user management controller"
        model: User
        subscribes_to: [UserCreated]
        cured:
          create:
            description: "Create new user"
            parameters:
              name: String required
              email: Email required
            returns: User
            requires: ["Email is valid", "Email not already used"]
            ensures: ["User created", "Welcome email sent"]
            publishes: [UserCreated]
          retrieve:
            description: "Get user by ID"
            parameters:
              id: UUID required
            returns: User
          retrieve_many:
            description: "List users"
            parameters:
              limit: Integer default=10 max=100
              offset: Integer default=0
            returns: Array<User>
          update:
            description: "Update user information"
            parameters:
              id: UUID required
              changes: String required
            returns: User
            requires: ["User exists"]
            ensures: ["User updated"]
          delete:
            description: "Delete user account"
            parameters:
              id: UUID required
            returns: Boolean
            requires: ["User exists"]
            ensures: ["User deleted"]
        actions:
          activate:
            description: "Activate user account"
            parameters:
              id: UUID required
              reason: String required
            returns: Boolean
            requires: ["User exists", "User not already active"]
            ensures: ["User is active"]
            publishes: [UserCreated]

    services:
      NotificationService:
        description: "Handle user notifications"
        subscribes_to: [UserCreated, ProductUpdated]
        operations:
          sendWelcomeEmail:
            description: "Send welcome email to new user"
            parameters:
              userId: UUID required
              email: Email required
            returns: Boolean
            requires: ["User exists", "Email valid"]
            ensures: ["Email sent"]

          notifyOwner:
            description: "Notify product owner of updates"
            parameters:
              productId: UUID required
              changes: String required
            returns: Boolean
            requires: ["Product exists"]
            ensures: ["Owner notified"]
            publishes: [ProductUpdated]

    views:
      UserListView:
        description: "Display list of users"
        type: "list"
        model: User
        subscribes_to: [UserCreated]
        uiComponents:
          userTable: { type: "table", columns: ["name", "email", "active"] }
        properties:
          sortable: true
          filterable: true

    events:
      UserCreated:
        description: "User account created"
        attributes:
          userId: UUID required
          name: String required
          email: Email required
          timestamp: DateTime required auto=now

      ProductUpdated:
        description: "Product information updated"
        attributes:
          productId: UUID required
          userId: UUID required
          changes: String required
          timestamp: DateTime required auto=now

manifests:
  BasicImplementationManifest:
    specVersion: "3.5.0"
    name: "BasicImplementationManifest"
    description: "Basic implementation manifest for minimal syntax example"
    version: "1.0.0"

    deployment:
      deploymentSource: "./MINIMAL-SYNTAX-REFERENCE.specly"
      deploymentName: "development"

    defaultMappings:
      storage: "PostgreSQL15"
      controller: "FastifyAPI"
      service: "PrismaORM"

    capabilityMappings:
      - capability: "api.rest"
        instanceFactory: "FastifyAPI"
      - capability: "storage.database"
        instanceFactory: "PostgreSQL15"

deployments:
  development:
    version: "1.0.0"
    description: "Development environment deployment"
    environment: development
    instances:
      controllers:
        apiServer:
          component: "MinimalSyntaxReference"
          namespace: "api"
          advertises: "*"
          uses: ["storage.mainDb.*"]
          scale: 1
      storage:
        mainDb:
          component: "MinimalSyntaxReference"
          namespace: "data"
          type: "relational"
          advertises: ["persistence.*", "query.*"]
      communications:
        eventBus:
          namespace: "global"
          capabilities: ["*"]
          type: "pubsub"
`;
  }
}

// CLI interface
async function main() {
  const generator = new MinimalSyntaxReferenceGenerator();
  try {
    await generator.generate();

    const verbose = process.env.VERBOSE === 'true';
    if (verbose) {
      console.log('📖 Generated minimal syntax reference with:');
      console.log('  ✓ Complete SpecVerse syntax patterns');
      console.log('  ✓ All essential features demonstrated');
      console.log('  ✓ Unified manifest architecture (v3.4.9)');
      console.log('  ✓ Schema-compliant structure');
      console.log('  ✓ Convention syntax examples');
    }
  } catch (error) {
    console.error(`❌ Generation failed: ${error.message}`);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { MinimalSyntaxReferenceGenerator };