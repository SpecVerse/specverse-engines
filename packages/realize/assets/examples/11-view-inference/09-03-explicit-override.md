# Example 09-03: Explicit Component Override (v3.4.0+)

**Version**: 3.6.0
**Feature**: Level 3 explicit component control for complete customization

## Overview

This example demonstrates **Level 3: Explicit Component Override** where users have complete control over every aspect of a view by explicitly defining all `uiComponents`.

**Key Principle**: When you need pixel-perfect control, skip inference and define exactly what you want.

## When to Use Level 3

Use explicit component override when you need:
- ✅ Custom component configurations not supported by inference
- ✅ Specific styling, colors, or behavior
- ✅ Complex layouts requiring precise control
- ✅ Brand-specific UI patterns
- ✅ A/B testing different UI approaches

## Example: CustomTaskView

### Complete Explicit Definition

```yaml
views:
  CustomTaskView:
    type: custom                    # ← No inference
    model: Task
    uiComponents:                   # ← Everything defined explicitly
      pageHeader:
        type: header                # ← Using atomic types
        properties:
          title: "My Custom Task View"
          backgroundColor: "#1976d2"
          textColor: "#ffffff"

      customSearch:
        type: input
        properties:
          placeholder: "Search by title or description..."
          variant: outlined
          debounce: 300

      advancedFilters:
        type: filterPanel
        properties:
          collapsible: true
          defaultExpanded: false
          filters:
            - field: status
              type: select
              multiple: true
            - field: priority
              type: select
            - field: dueDateRange
              type: datepicker
              range: true

      taskDataTable:
        type: table
        properties:
          columns:
            - field: status
              renderAs: badge
              colorMap:
                todo: gray
                in_progress: blue
                done: green
            - field: priority
              renderAs: badge
              colorMap:
                low: green
                medium: orange
                high: red
          selectable: true
          pageSize: 25
          stickyHeader: true

      actionButtons:
        type: button-group
        properties:
          buttons:
            - label: "Create New Task"
              icon: add
              variant: contained
              color: primary
            - label: "Bulk Edit"
              requiresSelection: true
            - label: "Export to CSV"
              icon: download

      statusChart:
        type: chart
        properties:
          chartType: donut
          dataSource: "Task.status"
          colors: ["#9e9e9e", "#2196f3", "#4caf50"]
          height: 300

      overdueAlert:
        type: alert
        properties:
          severity: warning
          message: "{count(Task.dueDate<now AND status!='done')} tasks are overdue"
          variant: filled
```

## Key Features Demonstrated

### 1. Custom Styling
```yaml
pageHeader:
  type: header
  properties:
    backgroundColor: "#1976d2"    # Custom brand color
    textColor: "#ffffff"
```

### 2. Custom Behavior
```yaml
customSearch:
  type: input
  properties:
    debounce: 300                 # Custom debounce timing
    variant: outlined             # Specific variant
```

### 3. Advanced Filters
```yaml
advancedFilters:
  type: filterPanel
  properties:
    filters:
      - field: status
        multiple: true             # Multi-select
      - field: dueDateRange
        type: datepicker
        range: true                # Date range picker
```

### 4. Custom Table Rendering
```yaml
taskDataTable:
  type: table
  properties:
    columns:
      - field: status
        renderAs: badge           # Custom rendering
        colorMap:                 # Custom colors per value
          todo: gray
          in_progress: blue
          done: green
```

### 5. Conditional Alerts
```yaml
overdueAlert:
  type: alert
  properties:
    message: "{count(Task.dueDate<now AND status!='done')} tasks are overdue"
    severity: warning
    variant: filled
```

## Mixing Auto and Explicit

**Important**: You can mix automatic and explicit views!

```yaml
views:
  # Explicit - full control
  CustomTaskView:
    type: custom
    uiComponents: { ... }

  # Auto-generated views STILL created:
  #   - TaskListView (automatic)
  #   - TaskDetailView (automatic)
  #   - TaskFormView (automatic)
```

This gives you:
- Standard CRUD views (automatic)
- Custom specialized views (explicit)
- Best of both worlds!

## All 49 Atomic Types Available

Even in explicit mode, you use the same 49 atomic component types:

**Data Display**: table, list, grid, card, chart, tree, timeline, avatar, image

**Forms & Inputs**: form, input, textarea, select, checkbox, radio, slider, switch, autocomplete, datepicker, timepicker

**Actions**: button, button-group, link, icon, menu

**Overlays & Feedback**: modal, dialog, drawer, popover, tooltip, alert, snackbar, badge, spinner

**Navigation**: tabs, breadcrumb, navbar, sidebar, pagination

**Layout**: accordion, carousel, container, divider, header, footer

**Progress**: progress-bar, progress-circle

**Specialized**: searchBar, filterPanel

## Progressive Enhancement Path

| Level | Specification | Control | Use When |
|-------|--------------|---------|----------|
| **Level 1** | Models only | Low | Standard CRUD needs |
| **Level 2** | + Specialist types | Medium | Common patterns (dashboard, board) |
| **Level 3** | + Explicit components | High | Pixel-perfect custom UI |

## Running the Example

```bash
# Parse and validate
specverse validate examples/11-view-inference/09-03-explicit-override.specly

# Generate outputs
specverse gen all examples/11-view-inference/09-03-explicit-override.specly
```

## Expected Output

**Views Generated:**
- CustomTaskView (1 explicit view with 10 components)
- TaskListView (auto-generated)
- TaskDetailView (auto-generated)
- TaskFormView (auto-generated)
- UserListView (auto-generated)
- UserDetailView (auto-generated)
- UserFormView (auto-generated)

**Total: 7 views (1 explicit + 6 automatic)**

## Key Benefits

✅ **Complete Control**: Every property explicitly defined
✅ **Atomic Components**: Still uses framework-agnostic types
✅ **Type Safety**: Validated against schema
✅ **Coexists with Auto**: Auto-generated views still created
✅ **Maintainable**: Clear, declarative component definitions

## When NOT to Use Level 3

❌ **Standard CRUD**: Use Level 1 (automatic)
❌ **Common Patterns**: Use Level 2 (specialist types)
❌ **Rapid Prototyping**: Use Level 1 or 2

**Use Level 3 only when you need pixel-perfect control.**

## What's Next

- [Example 09-04](./09-04-all-specialist-types.md): All specialist view types

## Architecture Reference

**The Three Levels**:
1. **Automatic** (09-01): Zero view code → Standard CRUD
2. **Specialist** (09-02): Abstract types → Expanded components
3. **Explicit** (This): Full uiComponents → Total control

Each level is valid and useful for different scenarios. Choose based on your needs!
