# SpecVerse Project - Claude Code Integration

This project uses SpecVerse v3.1.0 with AI-powered inference and the library ecosystem for 90% code reduction.

## Available SpecVerse Libraries

### 🚀 Deployment Libraries (1.5x - 5.8x expansion)
- **monolith**: `@specverse/deployments/monolith` - Single-instance deployment (1.5x) - Best for MVPs, internal tools
- **microservices**: `@specverse/deployments/microservices` - Distributed architecture (3.2x) - Best for scalable systems
- **jamstack**: `@specverse/deployments/jamstack` - Static + API (2.1x) - Best for content sites, blogs
- **enterprise**: `@specverse/deployments/enterprise` - Full compliance (5.8x) - Best for regulated industries

### 📊 Domain Libraries (Pre-built business models)
- **ecommerce**: `@specverse/domains/ecommerce` - Product, Order, Cart, Customer (PCI-DSS ready)
- **healthcare**: `@specverse/domains/healthcare` - Patient, Provider, Appointment (HIPAA compliant)

### ⚙️ Framework Libraries (Technology integration)
- **nextjs**: `@specverse/manifests/nextjs` - Next.js 14 React framework with SSR/SSG
- **postgresql**: `@specverse/manifests/postgresql` - PostgreSQL database with advanced querying
- **oauth**: `@specverse/manifests/oauth` - OAuth 2.0 authentication with multi-provider support
- **sqlite**: `@specverse/manifests/sqlite` - Embedded SQLite for development/local storage

## Claude Code AI Assistant Instructions

You are helping with SpecVerse v3.1.0 development. **Key principles:**

1. **Library-First Development**: Always suggest relevant libraries before writing custom code
2. **90% Code Reduction**: Use library imports to minimize boilerplate 
3. **AI Inference Awareness**: Specifications expand 4x-7.6x automatically
4. **Convention Over Configuration**: Leverage SpecVerse shorthand syntax

### When Working with Specifications

**Before making changes:**
- Read `specs/main.specly` to understand current architecture
- Identify opportunities to use library imports
- Check for existing models, controllers, deployments

**When suggesting additions:**
- Recommend appropriate libraries from the catalog above
- Show import syntax: `imports: ["@specverse/category/name"]`
- Focus on unique business logic, let libraries handle standards
- Use CURED operations: Create, Update, Retrieve, Evolve, Delete

**When generating specifications:**
```yaml
version: "3.1.0"

# Suggest relevant libraries first
imports:
  - "@specverse/deployments/[suggest appropriate pattern]"
  - "@specverse/domains/[suggest if applicable]"  
  - "@specverse/manifests/[suggest tech stack]"

components:
  ComponentName:
    # Focus on unique business requirements
    # Libraries handle 90% of boilerplate
```

### Current Library Recommendations

**For session context, suggest libraries based on:**
- Project type (web app → nextjs, microservice → microservices)
- Domain (store → ecommerce, clinic → healthcare) 
- Scale (small → monolith, enterprise → enterprise)
- Database needs (relational → postgresql, embedded → sqlite)

### Workflow Commands

```bash
# Validate specification
specverse validate specs/main.specly

# Process with AI inference (4x-7.6x expansion)
specverse process specs/main.specly

# Generate all diagrams  
specverse generate specs/main.specly --uml all

# Generate deployment diagram
specverse generate specs/main.specly --uml deployment
```

### File Context Injection

When analyzing user requests, automatically consider:
- Which deployment pattern fits their scale/complexity needs
- Whether ecommerce/healthcare domain models apply
- What technology stack manifests would help
- How to minimize custom code through library usage

**Example context enhancement:**
```
User request: "Add user authentication to my web app"

Enhanced context:
- Suggest: @specverse/manifests/oauth for authentication
- If e-commerce: Consider @specverse/domains/ecommerce for Customer model
- If web app: Consider @specverse/manifests/nextjs for framework
- Deployment: Suggest based on current project complexity
```

## Session Persistence

Track throughout the session:
- Libraries currently imported
- User preferences (tech stack, deployment pattern)
- Project context and domain
- Previous library suggestions and their adoption

## Working Directory Context

- **Main specification**: `specs/main.specly`
- **Generated outputs**: Check for existing `docs/` and `diagrams/` directories
- **Library usage**: Track which imports are already in use
- **Validation status**: Run validation after significant changes

---

**Remember: SpecVerse achieves 90% code reduction through library-first development. Always suggest relevant libraries before writing custom specifications.**