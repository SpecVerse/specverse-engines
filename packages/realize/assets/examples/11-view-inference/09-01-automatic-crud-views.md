# Example 09-01: Automatic CRUD View Generation (v3.4.0+)

**Version**: 3.6.0
**Feature**: Automatic view inference with 49 atomic component types

## Overview

This example demonstrates **Level 1: Automatic CRUD View Generation** where the inference engine automatically generates complete view definitions from models alone, using the 49 atomic component types.

**Key Principle**: Write only your models. The inference engine generates:
- ListView with search, filters, table, pagination
- DetailView with header, cards, related data
- FormView with typed inputs based on attributes

## What Gets Generated

For each model (`Task`, `User`, `Project`), the inference engine automatically generates 3 standard views:

### TaskListView (Automatic)

```yaml
views:
  TaskListView:
    type: list
    model: Task
    uiComponents:
      searchBar:
        type: input                    # ← Atomic component
        placeholder: "Search tasks..."

      filterPanel:
        type: filterPanel              # ← Specialized atomic component
        model: Task

      taskTable:
        type: table                    # ← Atomic component
        model: Task
        columns: [title, status, priority, assignee, dueDate]

      pagination:
        type: pagination               # ← Atomic component
```

### TaskFormView (Automatic)

Based on attribute types, generates appropriate input components:

```yaml
views:
  TaskFormView:
    type: form
    model: Task
    uiComponents:
      header:
        type: header

      # String required → input (required)
      titleInput:
        type: input
        properties:
          required: true

      # Text → textarea
      descriptionText:
        type: textarea
        properties:
          rows: 4

      # String with values → select
      statusSelect:
        type: select
        properties:
          options: [todo, in_progress, done]

      prioritySelect:
        type: select
        properties:
          options: [low, medium, high]

      # DateTime → datepicker (with time)
      dueDatePicker:
        type: datepicker
        properties:
          showTime: true

      # Boolean → switch
      completedSwitch:
        type: switch

      # Integer → input (number)
      estimatedHoursInput:
        type: input
        properties:
          type: number

      # belongsTo → autocomplete
      assigneeSelect:
        type: autocomplete
        properties:
          model: User
          searchable: true

      projectSelect:
        type: autocomplete
        properties:
          model: Project
          searchable: true

      actions:
        type: button-group
        properties:
          buttons:
            - label: Save
              variant: contained
            - label: Cancel
              variant: text
```

### TaskDetailView (Automatic)

```yaml
views:
  TaskDetailView:
    type: detail
    model: Task
    uiComponents:
      header:
        type: header
        properties:
          title: "Task Details"
          showBackButton: true

      taskCard:
        type: card
        model: Task
        properties:
          elevation: 1

      actions:
        type: button-group
        properties:
          buttons:
            - label: Edit
              icon: edit
            - label: Delete
              icon: delete
```

## Attribute Type → Component Type Mapping

The v3.4.0 inference engine uses these rules:

| Attribute Type | Constraints | Component Type | Properties |
|----------------|-------------|----------------|------------|
| `String` | `values=[...]` | `select` | options from values |
| `String` | default | `input` | type="text" |
| `Text` | - | `textarea` | rows=4 |
| `Integer` | - | `input` | type="number" |
| `Boolean` | - | `switch` | - |
| `DateTime` | - | `datepicker` | showTime=true |
| `Date` | - | `datepicker` | - |
| `Email` | - | `input` | type="email" |

## Relationship Type → Component Type Mapping

| Relationship Type | Component Type | Properties |
|-------------------|----------------|------------|
| `belongsTo` | `autocomplete` | model, searchable |
| `hasMany` | `list` | in detail view |
| `hasOne` | `card` | in detail view |
| `manyToMany` | `autocomplete` | multiple=true |

## Running the Example

```bash
# Parse and validate (no errors expected)
specverse validate examples/11-view-inference/09-01-automatic-crud-views.specly

# Generate inference (will create 9 views automatically)
specverse infer examples/11-view-inference/09-01-automatic-crud-views.specly

# Generate all outputs
specverse gen all examples/11-view-inference/09-01-automatic-crud-views.specly
```

## Expected Output

**Models**: 3 (Task, User, Project)
**Views**: 9 (3 views × 3 models - all auto-generated)
**Components per view**: 4-8 atomic components

## Key Benefits

✅ **Zero View Code**: No manual view definitions required
✅ **Type-Safe**: Components match attribute types
✅ **Consistent**: Same pattern across all models
✅ **Maintainable**: Update model, views update automatically
✅ **Framework-Agnostic**: Uses 49 atomic component types

## What's Next

- [Example 09-02](./09-02-specialist-dashboard.specly): Specialist views (dashboard, analytics, board)
- [Example 09-03](./09-03-explicit-override.specly): Level 3 explicit component control

## Architecture Reference

**Component Types (49 Total)**:
- Data Display (9): table, list, grid, card, chart, tree, timeline, avatar, image
- Forms & Inputs (11): form, input, textarea, select, checkbox, radio, slider, switch, autocomplete, datepicker, timepicker
- Actions (5): button, button-group, link, icon, menu
- Overlays & Feedback (9): modal, dialog, drawer, popover, tooltip, alert, snackbar, badge, spinner
- Navigation (5): tabs, breadcrumb, navbar, sidebar, pagination
- Layout (6): accordion, carousel, container, divider, header, footer
- Progress (2): progress-bar, progress-circle
- Specialized (2): searchBar, filterPanel

See the SpecVerse documentation for complete architecture details.
