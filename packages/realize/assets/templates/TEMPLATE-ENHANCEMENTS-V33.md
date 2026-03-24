# SpecVerse Template Enhancements for v3.3

**Date**: October 23, 2025
**Purpose**: Integrate v3.3 code generation testing into `specverse init` template
**Status**: ✅ Complete

---

## Overview

Enhanced the default `specverse init` template to include v3.3 code generation features, allowing new projects to immediately test code generation capabilities for ORM schemas, service layers, and route handlers.

## Changes Made

### 1. New Implementation Manifest ✨

**File**: `templates/default/manifests/implementation.yaml`

**Purpose**: Technology stack configuration for code generation

**Features**:
- ORM selection (Prisma/TypeORM)
- Server framework selection (Fastify/Express/NestJS)
- Database provider configuration
- v3.3 metadata strategy configuration:
  - ID strategy: uuid | integer | auto
  - Audit fields: true | false
  - Soft delete strategy: deletedAt | isDeleted
  - Status field: true | false
  - Version field (optimistic locking): true | false
- Environment variable templates

**Example**:
```yaml
implementation:
  orm: prisma
  server: fastify
  database:
    provider: postgresql
  metadata:
    idStrategy: uuid
    auditFields: true
    softDeleteStrategy: deletedAt
    statusField: true
    versionField: true
```

### 2. Enhanced Package Scripts 🔧

**File**: `templates/default/package.json`

**New Scripts**:
```json
{
  "generate:services": "Generate service layer code",
  "generate:routes": "Generate route handlers",
  "generate:orm": "Generate ORM schemas",
  "generate:code": "Generate all code (ORM + services + routes)",
  "generate:code:verify": "Generate code with verification messages",
  "test:generators": "Test code generators with verification"
}
```

**How They Work**:
- Use `node_modules/@specverse/lang/scripts/generate-*.js` scripts
- Read from `specs/main.specly` specification
- Use configuration from `manifests/implementation.yaml`
- Output to `generated/code/` directory

### 3. Updated Test Script 🧪

**File**: `templates/default/scripts/test-all.sh`

**New Step 8**: v3.3 Code Generator Testing
- Generates ORM schemas
- Generates service layer
- Generates route handlers
- Verifies v3.3 features:
  - ✅ Unified validation method
  - ✅ Optimistic locking support
  - ✅ Soft delete filtering

**Output Example**:
```bash
🔧 Step 8: Testing v3.3 code generators...
   → Generating ORM schemas...
   → Generating service layer...
   → Generating route handlers...
   → Verifying generated code...
   ✅ Service layer generated
   ✅ Route handlers generated
   ✅ Unified validation method present
   ✅ Optimistic locking support present
   ✅ Soft delete filtering present
```

### 4. v3.3 Example Specification 📝

**File**: `templates/default/specs/example-v33.specly`

**Purpose**: Complete example demonstrating all v3.3 features

**Includes**:
- Task model with full v3.3 metadata primitives
- Comment model with relationships
- CURED controllers with validate operations
- Events for all operations
- Development deployment configuration

**Metadata Example**:
```yaml
models:
  Task:
    metadata:
      id: uuid
      audit: true
      softDelete: deletedAt
      status: true
      version: true
    attributes:
      title: String required
      description: Text optional
```

**CURED Operations**:
```yaml
controllers:
  TaskController:
    model: Task
    cured:
      create: {}
      retrieve: {}
      retrieveMany: {}
      update: {}
      evolve: {}
      destroy: {}
      validate: {}    # ← v3.3 unified validation
```

### 5. Enhanced Documentation 📚

**File**: `templates/default/README.md`

**New Section**: "v3.3 Code Generation (NEW)"

**Content**:
- Quick start guide for code generation
- Code generator commands reference
- What gets generated (ORM/services/routes)
- v3.3 metadata primitives explanation
- Generated features list
- Tech stack support matrix

**File**: `templates/default/manifests/README.md`

**Updates**:
- Added `implementation.yaml` documentation
- Commands for code generation
- Use cases and features

---

## User Workflow

### For New Projects Created with `specverse init`

1. **Initialize project**:
   ```bash
   npx @specverse/lang init my-project
   cd my-project
   ```

2. **Use v3.3 example**:
   ```bash
   cp specs/example-v33.specly specs/main.specly
   ```

3. **Configure technology stack** (edit `manifests/implementation.yaml`):
   ```yaml
   implementation:
     orm: prisma          # or typeorm
     server: fastify      # or express, nestjs
   ```

4. **Generate code**:
   ```bash
   npm run generate:code
   # Or with verification:
   npm run test:generators
   ```

5. **Run full test suite**:
   ```bash
   npm test
   ```

### Generated Code Structure

```
my-project/
├── generated/
│   └── code/
│       ├── prisma/              # or entities/ for TypeORM
│       │   └── schema.prisma    # With v3.3 metadata
│       ├── services/
│       │   ├── task.service.ts  # With validate() method
│       │   └── comment.service.ts
│       └── routes/
│           ├── task/
│           │   ├── create.js
│           │   ├── update.js
│           │   └── validate.js  # ← Single unified endpoint
│           └── comment/
│               └── ...
```

---

## v3.3 Features Demonstrated

### 1. Unified Validation Architecture

**Service Method**:
```typescript
validate(data: any, context: { operation: 'create' | 'update' | 'evolve' }): {
  valid: boolean;
  errors: string[]
}
```

**Internal Calls**:
```typescript
async create(data) {
  const result = this.validate(data, { operation: 'create' });
  // ...
}
```

**External Endpoint**:
```
POST /api/tasks/validate
Body: { operation: "create", data: {...} }
```

### 2. Metadata Primitives

| Primitive | Purpose | Generated Code |
|-----------|---------|----------------|
| `id: uuid` | ID strategy | `@id @default(uuid())` (Prisma) |
| `audit: true` | Timestamps | `createdAt`, `updatedAt`, `createdBy`, `updatedBy` |
| `softDelete: deletedAt` | Soft delete | `deletedAt DateTime?` + filtering |
| `status: true` | Lifecycle | `status String` field |
| `version: true` | Optimistic locking | `version Int @default(0)` + checking |

### 3. ORM Support

**Prisma**:
- Schema annotations (`@default`, `@updatedAt`, etc.)
- Relationship mappings
- Database-specific types

**TypeORM**:
- Decorators (`@CreateDateColumn()`, `@VersionColumn()`, etc.)
- Entity relationships
- Repository patterns

### 4. Framework Support

**Fastify**:
- Route plugins with schemas
- Async/await handlers
- Reply helpers

**Express**:
- Router modules
- Middleware integration
- Error handling

**NestJS**:
- Controller decorators
- Dependency injection
- DTO classes

---

## Testing the Template

### Method 1: Local Testing

```bash
# From specverse-lang root
cd templates/default

# Install SpecVerse (simulates user environment)
npm install -g @specverse/lang

# Copy example to main spec
cp specs/example-v33.specly specs/main.specly

# Run code generation
npm run generate:code

# Verify generated code
ls -la generated/code/services/
ls -la generated/code/routes/
cat generated/code/services/task.service.ts | grep "validate(data"

# Run full test suite
npm test
```

### Method 2: Via Init Command

```bash
# Create new project from template
specverse init test-project
cd test-project

# Use v3.3 example
cp specs/example-v33.specly specs/main.specly

# Generate code
npm run generate:code

# Run tests
npm test
```

### Expected Results

**Step 8 Output**:
```
🔧 Step 8: Testing v3.3 code generators...
   → Generating ORM schemas...
   → Generating service layer...
   → Generating route handlers...
   → Verifying generated code...
   ✅ Service layer generated
   ✅ Route handlers generated
   ✅ Unified validation method present
   ✅ Optimistic locking support present
   ✅ Soft delete filtering present
```

**Generated Files**:
- ✅ `generated/code/prisma/schema.prisma` or `generated/code/entities/*.entity.ts`
- ✅ `generated/code/services/task.service.ts`
- ✅ `generated/code/services/comment.service.ts`
- ✅ `generated/code/routes/task/create.js`, `update.js`, `validate.js`, etc.
- ✅ `generated/code/routes/comment/*`

---

## Benefits

### For Users

1. **Immediate Testing**: New projects can immediately test code generation
2. **Clear Examples**: `example-v33.specly` demonstrates all v3.3 features
3. **Easy Configuration**: Single manifest file for technology stack
4. **Integrated Workflow**: Code generation integrated into test suite
5. **Production-Ready**: Generated code follows v3.3 best practices

### For Development

1. **Dogfooding**: Template uses actual generator scripts
2. **Verification**: Automated checking of v3.3 features
3. **Documentation**: Examples embedded in every new project
4. **Testing**: Easy to verify generators work end-to-end
5. **Feedback Loop**: Users immediately see code generation results

---

## Integration with Week 7 Work

This template enhancement directly builds on Week 7's code generator updates:

| Week 7 Deliverable | Template Integration |
|--------------------|----------------------|
| ORM generators (Prisma/TypeORM) | `npm run generate:orm` |
| Service generator with validation | `npm run generate:services` |
| Route generators (Fastify/Express/NestJS) | `npm run generate:routes` |
| Unified validation architecture | Example spec + verification |
| Metadata primitives | `implementation.yaml` config |
| End-to-end verification | Step 8 in `test-all.sh` |

---

## Files Modified/Created

### Created

1. `templates/default/manifests/implementation.yaml` - Technology stack configuration
2. `templates/default/specs/example-v33.specly` - Complete v3.3 example
3. `templates/TEMPLATE-ENHANCEMENTS-V33.md` - This documentation

### Modified

1. `templates/default/package.json` - Added 6 new generator scripts
2. `templates/default/scripts/test-all.sh` - Added Step 8 (generator testing)
3. `templates/default/README.md` - Added v3.3 Code Generation section (~90 lines)
4. `templates/default/manifests/README.md` - Added implementation.yaml documentation

---

## Next Steps

### For Users

After running `specverse init`:
1. Copy `specs/example-v33.specly` to `specs/main.specly`
2. Edit `manifests/implementation.yaml` to choose tech stack
3. Run `npm run generate:code`
4. Inspect generated code in `generated/code/`
5. Customize and integrate into your application

### For Future Development

1. **More Templates**: Add templates for different stacks (Next.js, Vue, Svelte)
2. **Interactive Setup**: Prompt for ORM/framework during init
3. **Validation Generator**: Add `npm run generate:validation` when Week 8 complete
4. **Event Bus Generator**: Add `npm run generate:events` when Week 8 complete
5. **Full Stack Templates**: Templates with frontend + backend

---

## Documentation References

- **Week 7 Summary**: `/docs/implementation-plans/v3.3-implementation/WEEK-7-COMPLETION-SUMMARY.md`
- **v3.3 Validation Architecture**: `CLAUDE.md` lines 434-566
- **Generator Scripts**: `scripts/generate-services.js`, `scripts/generate-routes.js`, `scripts/generate-prisma.js`
- **User Guide**: Template README.md

---

## Success Criteria

✅ **Template includes v3.3 manifest** - `implementation.yaml` created
✅ **Package scripts for generators** - 6 new scripts added
✅ **Test script includes generator testing** - Step 8 added with verification
✅ **Example spec with v3.3 features** - `example-v33.specly` created
✅ **Documentation updated** - README and manifest docs enhanced
✅ **User workflow documented** - Clear steps for using generators
✅ **Integration with Week 7** - Direct connection to generator updates

---

**Status**: ✅ **COMPLETE**

All template enhancements for v3.3 code generation testing are complete and ready for use with `specverse init`.

Users can now:
1. Create new projects with `specverse init`
2. Generate production-ready code with `npm run generate:code`
3. Test all generators with `npm test`
4. See v3.3 features in action immediately

---

*Generated: October 23, 2025*
*Related: Week 7 Code Generators Update*
*Template Version: v3.3.0*
