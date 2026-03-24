# Example 09-02: Specialist View Inference (v3.4.0+)

**Version**: 3.6.0
**Feature**: Level 2 specialist view inference with abstract types

## Overview

This example demonstrates **Level 2: Specialist Views** where users define abstract view types (`dashboard`, `analytics`, `board`) and the inference engine expands them to concrete atomic components.

**Key Principle**: Users write **what** they want (dashboard, analytics), inference generates **how** (specific atomic components).

## Specialist View Types

### 1. Dashboard View

**User Writes (Abstract Intent):**
```yaml
views:
  TaskDashboard:
    type: dashboard
    model: Task
    metrics: [total, completed, overdue, byPriority]
```

**Inference Expands (Atomic Components):**
```yaml
views:
  TaskDashboard:
    type: dashboard
    model: Task
    uiComponents:
      # Metric cards
      totalCard:
        type: card
        properties:
          title: "Total Tasks"
          value: "{count(Task)}"
          variant: metric
          showTrend: true

      completedCard:
        type: card
        properties:
          title: "Completed"
          value: "{count(Task.status='done')}"
          variant: metric

      overdueCard:
        type: card
        properties:
          title: "Overdue"
          value: "{count(Task.dueDate<now AND status!='done')}"
          variant: metric
          color: error

      # Charts
      statusChart:
        type: chart
        properties:
          title: "Tasks by Status"
          chartType: pie
          dataSource: "Task.status"
          showLegend: true

      priorityChart:
        type: chart
        properties:
          title: "Tasks by Priority"
          chartType: bar
          dataSource: "Task.priority"

      # Recent activity
      recentTasksTable:
        type: table
        properties:
          title: "Recent Tasks"
          model: Task
          columns: [title, status, priority, assignee]
          sortBy: updatedAt desc
          limit: 10
```

### 2. Analytics View

**User Writes (Abstract Intent):**
```yaml
views:
  TaskAnalytics:
    type: analytics
    model: Task
    dimensions: [status, priority, assignee, project]
    measures: [count, avgCompletionTime, totalHours]
```

**Inference Expands (Atomic Components):**
```yaml
views:
  TaskAnalytics:
    type: analytics
    model: Task
    uiComponents:
      # Advanced filters
      filterPanel:
        type: filterPanel
        properties:
          advanced: true
          filters:
            - field: status
              type: select
            - field: priority
              type: select
            - field: dateRange
              type: datepicker
            - field: assignee
              type: autocomplete

      # Multi-dimensional charts
      statusChart:
        type: chart
        properties:
          chartType: bar
          dimension: status
          measure: count
          interactive: true
          exportable: true

      priorityChart:
        type: chart
        properties:
          chartType: pie
          dimension: priority
          measure: count

      assigneeChart:
        type: chart
        properties:
          chartType: bar
          dimension: assignee
          measure: count
          sortBy: count desc

      # Data table with export
      dataTable:
        type: table
        properties:
          model: Task
          exportable: true
          exportFormats: [csv, excel, pdf]
          sortable: true
          filterable: true
          groupable: true
```

### 3. Board View (Kanban)

**User Writes (Abstract Intent):**
```yaml
views:
  TaskBoard:
    type: board
    model: Task
    groupBy: status
    cardFields: [title, priority, assignee, dueDate]
```

**Inference Expands (Atomic Components):**
```yaml
views:
  TaskBoard:
    type: board
    model: Task
    uiComponents:
      # Board container
      boardContainer:
        type: container
        properties:
          layout: horizontal
          scrollable: true
          fullHeight: true

      # Columns (one per status value)
      todoColumn:
        type: container
        properties:
          title: "To Do"
          layout: vertical
          allowDrop: true
          droppableType: task
          filterBy: "status='todo'"

      inProgressColumn:
        type: container
        properties:
          title: "In Progress"
          layout: vertical
          allowDrop: true
          droppableType: task
          filterBy: "status='in_progress'"

      doneColumn:
        type: container
        properties:
          title: "Done"
          layout: vertical
          allowDrop: true
          droppableType: task
          filterBy: "status='done'"

      # Card template
      taskCard:
        type: card
        properties:
          draggable: true
          compact: true
          showActions: true
          fields: [title, priority, assignee, dueDate]

      # Filters
      filterPanel:
        type: filterPanel
        properties:
          position: top
          collapsible: true
          filters: [priority, assignee, project]
```

## Specialist View Type → Component Mapping

| Specialist Type | Generated Components | Purpose |
|-----------------|---------------------|---------|
| `dashboard` | card (metrics), chart, table | Overview with KPIs |
| `analytics` | filterPanel, chart (multi), table | Deep analysis |
| `board` | container (columns), card, filterPanel | Kanban workflow |
| `timeline` | timeline, card, filterPanel | Chronological events |
| `calendar` | container (calendar), drawer, filterPanel | Date-based scheduling |

See the SpecVerse inference engine rules for complete specialist view type mappings.

## All Generated Views

From this specification, you get:

**Auto-Generated (Level 1 - 9 views):**
- TaskListView, TaskDetailView, TaskFormView
- UserListView, UserDetailView, UserFormView
- ProjectListView, ProjectDetailView, ProjectFormView

**Specialist Expanded (Level 2 - 3 views):**
- TaskDashboard (5-6 atomic components)
- TaskAnalytics (5-6 atomic components)
- TaskBoard (6-8 atomic components)

**Total: 12 views with ~50+ atomic components**

## Running the Example

```bash
# Parse and validate
specverse validate examples/11-view-inference/09-02-specialist-dashboard.specly

# Generate with inference
specverse infer examples/11-view-inference/09-02-specialist-dashboard.specly

# Generate all outputs
specverse gen all examples/11-view-inference/09-02-specialist-dashboard.specly
```

## Key Benefits

✅ **Minimal Specification**: Just declare type and intent
✅ **Consistent Patterns**: Specialist views follow proven UX patterns
✅ **Atomic Components**: Expands to the same 49 atomic types
✅ **Framework Agnostic**: Works with any frontend framework
✅ **Customizable**: Can override specific components if needed

## Progressive Enhancement Path

1. **Level 1** (Example 09-01): No views → Auto-generate CRUD
2. **Level 2** (This example): Add specialist types → Inference expands
3. **Level 3** (Example 09-03): Override components → Full control

Each level gives more control while maintaining the "minimal spec" principle.

## What's Next

- [Example 09-03](./09-03-explicit-override.specly): Level 3 explicit component control
- [Example 09-04](./09-04-all-specialist-types.md): All specialist view types

## Architecture Reference

**Specialist View Types (10)**:
- dashboard, analytics, board, timeline, calendar
- workflow, wizard, comparison, settings, map

Each expands to 3-8 atomic components from the 49-type set.

See the SpecVerse documentation for complete architecture details.
