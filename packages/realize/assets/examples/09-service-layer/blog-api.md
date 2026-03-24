# Blog API - Service Layer Example

**File**: `blog-api.specly`

## Overview

Complete blog API specification demonstrating service layer architecture with users, posts, and comments.

## Key Features

- **User Management**: User model with authentication attributes
- **Blog Posts**: Post model with rich metadata
- **Comments**: Comment model with relationships
- **Service Layer**: Demonstrates service-oriented architecture

## Models

### User
- Email and username authentication
- Profile information (bio, avatar)
- Timestamps for audit trail
- Relationships: posts, comments

### Post
- Content management (title, body)
- Publishing workflow
- Author relationship
- Comment collection

### Comment
- User-generated content
- Post relationship
- Moderation support

## Usage

```bash
# Validate
specverse validate examples/09-service-layer/blog-api.specly

# Generate inference
specverse infer examples/09-service-layer/blog-api.specly
```

## Related Examples

- `03-architecture/03-03-services-and-events.specly` - Service patterns
- `01-fundamentals/01-04-models-with-relations.specly` - Relationships
