# SpecVerse V5 Prompts - Unified Architecture with Standardized Libraries

**Version**: 5.0.0
**Date**: September 19, 2025
**SpecVerse Compatibility**: v3.2.0+
**Status**: Latest - Aligned with unified manifest architecture

## Overview

V5 prompts represent the latest evolution of SpecVerse prompt engineering, fully aligned with:
- **SpecVerse v3.2.0** unified architecture
- **Unified manifest container format**
- **@specverse/standards** library ecosystem
- **Simplified schema** (deprecated v2.5.0 features removed)
- **Production-ready deployment patterns**

## Key Improvements Over V4

### **1. Version Alignment**
- **V4**: Used specVersion "3.1.0"
- **V5**: Uses specVersion "3.2.0" throughout

### **2. Standardized Library Integration**
- **V4**: Manual library references
- **V5**: Integrated @specverse/standards ecosystem
  - `@specverse/standards/nextjs`
  - `@specverse/standards/nestjs`
  - `@specverse/standards/database`

### **3. Unified Container Format**
- **V4**: Separate manifest files
- **V5**: Unified container format with manifest wrapper
  ```yaml
  ---
  # SpecVerse Unified Format - Manifest Container
  manifests:
    MyManifest:
      specVersion: "3.2.0"
      # ... unified content
  ```

### **4. Simplified Schema Compliance**
- **V4**: Referenced deprecated v2.5.0 features
- **V5**: Aligned with simplified v3.2.0 schema
  - Removed complex behavior mappings
  - Simplified capability mappings with `implementationType`
  - Clean deployment instance patterns

## Prompt Suite

### **create.prompt.yaml** (5.0.0)
**Purpose**: Generate complete SpecVerse v3.2.0 specifications from requirements

**Key Features**:
- Three-layer architecture (Component/Manifest/Deployment)
- Unified container format for manifests
- @specverse/standards library integration
- Scale-appropriate complexity (personal → enterprise)
- v3.2.0 schema compliance

**Example Output**:
```yaml
components:
  MyApp:
    version: "3.2.0"
    models: { ... }

manifests:
  MyAppManifest:
    specVersion: "3.2.0"
    import:
      - library: "@specverse/standards/nextjs"
        select: ["controller", "authentication"]

deployments:
  production:
    version: "3.2.0"
    environment: production
    instances: { ... }
```

### **analyse.prompt.yaml** (5.0.0)
**Purpose**: Extract v3.2.0 specifications from existing codebases

**Key Features**:
- Framework detection and mapping to standard libraries
- Unified manifest extraction from existing implementations
- Accurate reverse engineering (what IS, not what SHOULD BE)
- v3.2.0 schema compliance
- Technology stack mapping to @specverse/standards

**Supported Frameworks**:
- Next.js → `@specverse/standards/nextjs`
- NestJS → `@specverse/standards/nestjs`
- Express, Django, Rails, Spring Boot
- PostgreSQL, MongoDB, Redis → `@specverse/standards/database`

### **materialise.prompt.yaml** (5.0.0)
**Purpose**: Generate implementation guidance and code scaffolding

**Key Features**:
- Framework-specific code templates
- Modern best practices and patterns
- Configuration file generation
- Development workflow setup
- Production-ready code quality

**Supported Outputs**:
- Project structure and file organization
- Implementation templates (models, controllers, services)
- Configuration setup (database, auth, environment)
- Development guidance and testing strategies
- Deployment preparation

### **realize.prompt.yaml** (5.0.0)
**Purpose**: Generate production deployment configurations

**Key Features**:
- Infrastructure as Code (IaC) templates
- Container orchestration (Kubernetes, Docker)
- CI/CD pipeline definitions
- Monitoring and observability setup
- Security and compliance configurations

**Supported Platforms**:
- AWS, Azure, GCP
- Kubernetes, Docker
- Enterprise and hybrid deployments
- Multi-environment configurations

## Usage Examples

### **Creating Specifications**
```bash
# Use V5 create prompt
specverse ai create --pver v5 -r "Simple guesthouse booking system"

# Expected output: Complete v3.2.0 specification with unified manifests
```

### **Analyzing Codebases**
```bash
# Use V5 analyse prompt
specverse ai analyse --pver v5 /path/to/existing/app

# Expected output: Extracted v3.2.0 specs with library mappings
```

### **Materializing Implementation**
```bash
# Use V5 materialise prompt
specverse ai materialise --pver v5 spec.specly --target nextjs

# Expected output: Complete Next.js project scaffolding
```

### **Realizing Deployment**
```bash
# Use V5 realize prompt
specverse ai realize --pver v5 spec.specly --cloud aws --env production

# Expected output: Production AWS infrastructure templates
```

## Integration with Demo AI Framework

The V5 prompts are designed to integrate with the demo AI testing framework:

### **Test Configuration Update**
```yaml
prompt_versions:
  v5:
    path: "prompts/core/standard/v5"
    name: "Unified Architecture Prompts (v5)"
    description: "v3.2.0 compliant with standardized libraries and unified manifests"
```

### **Benchmark Expectations**
- **Expansion Ratios**: Maintain 4x-8x expansion from V1 benchmarks
- **Validation Success**: 100% v3.2.0 schema compliance
- **Library Integration**: Proper @specverse/standards usage
- **Unified Format**: All manifests use container format

## Quality Assurance

### **Schema Compliance**
- All outputs validate against v3.2.0 schema
- No deprecated v2.5.0 features
- Unified container format required
- Proper library imports and extensions

### **Performance Targets**
- Generation time: <5 seconds
- Expansion ratio: 4x-8x (scale-dependent)
- Validation success: 100%
- Framework compatibility: 95%+

### **Best Practices**
- Production-ready code quality
- Modern framework patterns
- Security and compliance standards
- Scalability and maintainability

## Migration from V4

To update from V4 to V5 prompts:

1. **Update test configuration** to reference v5 prompts
2. **Verify schema compatibility** with v3.2.0
3. **Test library integration** with @specverse/standards
4. **Validate unified format** output
5. **Run demo AI framework** to compare results

## Future Evolution

V5 prompts establish the foundation for:
- **Advanced AI orchestration** with multi-step workflows
- **Domain-specific optimizations** for industry verticals
- **Integration patterns** with external systems and APIs
- **Enhanced deployment strategies** for cloud-native architectures

---

**Recommended Usage**: V5 prompts are the current standard for all SpecVerse AI operations. They provide the most accurate, up-to-date, and production-ready specifications aligned with the latest SpecVerse architecture.