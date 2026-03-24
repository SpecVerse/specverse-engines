# Example 11-10: Comprehensive ER Diagram

## Overview

This example demonstrates a **comprehensive entity-relationship diagram** showing all relationship types and attribute patterns supported by SpecVerse. It models a complete project management and time tracking system.

## Generated Diagram

```mermaid
erDiagram
  %% Entity-Relationship Diagram - will be auto-generated
```

## Key Features

### All Relationship Types Demonstrated

1. **hasMany**: One-to-many relationships
   - Department → employees (hasMany Employee)
   - Department → projects (hasMany Project)
   - Project → tasks (hasMany Task)

2. **hasOne**: One-to-one relationships
   - Department → manager (hasOne Employee)
   - Project → lead (hasOne Employee)
   - Contract → project (hasOne Project)

3. **belongsTo**: Inverse relationships
   - Employee → department (belongsTo Department)
   - Task → project (belongsTo Project)
   - Task → assignedTo (belongsTo Employee)

4. **manyToMany**: Many-to-many with through table
   - Employee ↔ Project through ProjectAssignment
   - Demonstrates junction table pattern with additional attributes

5. **Self-Referential**: Hierarchical relationships
   - Employee → manager (belongsTo Employee)
   - Employee → subordinates (hasMany Employee)

### Models (9)

1. **Department**: Organizational unit with employees and projects
2. **Employee**: Worker with hierarchical manager structure
3. **Project**: Project with client and team assignment
4. **ProjectAssignment**: Through table for Employee-Project relationship
5. **Task**: Work items assigned to employees
6. **TimeEntry**: Time tracking for tasks and projects
7. **Client**: Client organization with contracts
8. **Contract**: Client contract linked to projects
9. **Expense**: Employee expenses for projects
10. **SystemConfiguration**: Demonstrates all attribute types

### All Attribute Types Demonstrated

**Standard Types**:
- UUID: Unique identifiers (id fields)
- String: Text data (name, title, description)
- Integer: Whole numbers (quantity, currentQuantity)
- Number: Decimal numbers (hours, estimatedHours)
- Email: Validated email addresses
- PhoneNumber: Phone number validation
- Date: Date only fields (hireDate, birthDate, dueDate)
- Money: Currency values (budget, salary, hourlyRate)
- Boolean: True/false flags (isActive)
- Address: Structured address data (client address)
- JSON: Flexible JSON storage (jsonValue)

**Attribute Modifiers**:
- `required`: Must have value
- `unique`: No duplicates allowed
- `optional`: Can be null (default)

### Complex Relationship Patterns

**Through Table with Attributes**:
```yaml
ProjectAssignment:
  attributes:
    role: String required
    assignedDate: Date required
    hoursAllocated: Number required
    hourlyRate: Money
  relationships:
    employee: belongsTo Employee
    project: belongsTo Project
```

**Self-Referential Hierarchy**:
```yaml
Employee:
  relationships:
    manager: belongsTo Employee
    subordinates: hasMany Employee
```

**Multiple Relationships to Same Model**:
```yaml
Expense:
  relationships:
    employee: belongsTo Employee    # Who submitted
    project: belongsTo Project      # Project it's for
    approver: belongsTo Employee    # Who approved
```

## ER Diagram Output

The generated ER diagram shows:
- All entities as rectangles with attributes
- Relationship cardinality (||, }o, etc.)
- Relationship labels and types
- Self-referential connections
- Through table connections

## Use Cases

- Project management systems
- Time tracking applications
- Resource allocation platforms
- Employee management systems
- Client relationship management
- Complex relational database design

## Related Examples

- **11-07**: Basic ER diagram
- **11-07**: Profile attachment diagram
- **00-01**: Minimal syntax reference with basic relationships
