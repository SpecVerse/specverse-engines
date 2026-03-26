# Minimal SpecVerse v3.2 Syntax Reference

**Pure syntax patterns with no business domain distractions**

This is the complete **minimal complete specification** showing every SpecVerse feature using simple, generic names like `Model1`, `Event1`, `Controller1`. Perfect for:

- **Quick syntax lookup** without business logic noise
- **Copy-paste templates** for rapid development  
- **AI training examples** focused purely on structure
- **Schema testing** with minimal data
- **Syntax validation** during development

## Design Philosophy

This minimal reference focuses on **syntax over semantics**:

| Aspect | Approach | Benefit |
|--------|----------|----------|
| **Names** | Generic (`Model1`, `Service1`, `Controller1`) | Focus on structure, not domain |
| **Attributes** | Simple (`name`, `title`, `count`, `active`) | Clear syntax patterns |
| **Examples** | Minimal 2-3 instances per section | Essential patterns only |
| **Size** | ~200 lines with core features | Quick reference lookup |
| **Purpose** | Syntax validation and copy-paste templates | Rapid development support |

## What This Shows

### ✅ **Minimal Multiples Pattern**
Every section shows exactly **2-3 instances** to demonstrate structure:

```yaml
models:
  Model1:          # First model
    attributes:
      id: UUID required
      name: String required
  
  Model2:          # Second model  
    attributes:
      id: UUID required
      title: String required
```

### ✅ **Essential Syntax Only**
No complex business logic, just the structural patterns:

```yaml
controllers:
  Controller1:
    actions:
      create:        # First action
        parameters:
          name: String required
        returns: Model1
      
      update:        # Second action
        parameters:
          id: UUID required
        returns: Model1
```

### ✅ **Generic Property Names**
Simple, numbered names that focus attention on syntax:

- **Models**: `Model1`, `Model2`
- **Attributes**: `name`, `title`, `count`, `active`
- **Actions**: `create`, `update`, `delete`
- **Operations**: `operation1`, `operation2`, `operation3`
- **Events**: `Event1`, `Event2`
- **Deployments**: `deployment1`, `deployment2`

### ✅ **Complete Schema Coverage**
Shows **every single SpecVerse v3.2 feature** including previously missing ones:

```yaml
# Model with ALL features
models:
  Model1:
    profiles: ["Profile1", "Profile2"]  # ✅ Runtime profile state
    attributes:     # ✅ Required wrapper
      id: UUID required
    relationships:  # ✅ Multiple relationships
      related: hasMany Model2
    behaviors:      # ✅ Multiple behaviors with steps
      action1:
        parameters: # ✅ NOT "payload"
          param1: String required
        steps: ["Validate input", "Process", "Return"] # ✅ Steps property
        publishes: [Event1]  # ✅ NOT "events"
  
  Model2:
    profile-attachment:  # ✅ Profile attachment config
      profiles: ["Model1", "Model3"]
      conditions:
        status: "active"
      priority: 10

# Controller with ALL features
controllers:
  Controller1:
    subscribes_to: ["Event1", "Event2"]  # ✅ Event subscriptions
    cured:          # ✅ CURVED operations
      create:
        parameters:
          data: Object required
        publishes: [Event1]
      retrieve:
        parameters:
          id: UUID required
    actions:        # ✅ Custom actions
      create:
        parameters: # ✅ Correct property name
          name: String required

# Service with ALL features
services:
  Service1:
    subscribes_to:  # ✅ Both subscription formats
      Event1: "handleEvent1"  # Object format
      Event2: "handleEvent2"
    operations:     # ✅ Required wrapper
      operation1:
        parameters: # ✅ Correct property name
          input1: String required
        steps: ["Initialize", "Calculate", "Finalize"]  # ✅ Steps
```

## Usage Patterns

### 🔍 **Quick Syntax Lookup**
```bash
# Find the right property name
grep -A 5 "operations:" 00-01-minimal-syntax-reference.specly
# See: parameters: (not payload:)
```

### 📋 **Copy-Paste Template**
```yaml
# Copy this structure for new models
Model1:
  attributes:
    id: UUID required
    name: String required
  relationships:
    related: hasMany Model2
  behaviors:
    action1:
      parameters:
        param1: String required
      returns: Boolean
```

### 🤖 **AI Training Example**
Shows pure patterns without domain complexity - ideal for teaching AI assistants correct SpecVerse syntax.

## Files

- `00-01-minimal-syntax-reference.specly` - Minimal complete specification (~200 lines)
- `00-01-minimal-syntax-reference.md` - This documentation

## Validation

```bash
specverse validate examples/00-reference/00-01-minimal-syntax-reference.specly
# ✅ Validation successful!
```

This minimal reference provides the **fastest path to correct SpecVerse syntax** without the complexity of real-world examples.