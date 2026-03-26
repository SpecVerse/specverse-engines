#!/usr/bin/env node
/**
 * JSON Schema to YAML Schema Converter with AI Guidance
 * Uses standard JSON-to-YAML conversion then adds comprehensive AI guidance
 */

import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class SchemaConverter {
  constructor() {
    this.aiGuidanceHeader = `# SpecVerse Schema for AI Generation
# This schema guides AI systems in generating valid SpecVerse specifications
# Focus on: Human-readable YAML + Conventions + AI-friendly patterns
#
# KEY AI GUIDANCE:
# 1. Use conventions: "attributeName: TypeName modifiers" for 90% of attributes
# 2. Component names: PascalCase (UserManagement, PaymentService)
# 3. Start minimal: Only include features explicitly mentioned in requirements
# 4. Common types: String, Integer, UUID, Email, DateTime, Boolean
# 5. Common modifiers: required, optional, unique, auto, searchable
#
# LIFECYCLE PATTERNS:
# - Simple flow: "draft -> review -> approved -> published"
# - Complex: { states: ["pending", "paid", "shipped"], transitions: { pay: "paid", ship: "shipped" } }
#
# BEHAVIOR PATTERNS:
# - Operation: { params: ["data: Object"], returns: "ValidationResult" }
# - Common behaviors: validate, serialize, transform, notify
#
# IMPORT/EXPORT PATTERNS:
# - Import: from: "@org/package", select: ["User", "Order"]
# - Export: ["PublicModel", "PublicService"] - only stable interfaces
#
# AI INFERENCE CAPABILITIES:
# SpecVerse includes a powerful inference engine that can:
# 1. EXPAND MINIMAL SPECS: Generate complete systems from basic requirements
# 2. INFER RELATIONSHIPS: Automatically create model associations
# 3. GENERATE CONTROLLERS: Auto-create CURED operations for models  
# 4. CREATE SERVICES: Infer business logic from model lifecycles
# 5. SUGGEST EVENTS: Generate events from lifecycle transitions
# 6. SMART DEFAULTS: Add common attributes (id, createdAt, updatedAt)
#
# INFERENCE PATTERNS:
# - Start with models → AI infers controllers, services, events
# - Define lifecycles → AI creates transition events and validations
# - Specify relationships → AI generates cascade operations
# - Minimal input → AI expands to production-ready architecture
#
# EXAMPLE MINIMAL SPEC:
# components:
#   UserService:
#     version: "1.0.0"
#     models:
#       User:
#         attributes:
#           id: UUID required
#           email: Email unique
#           name: String required
#         lifecycles:
#           status:
#             flow: "pending -> active -> inactive"
`;
  }

  convert(jsonSchemaPath, outputPath) {
    const verbose = process.env.VERBOSE === 'true';
    if (verbose) console.log('🔄 Converting JSON Schema to AI-Guided YAML...');
    
    const schemaContent = fs.readFileSync(jsonSchemaPath, 'utf8');
    const schema = JSON.parse(schemaContent);
    
    // Use standard YAML conversion
    const baseYaml = yaml.dump(schema, {
      indent: 2,
      lineWidth: 120,
      quotingType: '"',
      forceQuotes: false
    });
    
    // Add AI guidance and enhance
    const enhancedYaml = this.addAIGuidance(baseYaml, schema);
    
    fs.writeFileSync(outputPath, enhancedYaml);
    
    const sizeKB = (enhancedYaml.length / 1024).toFixed(1);
    if (verbose) {
      console.log(`✅ AI-guided YAML schema generated: ${outputPath}`);
      console.log(`📊 Size: ${sizeKB}KB`);
    }
    
    return enhancedYaml;
  }

  addAIGuidance(yamlContent, schema) {
    const lines = yamlContent.split('\n');
    const enhanced = [];

    // Add comprehensive header
    enhanced.push(this.aiGuidanceHeader);
    enhanced.push('');

    // Track if we've already added attributes guidance
    let attributesGuidanceAdded = false;

    // Update schema metadata for AI version
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.includes('$id:') && line.includes('.json')) {
        enhanced.push(line.replace('.json', '-ai.yaml'));
      } else if (line.includes('title:')) {
        // Fix the title replacement - just append to existing title
        enhanced.push(line.replace('Schema with Namespace and Container Architecture', 'Schema with Namespace and Container Architecture - AI Generation Guide'));
      } else if (line.includes('description:') && line.includes('Schema for SpecVerse')) {
        enhanced.push('description: "AI-friendly schema with conventions and examples for SpecVerse generation"');
      } else if (line.trim() === 'components:' && !line.startsWith(' ')) {
        // Only handle top-level components, not the ones inside properties
        enhanced.push(line);
        enhanced.push('    # COMPONENTS: Logical system boundaries (microservices, modules, domains)');
        enhanced.push('    # AI Guidance: Each component = independent deployable unit');
        enhanced.push('    # Naming: PascalCase like "UserManagement", "PaymentService", "OrderProcessing"');
        enhanced.push('    # Pattern: Think business capabilities, not technical layers');
      } else if (line.trim() === 'deployments:' && !line.startsWith(' ')) {
        // Only handle top-level deployments
        enhanced.push(line);
        enhanced.push('    # DEPLOYMENTS: Production deployment configurations');
        enhanced.push('    # AI Guidance: Include only if deployment requirements are explicitly mentioned');
        enhanced.push('    # Focus on environment-specific configurations and scaling requirements')
      } else if (line.includes('models:') || line.includes('ModelsSection')) {
        enhanced.push(line);
        if (line.includes('ModelsSection')) {
          enhanced.push('        # MODELS: Data structures and business entities');
          enhanced.push('        # AI Guidance: Focus on core business data, avoid implementation details');
          enhanced.push('        # Convention: Use "attributeName: TypeName modifiers" format for 90% of cases');
          enhanced.push('        # Example: id: UUID required, email: Email unique, createdAt: DateTime auto');
        }
      } else if (line.includes('controllers:') || line.includes('ControllersSection')) {
        enhanced.push(line);
        if (line.includes('ControllersSection')) {
          enhanced.push('        # CONTROLLERS: API endpoints and business operations');
          enhanced.push('        # AI Guidance: Follow CURED pattern (Create, Retrieve, Update/Evolve, Delete)');
          enhanced.push('        # Always include "retrieve" operation, others based on business requirements');
          enhanced.push('        # Example: cured: { operations: [create, retrieve, update, delete] }');
        }
      } else if (line.includes('services:') || line.includes('ServicesSection')) {
        enhanced.push(line);
        if (line.includes('ServicesSection')) {
          enhanced.push('        # SERVICES: Business logic and domain operations');
          enhanced.push('        # AI Guidance: One service per business capability');
          enhanced.push('        # Focus on business verbs: ProcessPayment, SendNotification, ValidateUser');
          enhanced.push('        # Keep services focused and cohesive');
        }
      } else if (line.includes('events:') || line.includes('EventsSection')) {
        enhanced.push(line);
        if (line.includes('EventsSection')) {
          enhanced.push('        # EVENTS: System events and notifications');
          enhanced.push('        # AI Guidance: Use past tense naming (UserCreated, PaymentProcessed)');
          enhanced.push('        # Include relevant payload data for event consumers');
          enhanced.push('        # Think: "When X happens, what data do other systems need?"');
        }
      } else if (line.includes('views:') || line.includes('ViewsSection')) {
        enhanced.push(line);
        if (line.includes('ViewsSection')) {
          enhanced.push('        # VIEWS: UI components and data presentation');
          enhanced.push('        # AI Guidance: Match user interface requirements from conversation');
          enhanced.push('        # Include data sources and user interactions described');
        }
      } else if (line.includes('lifecycles:') || line.includes('LifecyclesSection')) {
        enhanced.push(line);
        if (line.includes('LifecyclesSection')) {
          enhanced.push('        # LIFECYCLES: State machines and business workflows');
          enhanced.push('        # AI Guidance: Model business processes with states and transitions');
          enhanced.push('        # Simple: flow: "draft -> review -> approved -> published"');
          enhanced.push('        # Complex: { states: ["pending", "paid", "shipped"], transitions: { pay: "paid", ship: "shipped" } }');
          enhanced.push('        # Think: What are the key business states and how do they change?');
        }
      } else if (line.includes('behaviors:') || line.includes('BehaviorsSection')) {
        enhanced.push(line);
        if (line.includes('BehaviorsSection')) {
          enhanced.push('        # BEHAVIORS: Reusable business logic and operations');
          enhanced.push('        # AI Guidance: Define common operations that can be shared across models');
          enhanced.push('        # Pattern: operationName: { params: ["param1: Type"], returns: "ReturnType" }');
          enhanced.push('        # Example: validate: { params: ["data: Object"], returns: "ValidationResult" }');
          enhanced.push('        # Think: What operations are common across multiple entities?');
        }
      } else if (line.includes('import:') || line.includes('ImportSection')) {
        enhanced.push(line);
        if (line.includes('ImportSection')) {
          enhanced.push('        # IMPORT: External component and type imports');
          enhanced.push('        # AI Guidance: Use for modularity and code reuse');
          enhanced.push('        # Pattern: from: "@org/package", select: ["User", "Order"]');
          enhanced.push('        # Think: What external types does this component need?');
        }
      } else if (line.includes('export:') || line.includes('ExportSection')) {
        enhanced.push(line);
        if (line.includes('ExportSection')) {
          enhanced.push('        # EXPORT: Types available to other components');
          enhanced.push('        # AI Guidance: Expose only stable, well-defined interfaces');
          enhanced.push('        # Pattern: ["User", "UserService"] - list of exported type names');
          enhanced.push('        # Think: What should other components be able to import?');
        }
      } else if (line.includes('attributes:') || line.includes('AttributesSection')) {
        enhanced.push(line);
        // Only add attributes guidance once, when we see AttributesSection for the first time
        if (line.includes('AttributesSection') && !attributesGuidanceAdded) {
          enhanced.push('          # ATTRIBUTES: Entity properties using SpecVerse conventions');
          enhanced.push('          # CONVENTION PATTERN: "attributeName: TypeName [modifiers...]"');
          enhanced.push('          # ');
          enhanced.push('          # COMMON TYPES:');
          enhanced.push('          # - String: Text data (names, descriptions, content)');
          enhanced.push('          # - Integer: Whole numbers (counts, quantities)');
          enhanced.push('          # - Number: Decimal numbers (prices, measurements)');
          enhanced.push('          # - UUID: Unique identifiers (primary keys, references)');
          enhanced.push('          # - Email: Validated email addresses');
          enhanced.push('          # - DateTime: Timestamps (use "auto" for created/updated)');
          enhanced.push('          # - Date: Date only (no time component)');
          enhanced.push('          # - Boolean: True/false flags and status');
          enhanced.push('          #');
          enhanced.push('          # COMMON MODIFIERS:');
          enhanced.push('          # - required: Field must have a value');
          enhanced.push('          # - optional: Field can be null/empty (default)');
          enhanced.push('          # - unique: No duplicates allowed');
          enhanced.push('          # - auto: System-generated value');
          enhanced.push('          # - searchable: Enable search indexing');
          attributesGuidanceAdded = true;
        }
      } else if (line.includes('relationships:') || line.includes('RelationshipsSection')) {
        enhanced.push(line);
        if (line.includes('RelationshipsSection')) {
          enhanced.push('          # RELATIONSHIPS: Associations between models');
          enhanced.push('          # AI Guidance: Use sparingly - prefer explicit attributes over complex relationships');
          enhanced.push('          # Pattern: "relationName: belongsTo/hasOne/hasMany TargetModel [cascade|eager]"');
          enhanced.push('          # Example: user: belongsTo User cascade, orders: hasMany Order');
        }
      } else if (line.includes('instances:') || line.includes('InstancesSection')) {
        enhanced.push(line);
        if (line.includes('InstancesSection')) {
          enhanced.push('        # INSTANCES: Deployment instance definitions');
          enhanced.push('        # AI Guidance: Define logical deployment instances for production');
          enhanced.push('        # Include only if deployment requirements are explicitly mentioned');
          enhanced.push('        # Instance types: controllers, services, views, communications, storage, security, infrastructure, monitoring');
        }
      } else if (line.includes('storage:') || line.includes('StorageInstances')) {
        enhanced.push(line);
        if (line.includes('StorageInstances')) {
          enhanced.push('        # STORAGE: Data persistence instances');
          enhanced.push('        # AI Guidance: Essential for production deployments');
          enhanced.push('        # Types: relational(PostgreSQL), document(MongoDB), keyvalue(Redis), cache(Memcached)');
          enhanced.push('        # Scale patterns: Personal(SQLite), Commercial(Cloud DB), Enterprise(Multi-AZ)');
          enhanced.push('        # Example: mainDB: { type: relational, persistence: durable, scale: 3 }');
        }
      } else if (line.includes('security:') || line.includes('SecurityInstances')) {
        enhanced.push(line);
        if (line.includes('SecurityInstances')) {
          enhanced.push('        # SECURITY: Authentication, authorization, and protection instances');
          enhanced.push('        # AI Guidance: Critical for production environments');
          enhanced.push('        # Types: authentication(OAuth), authorization(RBAC), encryption(TLS), audit(logging)');
          enhanced.push('        # Providers: oauth(Google/GitHub), saml(Enterprise), jwt(Stateless), ldap(Directory)');
          enhanced.push('        # Example: auth: { type: authentication, provider: oauth, scope: global }');
        }
      } else if (line.includes('infrastructure:') || line.includes('InfrastructureInstances')) {
        enhanced.push(line);
        if (line.includes('InfrastructureInstances')) {
          enhanced.push('        # INFRASTRUCTURE: Network and platform infrastructure instances');
          enhanced.push('        # AI Guidance: Essential for scalable production deployments');
          enhanced.push('        # Types: gateway(API), loadbalancer(Traffic), cdn(Content), dns(Domain)');
          enhanced.push('        # Providers: aws(ELB), cloudflare(CDN), kubernetes(Ingress), nginx(Proxy)');
          enhanced.push('        # Example: gateway: { type: gateway, provider: nginx, tier: regional }');
        }
      } else if (line.includes('monitoring:') || line.includes('MonitoringInstances')) {
        enhanced.push(line);
        if (line.includes('MonitoringInstances')) {
          enhanced.push('        # MONITORING: Observability and monitoring instances');
          enhanced.push('        # AI Guidance: Essential for production operations and debugging');
          enhanced.push('        # Types: metrics(Prometheus), logging(ELK), tracing(Jaeger), alerting(PagerDuty)');
          enhanced.push('        # Providers: prometheus(metrics), grafana(dashboards), datadog(APM), sentry(errors)');
          enhanced.push('        # Example: metrics: { type: metrics, provider: prometheus, scope: global }');
        }
      } else if (line.includes('communications:') || line.includes('CommunicationInstances')) {
        enhanced.push(line);
        if (line.includes('CommunicationInstances')) {
          enhanced.push('        # COMMUNICATIONS: Inter-service messaging');
          enhanced.push('        # AI Guidance: Use for distributed system communication');
          enhanced.push('        # Types: pubsub(events), rpc(requests), queue(async), streaming(real-time)');
          enhanced.push('        # Example: eventBus: { type: pubsub, capabilities: ["user.*", "order.*"] }');
        }
      } else {
        enhanced.push(line);
      }
    }
    
    // Add comprehensive examples at the end
    enhanced.push('');
    enhanced.push('# ========================================');
    enhanced.push('# AI GENERATION EXAMPLES');
    enhanced.push('# ========================================');
    enhanced.push('#');
    enhanced.push('# MINIMAL USER MANAGEMENT:');
    enhanced.push('# components:');
    enhanced.push('#   UserService:');
    enhanced.push('#     version: "1.0.0"');
    enhanced.push('#     models:');
    enhanced.push('#       User:');
    enhanced.push('#         attributes:');
    enhanced.push('#           id: UUID required');
    enhanced.push('#           email: Email unique');
    enhanced.push('#           name: String required');
    enhanced.push('#');
    enhanced.push('# E-COMMERCE WITH LIFECYCLE:');
    enhanced.push('# components:');
    enhanced.push('#   OrderService:');
    enhanced.push('#     version: "1.0.0"');
    enhanced.push('#     import:');
    enhanced.push('#       - from: "@ecommerce/user-service"');
    enhanced.push('#         select: ["User"]');
    enhanced.push('#     models:');
    enhanced.push('#       Order:');
    enhanced.push('#         attributes:');
    enhanced.push('#           id: UUID required');
    enhanced.push('#           status: String required');
    enhanced.push('#           total: Number required');
    enhanced.push('#         lifecycles:');
    enhanced.push('#           status:');
    enhanced.push('#             flow: "pending -> paid -> shipped -> delivered"');
    enhanced.push('#         behaviors:');
    enhanced.push('#           calculateTotal:');
    enhanced.push('#             params: []');
    enhanced.push('#             returns: "Number"');
    enhanced.push('#     controllers:');
    enhanced.push('#       OrderController:');
    enhanced.push('#         model: Order');
    enhanced.push('#         cured:');
    enhanced.push('#           operations: [create, retrieve, update]');
    enhanced.push('#');
    enhanced.push('# AI INFERENCE EXAMPLE:');
    enhanced.push('# INPUT (minimal spec):');
    enhanced.push('# components:');
    enhanced.push('#   BlogService:');
    enhanced.push('#     version: "1.0.0"');
    enhanced.push('#     models:');
    enhanced.push('#       Post:');
    enhanced.push('#         attributes:');
    enhanced.push('#           title: String required');
    enhanced.push('#           content: String required');
    enhanced.push('#         lifecycles:');
    enhanced.push('#           status:');
    enhanced.push('#             flow: "draft -> published -> archived"');
    enhanced.push('#');
    enhanced.push('# AI INFERRED OUTPUT (expanded by inference engine):');
    enhanced.push('# - Adds common attributes: id, createdAt, updatedAt');
    enhanced.push('# - Creates PostController with CURED operations');
    enhanced.push('# - Generates BlogService with business operations');
    enhanced.push('# - Creates lifecycle events: PostPublished, PostArchived');
    enhanced.push('# - Infers relationships: author: belongsTo User');
    enhanced.push('# - Adds validation behaviors: validateContent, checkDuplicateTitle');
    enhanced.push('#');
    enhanced.push('# DEPLOYMENT WITH STORAGE EXAMPLE:');
    enhanced.push('# deployments:');
    enhanced.push('#   production:');
    enhanced.push('#     version: "1.0.0"');
    enhanced.push('#     environment: production');
    enhanced.push('#     instances:');
    enhanced.push('#       controllers:');
    enhanced.push('#         apiController:');
    enhanced.push('#           component: "UserService"');
    enhanced.push('#           namespace: "api"');
    enhanced.push('#           advertises: "*"');
    enhanced.push('#           uses: ["storage.mainDB.*"]');
    enhanced.push('#           scale: 3');
    enhanced.push('#       storage:');
    enhanced.push('#         mainDB:');
    enhanced.push('#           component: "UserService"');
    enhanced.push('#           namespace: "data"');
    enhanced.push('#           type: "relational"');
    enhanced.push('#           advertises: ["persistence.*", "query.*"]');
    enhanced.push('#           persistence: "durable"');
    enhanced.push('#           consistency: "strong"');
    enhanced.push('#           scale: 2');
    enhanced.push('#           replication: 1');
    enhanced.push('#           backup: true');
    enhanced.push('#           encryption: true');
    enhanced.push('#       security:');
    enhanced.push('#         authSystem:');
    enhanced.push('#           component: "UserService"');
    enhanced.push('#           namespace: "auth"');
    enhanced.push('#           type: "authentication"');
    enhanced.push('#           provider: "oauth"');
    enhanced.push('#           scope: "global"');
    enhanced.push('#           advertises: ["auth.*", "identity.*"]');
    enhanced.push('#           policies: ["require-2fa", "session-timeout"]');
    enhanced.push('#           auditLevel: "detailed"');
    enhanced.push('#       infrastructure:');
    enhanced.push('#         apiGateway:');
    enhanced.push('#           component: "UserService"');
    enhanced.push('#           namespace: "gateway"');
    enhanced.push('#           type: "gateway"');
    enhanced.push('#           provider: "nginx"');
    enhanced.push('#           tier: "regional"');
    enhanced.push('#           advertises: ["routing.*", "balancing.*"]');
    enhanced.push('#           protocols: ["http", "https", "grpc"]');
    enhanced.push('#           healthChecks: true');
    enhanced.push('#           autoScaling: true');
    enhanced.push('#       monitoring:');
    enhanced.push('#         metricsSystem:');
    enhanced.push('#           component: "UserService"');
    enhanced.push('#           namespace: "monitoring"');
    enhanced.push('#           type: "metrics"');
    enhanced.push('#           provider: "prometheus"');
    enhanced.push('#           scope: "global"');
    enhanced.push('#           advertises: ["metrics.*", "health.*"]');
    enhanced.push('#           dashboards: ["service-overview", "error-rates"]');
    enhanced.push('#           alerts: ["high-error-rate", "service-down"]');
    enhanced.push('#           retention: "medium"');
    enhanced.push('#           resolution: "high"');
    enhanced.push('#           realtime: true');
    enhanced.push('#         loggingSystem:');
    enhanced.push('#           component: "UserService"');
    enhanced.push('#           namespace: "logging"');
    enhanced.push('#           type: "logging"');
    enhanced.push('#           provider: "elasticsearch"');
    enhanced.push('#           scope: "global"');
    enhanced.push('#           advertises: ["logs.*", "search.*"]');
    enhanced.push('#           retention: "long"');
    enhanced.push('#           aggregation: true');
    enhanced.push('# Result: Complete production-ready blog system from 8 lines of input!');
    
    return enhanced.join('\n');
  }
}

// CLI interface
function main() {
  const args = process.argv.slice(2);
  // Default: read composed schema from caller's schema/ dir, or accept positional args
  const callerRoot = process.cwd();
  const inputSchema = args[0] || path.join(callerRoot, 'schema', 'SPECVERSE-SCHEMA.json');
  const outputPath = args[1] || path.join(callerRoot, 'schema', 'SPECVERSE-SCHEMA-AI.yaml');
  
  if (!fs.existsSync(inputSchema)) {
    console.error(`❌ Input schema not found: ${inputSchema}`);
    process.exit(1);
  }
  
  const converter = new SchemaConverter();
  converter.convert(inputSchema, outputPath);
  
  const verbose = process.env.VERBOSE === 'true';
  if (verbose) {
    console.log('\n📚 Generated AI-friendly YAML schema with:');
    console.log('  ✓ Complete SpecVerse feature coverage');
    console.log('  ✓ Comprehensive AI guidance comments');
    console.log('  ✓ Convention syntax patterns and examples');  
    console.log('  ✓ Lifecycle and behavior pattern guidance');
    console.log('  ✓ Import/export modularity examples');
    console.log('  ✓ Realistic examples for few-shot learning');
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { SchemaConverter };