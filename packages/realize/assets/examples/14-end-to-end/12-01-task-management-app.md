# Task Management App - Complete End-to-End Example

**File**: `12-01-task-management-app.specly`

## Overview

Complete full-stack task management application demonstrating the entire SpecVerse architecture from frontend to backend with real-time updates.

## Purpose

This is a **comprehensive example** showing:
- Full-stack application architecture
- React frontend with views
- Fastify API backend
- Event-driven architecture
- Real-time notifications
- Complete CRUD workflows

## Key Features

- **User Management**: Authentication and profiles
- **Task Management**: Complete task lifecycle
- **Project Organization**: Project-based task grouping
- **Real-Time Updates**: Event-driven notifications
- **Service Layer**: Business logic separation
- **View Layer**: React components

## Models

### User
- Authentication (username, email)
- Profile information (displayName, avatar)
- Active status tracking
- Assigned tasks relationship

### Task
- Title and description
- Status workflow (todo, in_progress, done, blocked)
- Priority levels
- Due dates
- User and project relationships

### Project
- Project management
- Task collection
- Owner relationship

## Services

### NotificationService
- User notification handling
- Real-time event processing

### TaskAssignmentService
- Task assignment logic
- User workload management

## Views

### TaskListView
- Browse all tasks
- Filter and sort
- Quick actions

### TaskDetailView
- Complete task information
- Edit capabilities
- Comment thread

### ProjectDashboard
- Project overview
- Task analytics
- Team collaboration

## Events

- **TaskCreated**: New task notification
- **TaskUpdated**: Task change events
- **TaskCompleted**: Completion notifications
- **UserNotified**: User alert events

## Usage

```bash
# Validate specification
specverse validate examples/12-end-to-end/12-01-task-management-app.specly

# Generate full application
specverse realize all examples/12-end-to-end/12-01-task-management-app.specly \
  -m examples/12-end-to-end/manifests/development-simple.yaml \
  --output ./task-management-app

# Run generated application
cd task-management-app
npm install
npm run dev
```

## Architecture

```
Frontend (React)
  ↓ HTTP/WebSocket
API Layer (Fastify)
  ↓ Events
Service Layer
  ↓ ORM
Database (PostgreSQL)
```

## Related Examples

- `12-v3.3-features/12-01-blog-platform-v3.3.specly` - v3.3 features
- `03-architecture/03-05-complete-event-flow.specly` - Event patterns
- `06-deploy/` - Deployment configurations
- `08-comprehensive/08-01-complete-grammar-example.specly` - Complete syntax
