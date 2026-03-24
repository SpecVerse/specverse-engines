# Common Definitions

This directory contains common type definitions used across SpecVerse examples.

## Architecture

The `common-definitions.yaml` file demonstrates **two important patterns** for type usage in SpecVerse v3.2:

### 1. **Importing Basic Types from Libs**
```yaml
import:
  - file: ../../libs/primitives/lib/index.yaml
    select: [UUID, Email, DateTime, Date, Text, Integer, Boolean, Money, Address, URL, PhoneNumber]
```

Basic primitive and business types are imported from the SpecVerse primitives system, which serves as the **source of truth** for standard primitives.

### 2. **Defining Example-Specific Composite Types**
```yaml
models:
  ContactInfo:
    description: "Complete contact information"
    attributes:
      email: Email              # ← Uses imported type
      phone: PhoneNumber        # ← Uses imported type
      address: Address optional # ← Uses imported type as embedded attribute
```

The file defines composite types that combine imported basic types into domain-specific structures.

## Type Usage Patterns

### **Imported Types as Attributes**
Basic primitives from libs are used directly as attributes:
```yaml
ContactInfo:
  attributes:
    email: Email           # Primitive type from libs
    address: Address       # Embedded object from libs
```

### **Local Models as Relationships**
Models defined within the same component use relationships:
```yaml
ContactPerson:
  relationships:
    name: belongsTo PersonName     # ← Local model
    contact: belongsTo ContactInfo # ← Local model
```

## Available Types

### **Imported from Libs (11 types)**
- **Primitives**: UUID, DateTime, Date, Text, Integer, Boolean
- **Business**: Email, Money, Address, URL, PhoneNumber

### **Example-Specific Models (10 types)**
- **Contact**: ContactInfo, PersonName, ContactPerson
- **Business**: PaymentTerms
- **System**: FileInfo, AuditEntry, KeyValuePair, ErrorInfo, Tag, SemanticVersion

## Usage in Examples

This common definitions file is imported by multiple example categories:
- **01-fundamentals**: Basic modeling patterns
- **03-architecture**: Advanced architectural patterns
- **04-domains**: Domain-specific modeling
- **07-legacy-conversions**: Legacy system conversions

## Benefits

1. **No Duplication**: Basic primitives come from libs, eliminating redundancy
2. **Consistency**: All examples use the same standard primitives
3. **Maintainability**: Single source of truth for basic primitives
4. **Flexibility**: Examples can define domain-specific composite types

This architecture demonstrates SpecVerse best practices for primitives system organization and reuse.