# SpecVerseFundamentals

Example 01-01: Basic model definition with attributes

**Version:** 1.0.0  
**Generated:** 2025-09-29T17:21:55.605Z

## Table of Contents

- [Overview](#overview)
- [Models](#models)
  - [Product](#product)

## Overview

### Component Statistics

| Component Type | Count |
|----------------|-------|
| Models | 1 |
| Controllers | 0 |
| Services | 0 |
| Views | 0 |
| Events | 0 |

### Imports


### Exports

**SpecVerseFundamentals:**
- **models:** Product

## Models

### Product

Simple product with basic attributes

#### Attributes

| Name | Type | Required | Unique | Description |
|------|------|----------|--------|-------------|
| id | UUID | ✓ |  |  |
| name | String | ✓ |  |  |
| summary | String |  |  |  |
| price | Money | ✓ |  |  |
| inStock | Boolean |  |  | Default: true |
| category | String | ✓ |  |  |
| contactEmail | Email |  |  |  |

#### Behaviors

##### attachProfile

Attach a profile to this model instance

**Parameters:**
- `profileName`: String (required)

**Returns:** Boolean

**Preconditions:**
- Profile exists and is compatible with this model

**Postconditions:**
- Profile is attached
- Profile attributes are available

##### detachProfile

Detach a profile from this model instance

**Parameters:**
- `profileName`: String (required)

**Returns:** Boolean

**Preconditions:**
- Profile is currently attached

**Postconditions:**
- Profile is detached
- Profile attributes are no longer available

##### hasProfile

Check if a profile is attached to this model instance

**Parameters:**
- `profileName`: String (required)

**Returns:** Boolean

---
