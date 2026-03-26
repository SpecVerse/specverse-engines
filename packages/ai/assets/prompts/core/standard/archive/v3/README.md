# SpecVerse Core Prompts v3.0

## Three-Layer Architecture

Version 3.0 introduces a fundamental architectural improvement: **complete separation of concerns through three distinct specification layers**. This addresses the critical gap identified in v2 where implementation details were conflated with logical architecture.

### The Three Layers

#### 1. Component Specification (WHAT)
**File**: `.specly`
**Purpose**: Defines the logical architecture - what the system does
**Contains**:
- Models with attributes and relationships
  - Supports array types: `String[]`, `Integer[]`, `Boolean[]` etc.
- Controllers with CURED operations
- Services with business operations
- Behaviors with **detailed algorithmic steps**
- Events and their payloads
- Views and UI structure

#### 2. Manifest Specification (HOW)
**File**: `.yaml`
**Purpose**: Defines implementation details - how to build the system
**Contains**:
- Technology stack selections
- Database schema mappings
- API patterns and formats
- File structure and organization
- Implementation-specific algorithms (SQL queries, etc.)
- Error handling patterns
- External service integrations

#### 3. Deployment Specification (WHERE)
**File**: `.specly` (deployments section)
**Purpose**: Defines runtime topology - where and how the system runs
**Contains**:
- Runtime instances configuration
- Environment-specific settings
- Scaling parameters
- Infrastructure components
- Monitoring and logging setup

## Prompt Improvements in v3

### Key Innovation: Behavior Steps as Implementation Guide

The most significant improvement in v3 is the use of **behavior steps** as a bridge between logical design and technical implementation:

```yaml
# In Component Spec (WHAT):
behaviors:
  checkBookingConflict:
    steps:
      - "Query bookings for same room"
      - "Check if new.check_in < existing.check_out"
      - "Check if new.check_out > existing.check_in"
      - "Return true if both conditions match"

# In Manifest (HOW):
business_logic_implementation:
  booking_conflict_detection:
    sql: "SELECT * FROM bookings WHERE room_id = $1 AND check_in < $3 AND check_out > $2"

# In Generated Code:
async function checkBookingConflict(roomId, checkIn, checkOut) {
  // Step 1: Query bookings for same room
  const result = await db.query(
    // Step 2 & 3: Check if dates overlap (from manifest SQL)
    'SELECT * FROM bookings WHERE room_id = $1 AND check_in < $3 AND check_out > $2',
    [roomId, checkIn, checkOut]
  );

  // Step 4: Return true if both conditions match
  return result.rows.length > 0;
}
```

## Prompt Usage Guide

### 1. `analyse.prompt.yaml` - Extract from Existing Code

**Purpose**: Reverse-engineer existing applications into three-layer specifications

**Workflow**:
```
Existing Code → analyse → Component + Manifest + Deployment Specs
```

**Key Features**:
- Extracts actual algorithms into behavior steps
- Captures SQL queries and technical patterns in manifest
- Preserves existing technology choices
- Documents actual implementation details

### 2. `create.prompt.yaml` - Generate from Requirements

**Purpose**: Create new specifications from natural language requirements

**Workflow**:
```
Requirements → create → Component + Manifest + Deployment Specs
```

**Key Features**:
- Generates detailed behavior steps for business logic
- Recommends appropriate technology stack in manifest
- Scales architecture to requirements (personal/business/enterprise)
- Includes implementation guidance

### 3. `materialise.prompt.yaml` - Clean Implementation from Extracted Specs

**Purpose**: Generate fresh implementation from extracted specs for comparison

**Workflow**:
```
Extracted Specs → materialise → Clean Implementation + Comparison Report
```

**Key Features**:
- Uses behavior steps as implementation blueprint
- Follows manifest patterns exactly
- Generates comparison report with original
- Identifies technical debt and improvements

### 4. `realize.prompt.yaml` - Full Implementation from Created Specs

**Purpose**: Generate complete application from created specifications

**Workflow**:
```
Created Specs → realize → Complete Application + Documentation
```

**Key Features**:
- Generates manifest if not provided
- Transforms behavior steps into commented code
- Creates full application scaffolding
- Includes tests based on behavior specs

## Migration from v2

### For Existing v2 Users

The main changes when migrating from v2 to v3:

1. **Behavior Steps are Required**: All behaviors, operations, and actions must include detailed `steps` arrays
2. **Manifest is Mandatory**: Technical details must be in a separate manifest, not mixed with components
3. **Clear Layer Separation**: Keep logical, technical, and operational concerns strictly separated

### Breaking Changes

- Component specs no longer contain technical implementation details
- Manifests are now required (not optional)
- Behavior steps must be detailed algorithms, not high-level descriptions

## Examples

### Complete Three-Layer Specification

```yaml
# component.specly
components:
  MySystem:
    models:
      User:
        attributes:
          email: Email required unique
          roles: String[] optional
          tags: String[] optional
        behaviors:
          authenticate:
            steps:
              - "Hash provided password"
              - "Query user by email"
              - "Compare hashed passwords"
              - "Generate JWT if match"
              - "Return token or error"

# manifest.yaml
manifest:
  technology_stack:
    backend:
      framework: "Express"
      auth: "JWT with bcrypt"

  business_logic_implementation:
    password_hashing:
      algorithm: "bcrypt"
      rounds: 10
    token_generation:
      secret: "from environment"
      expiry: "24h"

# deployment in component.specly
deployments:
  production:
    instances:
      controllers:
        apiServer:
          component: "MySystem"
          scale: 3
```

## Best Practices

### 1. Writing Behavior Steps

**Good**:
```yaml
steps:
  - "Query database for user with email"
  - "If user not found, return error 404"
  - "Compare provided password with stored hash"
  - "If passwords don't match, return error 401"
  - "Generate JWT with user ID and roles"
  - "Return token with 200 status"
```

**Bad**:
```yaml
steps:
  - "Authenticate user"
  - "Return result"
```

### 2. Manifest Completeness

Always include in manifests:
- Complete technology stack
- Database schema mappings
- API response formats
- Error handling patterns
- File structure organization
- Environment configurations

### 3. Layer Separation

**Component**: Business logic only (no SQL, no framework specifics)
**Manifest**: All technical details (SQL, frameworks, libraries)
**Deployment**: Runtime only (scaling, monitoring, infrastructure)

## Validation

All v3 prompts include validation to ensure:

1. **Component specs** validate against SpecVerse v3.1 schema
2. **Manifests** include all required sections
3. **Behavior steps** are detailed and actionable
4. **Generated code** traces back to specification steps

## Performance Considerations

v3 prompts are configured for:
- **Higher token limits** (12000-15000) to handle three layers
- **Lower temperature** (0.2-0.4) for consistent generation
- **Structured outputs** for reliable parsing

## Future Roadmap

Planned improvements for v3.x:
- Automated manifest library management
- Behavior step validation and linting
- Cross-layer consistency checking
- Test generation from behavior specs
- Migration path automation from v2

## Support

For issues or questions about v3 prompts:
- Review examples in each prompt file
- Check validation errors carefully
- Ensure proper layer separation
- Verify behavior steps are detailed

## Version History

- **v3.0.0** (2024-01-XX): Three-layer architecture, behavior steps as code
- **v2.0.0** (2024-01-01): Consolidated prompts, reference-based
- **v1.0.0** (2023-12-01): Initial prompt structure