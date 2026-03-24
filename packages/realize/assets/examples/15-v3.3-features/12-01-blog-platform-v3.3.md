# Blog Platform Example (v3.3 Features)

**Category:** v3.3 New Features Showcase
**Complexity:** Advanced
**Features Demonstrated:** Metadata Primitives, Validate Operation

---

## Overview

This example demonstrates the two major new features introduced in SpecVerse v3.3:

1. **Metadata Primitives** - Reduce boilerplate by 90% with auto-generated common fields
2. **Validate Operation** - Dry-run validation endpoints without database side effects

The blog platform implements a complete content management system with:
- User management with audit trails
- Blog posts with lifecycle management and optimistic locking
- Comments with moderation workflow
- Tagging system

---

## v3.3 Feature 1: Metadata Primitives

### Problem Solved

**Before v3.3**, every model required repetitive boilerplate:

```yaml
models:
  User:
    attributes:
      id: UUID required unique          # Repeat this
      createdAt: Timestamp required     # for every
      updatedAt: Timestamp required     # single
      deletedAt: Timestamp              # model
      isDeleted: Boolean default=false  # in your app
      username: String required
      email: Email required
```

**After v3.3**, use metadata primitives:

```yaml
models:
  User:
    metadata:
      id: uuid          # Auto-generates: id: UUID required unique
      audit: true       # Auto-generates: createdAt, updatedAt, createdBy, updatedBy
      softDelete: true  # Auto-generates: deletedAt, isDeleted
      label: username   # UI display field hint
    attributes:
      username: String required
      email: Email required
```

### Metadata Types Demonstrated

#### 1. **ID Generation** (`id`)

```yaml
metadata:
  id: uuid  # Generates UUID primary key with auto-generation
```

**Strategies:**
- `uuid` - Auto-generated UUID (default for most databases)
- `integer` - Auto-increment integer (traditional SQL)
- `auto` - Platform-specific (UUID for modern, integer for legacy)
- `manual` - User must provide ID
- `composite` - Multiple fields as primary key

**Example in this spec:**
- All models use `id: uuid`

---

#### 2. **Audit Fields** (`audit`)

```yaml
metadata:
  audit: true  # Generates: createdAt, updatedAt, createdBy, updatedBy
```

**Generated Fields:**
- `createdAt: Timestamp` - When record was created
- `updatedAt: Timestamp` - When record was last updated
- `createdBy: String` - User who created the record
- `updatedBy: String` - User who last updated the record

**Example in this spec:**
- All models have `audit: true` for complete audit trails

---

#### 3. **Soft Delete** (`softDelete`)

```yaml
metadata:
  softDelete: true  # Generates: deletedAt, isDeleted
```

**Generated Fields:**
- `deletedAt: Timestamp` - When record was soft-deleted (nullable)
- `isDeleted: Boolean` - Flag indicating soft-delete status

**Why use soft delete?**
- Preserve data for audit/compliance
- Enable "undo" functionality
- Maintain referential integrity
- Support data recovery

**Example in this spec:**
- User, Post, Comment all use soft delete (Tags don't, for simplicity)

---

#### 4. **Status Field from Lifecycle** (`status`)

```yaml
metadata:
  status: publishing  # Derives status from lifecycle states
lifecycles:
  publishing:
    states: [draft, review, published, archived]
```

**Generated Field:**
```typescript
{
  name: "status",
  type: "String",
  required: true,
  default: "draft",  // First state in lifecycle
  values: ["draft", "review", "published", "archived"]
}
```

**Example in this spec:**
- Post uses `status: publishing` (draft → review → published → archived)
- Comment uses `status: moderation` (pending → approved → rejected → flagged)

---

#### 5. **Version Field** (`version`)

```yaml
metadata:
  version: true  # Generates: version: Integer for optimistic locking
```

**Generated Field:**
```typescript
{
  name: "version",
  type: "Integer",
  required: true,
  default: 1,
  auto: true  // Auto-incremented on updates
}
```

**Why use versioning?**
- **Optimistic Locking** - Prevent concurrent update conflicts
- **Change Tracking** - Know how many times a record has been modified
- **Conflict Detection** - Safely handle multi-user editing

**Example in this spec:**
- Post has `version: true` (critical for blog posts being edited concurrently)

---

#### 6. **Label Field** (`label`)

```yaml
metadata:
  label: username  # Tells UIs to use 'username' as display field
```

**Purpose:**
- No synthetic field generated
- Provides hint to UI generators about which field to use as display label
- Can be single field or array: `label: [firstName, lastName]`

**Example in this spec:**
- User: `label: username`
- Post: `label: title`
- Comment: `label: content`
- Tag: `label: name`

---

## v3.3 Feature 2: Validate Operation

### Problem Solved

**Before v3.3**, validation required database writes:

```typescript
// Client must POST to /api/users to validate
// This WRITES to the database even if just checking validation!
POST /api/users
{
  "username": "a",  // Too short - but already in DB!
  "email": "invalid-email"  // Invalid - but DB write happened!
}
```

**After v3.3**, use dry-run validation:

```typescript
// Validate without side effects
POST /api/users/validate
{
  "username": "a",  // Returns validation errors
  "email": "invalid-email"  // No database write occurs
}

// Response:
{
  "valid": false,
  "errors": [
    "username length >= 3",
    "email is valid"
  ]
}
```

### Validate Configurations Demonstrated

#### 1. **Simple Boolean Form**

```yaml
controllers:
  UserController:
    cured:
      create: { ... }
      update: { ... }
      validate: true  # Enable validation for create and update
```

**Generated Endpoints:**
- `POST /api/users/validate` - Validate create operation
- `PUT /api/users/:id/validate` - Validate update operation

**Default Behavior:**
- Operations: `[create, update]`
- Endpoint: `/validate`
- Mode: `strict` (fail on first error)

**Example in this spec:**
- UserController uses `validate: true`
- TagController uses `validate: true`

---

#### 2. **Advanced Object Form**

```yaml
controllers:
  PostController:
    cured:
      create: { ... }
      update: { ... }
      evolve: { ... }
      validate:
        operations: [create, update, evolve]  # Custom operations
        endpoint: /validate                   # Custom path
        mode: strict                          # Validation mode
```

**Generated Endpoints:**
- `POST /api/posts/validate` - Validate create
- `PUT /api/posts/:id/validate` - Validate update
- `PATCH /api/posts/:id/evolve/validate` - Validate lifecycle transition

**Configuration Options:**
- `operations` - Which operations to validate (create, update, evolve)
- `endpoint` - Custom endpoint path (default: `/validate`)
- `mode` - `strict` (fail fast) or `lenient` (collect all errors)

**Example in this spec:**
- PostController validates create, update, and evolve with strict mode
- CommentController validates create and update with lenient mode

---

## Generated Code Impact

### Metadata Primitives

**User Model Expansion:**

Input (3 metadata declarations):
```yaml
metadata:
  id: uuid
  audit: true
  softDelete: true
```

Output (7 synthetic attributes):
```typescript
{
  id: UUID (required, unique, auto),
  createdAt: Timestamp (required, auto),
  updatedAt: Timestamp (required, auto),
  createdBy: String (auto),
  updatedBy: String (auto),
  deletedAt: Timestamp,
  isDeleted: Boolean (default: false)
}
```

**Post Model Expansion:**

Input (5 metadata declarations):
```yaml
metadata:
  id: uuid
  audit: true
  softDelete: true
  status: publishing
  version: true
```

Output (10 synthetic attributes):
```typescript
{
  id: UUID (required, unique, auto),
  createdAt: Timestamp (required, auto),
  updatedAt: Timestamp (required, auto),
  createdBy: String (auto),
  updatedBy: String (auto),
  deletedAt: Timestamp,
  isDeleted: Boolean (default: false),
  status: String (required, default: "draft", values: [...]),
  version: Integer (required, default: 1, auto)
  // + user-defined attributes
}
```

### Validate Operation

**UserController Endpoints:**

Input:
```yaml
validate: true
```

Output (4 endpoints):
```
POST   /api/users              (create - normal)
PUT    /api/users/:id          (update - normal)
POST   /api/users/validate     (create - validation)
PUT    /api/users/:id/validate (update - validation)
```

**PostController Endpoints:**

Input:
```yaml
validate:
  operations: [create, update, evolve]
  mode: strict
```

Output (6 endpoints):
```
POST   /api/posts                  (create - normal)
PUT    /api/posts/:id              (update - normal)
PATCH  /api/posts/:id/evolve       (evolve - normal)
POST   /api/posts/validate         (create - validation, strict)
PUT    /api/posts/:id/validate     (update - validation, strict)
PATCH  /api/posts/:id/evolve/validate (evolve - validation, strict)
```

---

## Use Cases

### 1. Multi-Step Form Validation

**Scenario:** Blog post creation wizard with 3 steps

**Step 1: Basic Info**
```typescript
POST /api/posts/validate
{
  "title": "My First Post",
  "slug": "my-first-post"
}
// Validates title and slug without creating post
```

**Step 2: Content**
```typescript
POST /api/posts/validate
{
  "title": "My First Post",
  "slug": "my-first-post",
  "content": "Lorem ipsum..."
}
// Validates all fields, still no DB write
```

**Step 3: Publish**
```typescript
POST /api/posts
{
  "title": "My First Post",
  "slug": "my-first-post",
  "content": "Lorem ipsum...",
  "excerpt": "Brief summary"
}
// Actually creates the post
```

### 2. Bulk Import Validation

**Scenario:** Import 1000 blog posts from another platform

```typescript
// Validate all posts first
POST /api/posts/validate
{
  "items": [
    { "title": "Post 1", "content": "..." },
    { "title": "Post 2", "content": "..." },
    // ... 1000 items
  ]
}

// Response tells which posts are invalid
{
  "results": [
    { "valid": true, "errors": [] },
    { "valid": false, "errors": ["content length >= 100"] },
    // ...
  ]
}

// Only import valid posts
```

### 3. Real-Time Validation (UX)

**Scenario:** Validate as user types (debounced)

```typescript
// User types email in registration form
onEmailBlur(async (email) => {
  const result = await fetch('/api/users/validate', {
    method: 'POST',
    body: JSON.stringify({ email })
  });

  if (!result.valid) {
    showError(result.errors);  // "email is valid"
  }
});
```

### 4. Optimistic Locking with Versioning

**Scenario:** Two users edit the same blog post

**User A fetches post:**
```json
{
  "id": "123",
  "title": "Original Title",
  "version": 5
}
```

**User B fetches post (same version):**
```json
{
  "id": "123",
  "title": "Original Title",
  "version": 5
}
```

**User A updates successfully:**
```typescript
PUT /api/posts/123
{
  "title": "User A's Edit",
  "version": 5  // Matches current version
}
// Success! Version becomes 6
```

**User B tries to update:**
```typescript
PUT /api/posts/123
{
  "title": "User B's Edit",
  "version": 5  // Stale! Current version is now 6
}
// Error: "Post version matches (optimistic locking)" fails
// User B must refetch and resolve conflicts
```

---

## Benefits Summary

### Metadata Primitives

✅ **90% less boilerplate code**
- 5 metadata declarations vs 10 attribute definitions

✅ **Explicit intent**
- `audit: true` vs guessing field names

✅ **Consistent code generation**
- No more "createdAt" vs "created_at" vs "dateCreated" confusion

✅ **Better TypeScript types**
- Auto-generated fields have correct types and constraints

### Validate Operation

✅ **Single source of truth**
- Validation rules in spec, enforced everywhere

✅ **Better UX**
- Real-time validation without DB overhead

✅ **Easier testing**
- Test validation without transaction overhead

✅ **Shared validation logic**
- Frontend and backend use same validation

---

## Running This Example

### 1. Validate the Specification

```bash
specverse validate examples/12-v3.3-features/12-01-blog-platform-v3.3.specly
```

### 2. Generate AI-Optimized Views

```bash
specverse gen views examples/12-v3.3-features/12-01-blog-platform-v3.3.specly
```

### 3. Inspect Generated Metadata

The AI view will show:
- All synthetic attributes generated from metadata
- All validation endpoints generated from validate operation

### 4. Generate Diagrams

```bash
specverse gen uml examples/12-v3.3-features/12-01-blog-platform-v3.3.specly
```

---

## Migration from v3.2

If you have an existing v3.2 specification, you can migrate to v3.3 metadata:

**Before (v3.2):**
```yaml
models:
  User:
    attributes:
      id: UUID required unique
      createdAt: Timestamp required
      updatedAt: Timestamp required
      deletedAt: Timestamp
      isDeleted: Boolean default=false
      username: String required
```

**After (v3.3):**
```yaml
models:
  User:
    metadata:
      id: uuid
      audit: true
      softDelete: true
      label: username
    attributes:
      username: String required
```

**Benefits:**
- 5 lines → 1 line (4 metadata declarations)
- Explicit intent vs implicit pattern matching
- Generated code respects metadata semantics

---
