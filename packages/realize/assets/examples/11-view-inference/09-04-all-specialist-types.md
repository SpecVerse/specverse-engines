# 09-04: All Specialist View Types

**Version**: v3.4.0+
**Category**: View Inference
**Complexity**: Intermediate

## Overview

This example demonstrates v3.4.0's **automatic specialist view generation** based on model characteristics. The inference engine analyzes your models and automatically generates appropriate specialist views (dashboard, analytics, board, timeline, calendar, workflow) without any manual view definitions.

## Key Concepts

### Smart Specialist View Detection

The inference engine uses intelligent heuristics to determine which specialist views to generate:

| View Type | Generated When Model Has... | Example Models |
|-----------|----------------------------|----------------|
| **Dashboard** | Numeric/Money metrics OR relationships | Project (budget, progress), Task (estimatedHours) |
| **Analytics** | Lifecycle OR metrics | Project (status lifecycle), Task (priority, hours) |
| **Board** | Lifecycle with states | Project (planning→active→...→archived), Task (todo→inProgress→review→done) |
| **Timeline** | Temporal attributes (createdAt, updatedAt, date fields) | All models with DateTime fields |
| **Calendar** | Scheduling attributes (startDate, endDate, dueDate) | Event (startDate, endDate), Task (dueDate) |
| **Workflow** | Complex lifecycle (3+ states) | Project (5 states), Task (4 states) |

### What Gets Generated

For the models in this example:

#### **Project Model** → 10 Views
- Standard: ListView, DetailView, FormView
- Specialist: DashboardView, AnalyticsView, BoardView, TimelineView, CalendarView, WorkflowView
- Enhanced: MasterDetailView (because it has relationships)

#### **Task Model** → 11 Views
- Standard: ListView, DetailView, FormView
- Specialist: DashboardView, AnalyticsView, BoardView, TimelineView, CalendarView, WorkflowView
- Enhanced: EnhancedListView (relationships), MasterDetailView

#### **Event Model** → 8 Views
- Standard: ListView, DetailView, FormView
- Specialist: DashboardView, AnalyticsView, TimelineView, CalendarView
- Enhanced: EnhancedListView (relationships)

#### **User Model** → 7 Views
- Standard: ListView, DetailView, FormView
- Specialist: DashboardView, AnalyticsView, TimelineView
- Enhanced: EnhancedListView (relationships)

**Total: 36 views automatically generated from 5 models!**

## Generated Components

### Dashboard View Components
Each dashboard includes:
- **Metric Cards**: For each numeric field (budget, progress, estimatedHours, etc.)
- **Trend Charts**: Visualizing metrics over time
- **Distribution Charts**: Showing data distribution
- **Summary Table**: Compact overview with pagination

### Board View Components
Each kanban board includes:
- **Board Container**: Horizontal scrollable layout
- **Column per State**: One column for each lifecycle state (todo, inProgress, review, done)
- **Draggable Cards**: Cards that can be moved between columns
- **Filter Panel**: Top-positioned collapsible filters

### Timeline View Components
Each timeline includes:
- **Timeline Container**: Vertical orientation with date markers
- **Event Cards**: Compact cards showing each record with timestamps
- **Filter Panel**: Date range filtering
- **Chronological Ordering**: Auto-sorted by temporal fields

### Calendar View Components
Each calendar includes:
- **Calendar Container**: Multiple views (month, week, day)
- **Event Details Drawer**: Right-side details panel (400px width)
- **Filter Panel**: Category-based filtering
- **Scheduling Display**: Visual representation of dates/times

### Workflow View Components
Each workflow includes:
- **State Diagram**: Interactive state machine visualization
- **Action Buttons**: Vertical button group for state transitions
- **History Timeline**: Shows duration and user for each state change

### Analytics View Components
Each analytics view includes:
- **Advanced Filter Panel**: Date range and multi-dimensional filters
- **Interactive Charts**: Exportable, interactive visualizations
- **Data Table**: Sortable, filterable, exportable data grid

## Usage

### Run Inference
```bash
# Generate all views
specverse infer examples/11-view-inference/09-04-all-specialist-types.specly

# Validate generated output
specverse validate 09-04-all-specialist-types-inferred.specly
```

### Inspect Generated Views
The inferred specification will contain:
- **36 views** from 5 models
- Each specialist view fully expanded with **atomic components**
- Component properties optimized for each view type
- Event subscriptions for real-time updates

### Example Generated Dashboard
```yaml
views:
  ProjectDashboardView:
    type: dashboard
    model: Project
    description: "Dashboard view for Project with metrics and summary"
    subscribes_to:
      - ProjectCreated
      - ProjectUpdated
      - ProjectDeleted
      - ProjectEvolved
    uiComponents:
      budgetCard:
        type: card
        properties:
          variant: metric
          showTrend: true
          metric: budget
          model: Project
      progressCard:
        type: card
        properties:
          variant: metric
          showTrend: true
          metric: progress
          model: Project
      trendChart:
        type: chart
        properties:
          responsive: true
          showLegend: true
          chartType: trend
          model: Project
      summaryTable:
        type: table
        properties:
          compact: true
          pagination: true
          model: Project
```

### Example Generated Board
```yaml
views:
  TaskBoardView:
    type: board
    model: Task
    description: "Kanban board view for Task workflow"
    subscribes_to:
      - TaskCreated
      - TaskUpdated
      - TaskEvolved
    uiComponents:
      boardContainer:
        type: container
        properties:
          layout: horizontal
          scrollable: true
      todoColumn:
        type: container
        properties:
          layout: vertical
          allowDrop: true
          column: todo
      inProgressColumn:
        type: container
        properties:
          layout: vertical
          allowDrop: true
          column: inProgress
      taskCard:
        type: card
        properties:
          draggable: true
          compact: true
```

## Learning Points

### 1. Zero-Code View Generation
- Define models with attributes, relationships, and lifecycles
- Inference engine automatically generates appropriate specialist views
- No manual view configuration needed

### 2. Smart Heuristics
- System analyzes model characteristics
- Generates only relevant specialist views
- Optimizes component selection based on data types

### 3. Atomic Component Expansion
- Each specialist view type has a template
- Templates expand to concrete atomic components
- Framework-agnostic component specifications

### 4. Progressive Enhancement Path
- Level 1 (this example): Fully automatic
- Level 2 (09-02): Request specific specialist views
- Level 3 (09-03): Full manual control with uiComponents

## Architecture Benefits

### Specification Simplicity
```yaml
# YOU WRITE (5 models, ~70 lines)
models:
  Project: { attributes, lifecycles, relationships }
  Task: { attributes, lifecycles, relationships }
  Event: { attributes, relationships }
  User: { attributes }
  Attachment: { attributes }

# SYSTEM GENERATES (36 views, ~2,700 lines)
views:
  ProjectListView: { ... }
  ProjectDetailView: { ... }
  ProjectFormView: { ... }
  ProjectDashboardView: { ... }
  ProjectAnalyticsView: { ... }
  ProjectBoardView: { ... }
  # ... 30 more views with full component definitions
```

**Expansion Ratio**: 4670% (70 → 2,700+ lines)

### Production-Ready Output
- Event subscriptions for real-time updates
- Pagination, sorting, filtering built-in
- Responsive design properties
- Accessibility considerations
- Framework-agnostic specifications

## Related Examples

- **09-01**: Basic automatic CRUD views (Level 1)
- **09-02**: Requesting specific specialist views (Level 2)
- **09-03**: Full manual control with explicit components (Level 3)

## Next Steps

1. **Customize Generated Views**: Copy generated views to your spec and modify as needed
2. **Add Custom Views**: Mix auto-generated with manually defined views
3. **Implement Component Factory**: Use specverse-app-demo to render views at runtime
4. **Framework Integration**: Map atomic components to your UI framework (React, Vue, etc.)

---

**Part of v3.4.0 View Inference Architecture**
Demonstrates intelligent specialist view generation based on model characteristics.
