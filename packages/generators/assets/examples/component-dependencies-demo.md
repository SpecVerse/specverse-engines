# Example 11-05: Component Dependencies Diagram

**Demonstrates**: Inter-component relationships and module dependencies

## Overview

The **Component Dependencies** diagram shows how different components (modules) interact through imports, shared models, and event-based communication. Essential for modular architectures and understanding system coupling.

## Key Features

- Component boundaries visualization
- Import relationship tracking
- Shared model dependencies
- Event-based inter-component communication
- Module coupling analysis

## When to Use

✅ **Use when:**
- Planning **modular architecture**
- Identifying **coupling and dependencies**
- Documenting **microservices boundaries**
- Refactoring **monolith to modules**
- Reviewing **import statements**
- Creating **dependency graphs**

## Generated Diagram

The component dependencies diagram shows services within a component and their event-driven communication:

```mermaid
graph LR
  subgraph component_ELearningPlatform["ELearningPlatform"]
    ELearningPlatform_User("User")
    ELearningPlatform_Course("Course")
    ELearningPlatform_AuthController("AuthController")
    ELearningPlatform_CourseController("CourseController")
    ELearningPlatform_EnrollmentService("EnrollmentService")
    ELearningPlatform_ProgressService("ProgressService")
    ELearningPlatform_NotificationService("NotificationService")
    ELearningPlatform_AnalyticsService("AnalyticsService")
  end

  ELearningPlatform_AuthController -->|"manages"| ELearningPlatform_User
  ELearningPlatform_CourseController -->|"manages"| ELearningPlatform_Course
  ELearningPlatform_EnrollmentService -.->|"StudentEnrolled"| ELearningPlatform_ProgressService
  ELearningPlatform_EnrollmentService -.->|"StudentEnrolled"| ELearningPlatform_NotificationService
  ELearningPlatform_ProgressService -.->|"CourseCompleted"| ELearningPlatform_NotificationService
```

*Note: Solid lines show controller-model relationships, dashed lines show event-based service communication.*

## Generating

```bash
# Basic generation
specverse gen diagram 11-05-component-dependencies-demo.specly -d component-dependencies -o deps.mmd

# With theme
specverse gen diagram 11-05-component-dependencies-demo.specly -d component-dependencies --theme neutral -o deps-neutral.mmd
```

## Example Scenario

**Modular E-Learning Platform** with 5 components:

### Components

1. **AuthCore**: Authentication and user management
   - Exports: User model, auth events
   - No dependencies

2. **CourseCatalog**: Course management
   - Imports: User (from AuthCore)
   - Subscribes: UserRegistered

3. **ProgressTracking**: Student progress
   - Imports: User, Course, Enrollment
   - Subscribes: StudentEnrolled

4. **Communication**: Notifications and messaging
   - Imports: User, course events, progress events
   - Subscribes: All major events

5. **Analytics**: Reporting and metrics
   - Imports: User, Course
   - Subscribes: User and course events

### Dependency Patterns

**Direct Import Dependencies**:
```
CourseCatalog → AuthCore (imports User)
ProgressTracking → AuthCore (imports User)
ProgressTracking → CourseCatalog (imports Course, Enrollment)
Communication → AuthCore, CourseCatalog, ProgressTracking
Analytics → AuthCore, CourseCatalog
```

**Event-Based Communication**:
```
AuthCore publishes UserRegistered
  → CourseCatalog subscribes (auto-enrollment)
  → Communication subscribes (welcome email)
  → Analytics subscribes (tracking)
```

## Visualization Structure

### Component Subgraphs
Each component shown as subgraph containing:
- Models
- Controllers
- Services

### Dependency Edges
- **Solid**: Import dependencies
- **Dashed**: Event-based communication
- **Labels**: "imports" or event name

## Import Patterns

### Explicit Imports
```yaml
import:
  - from: "@AuthCore"
    select: [User, UserLoggedIn]
```

### Export Declaration
```yaml
models:
  User:
    attributes: {...}
    export: true  # Available for import
```

## Best Practices

1. **Minimize dependencies**: Fewer imports = looser coupling
2. **Use events for communication**: Reduces direct dependencies
3. **Export only necessary types**: Clear API boundaries
4. **Document import reasons**: Why each dependency exists
5. **Identify circular dependencies**: Refactor if found

## Dependency Analysis

### Good Patterns
- **Tree structure**: Clear hierarchy, no cycles
- **Event-driven**: Loose coupling via events
- **Layered**: Core components at bottom

### Anti-Patterns
- **Circular dependencies**: A imports B, B imports A
- **God component**: Everything depends on one component
- **Excessive coupling**: Too many direct imports

## Troubleshooting

### Missing Dependencies

**Problem**: Import statements don't show as edges

**Solution**: Ensure `export: true` on imported models

### No Component Boundaries

**Problem**: All content shown without grouping

**Solution**: Define multiple `components:` sections

### Too Many Dependencies

**Problem**: Diagram shows excessive connections

**Solution**: Refactor to use events instead of imports

---

**Generated with SpecVerse v3.2**
**Diagram Type**: component-dependencies
**Example**: 11-05-component-dependencies-demo.specly
