# Test View Generation - View Inference Test

**File**: `test-view-generation.specly`

## Overview

Test specification for validating automatic view generation and inference rules.

## Purpose

This is a **test file** used to verify:
- Automatic CRUD view generation
- View inference rules
- Controller-based view architecture
- Specialist view types

## Key Features

- **Product Model**: E-commerce product with categories
- **Supplier Model**: Related entity
- **Review Model**: User-generated content
- **Automatic Views**: Tests view inference

## Models

### Product
- Name, description, price
- Category with enum values
- Stock management
- Supplier and review relationships

### Supplier
- Company information
- Email contact
- Unique constraints

### Review
- Rating and content
- Product relationship

## Usage

```bash
# Validate view inference
specverse validate examples/11-view-inference/test-view-generation.specly

# Run inference to see generated views
specverse infer examples/11-view-inference/test-view-generation.specly -o /tmp/views-inferred.specly
```

## Expected Inferred Views

The inference engine should automatically generate:
- **ProductForm**: Create/edit products
- **ProductList**: Browse products
- **ProductDetail**: View product details
- **SupplierForm**: Supplier management
- **ReviewList**: Review display

## Related Examples

- `09-01-automatic-crud-views.specly` - CRUD view patterns
- `09-02-specialist-dashboard.specly` - Dashboard views
- `09-03-explicit-override.specly` - Custom view definitions
- `09-04-all-specialist-types.specly` - All view types
