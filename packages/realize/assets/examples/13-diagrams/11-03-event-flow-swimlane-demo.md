# Example 11-02: Event Flow Swimlane Diagram

**Demonstrates**: Parallel event flow visualization with component swimlanes

## Overview

The **Event Flow Swimlane** diagram provides a horizontal swimlane visualization of event-driven architectures, showing how events flow between different components (controllers and services). Each component gets its own "lane" showing its operations and responsibilities, making parallel event processing patterns immediately visible.

## Generated Diagram

```mermaid
graph LR
  %% Event Flow Swimlane - will be auto-generated
```

### Key Features

- **Component Swimlanes**: Each controller/service has its own horizontal lane
- **Operation Visibility**: All operations within each component are displayed
- **Event Flow**: Events are shown flowing between swimlanes
- **Parallel Processing**: Multiple components processing events concurrently is visually clear
- **Cross-Component Communication**: Event choreography patterns are explicit

### When to Use This Diagram

✅ **Use swimlane diagrams when:**
- Analyzing **parallel event processing** across multiple services
- Understanding **component boundaries** in event-driven systems
- Identifying **cross-component dependencies** via events
- Reviewing **event choreography** patterns
- Documenting **microservice event flows**
- Explaining **distributed system behavior** to stakeholders

❌ **Don't use swimlane diagrams when:**
- You need **temporal ordering** (use `event-flow-sequence` instead)
- You want **layered architecture view** (use `event-flow-layered` instead)
- The system has **few components** (swimlanes add unnecessary complexity)
- Events are primarily **internal to components** (no cross-component flows)

## Generating the Diagram

### Basic Generation

```bash
# Generate swimlane diagram
specverse gen diagram 11-02-event-flow-swimlane-demo.specly -d event-flow-swimlane -o swimlane.mmd

# With custom title
specverse gen diagram 11-02-event-flow-swimlane-demo.specly \
  -d event-flow-swimlane \
  --title "Order Processing Swimlanes" \
  -o swimlane-custom.mmd
```

### Theme Options

```bash
# Default theme (balanced colors)
specverse gen diagram 11-02-event-flow-swimlane-demo.specly -d event-flow-swimlane -o swimlane-default.mmd

# Forest theme (green tones)
specverse gen diagram 11-02-event-flow-swimlane-demo.specly -d event-flow-swimlane --theme forest -o swimlane-forest.mmd

# Dark theme (dark background)
specverse gen diagram 11-02-event-flow-swimlane-demo.specly -d event-flow-swimlane --theme dark -o swimlane-dark.mmd

# Neutral theme (grayscale)
specverse gen diagram 11-02-event-flow-swimlane-demo.specly -d event-flow-swimlane --theme neutral -o swimlane-neutral.mmd
```

## Example Scenario

This example demonstrates a **multi-stage order processing system** with parallel event flows:

### Components (Swimlanes)

1. **OrderController** (Entry Point)
   - Creates orders
   - Updates order status
   - Handles cancellations

2. **PaymentService** (Financial Processing)
   - Processes payments
   - Handles retries
   - Manages refunds

3. **InventoryService** (Stock Management)
   - Reserves items
   - Releases inventory
   - Allocates stock

4. **FulfillmentService** (Shipping)
   - Prepares shipments
   - Ships orders
   - Handles cancellations

5. **NotificationService** (Customer Communication)
   - Sends order confirmations
   - Notifies payment status
   - Provides tracking updates

6. **AnalyticsService** (Tracking & Reporting)
   - Tracks order creation
   - Records payment events
   - Monitors shipment activity

### Event Flows

#### Happy Path Flow
```
OrderController → OrderCreated
  ↓
PaymentService → PaymentProcessed
  ↓
InventoryService → InventoryReserved
  ↓
FulfillmentService → ShipmentPrepared
  ↓
FulfillmentService → OrderShipped
```

#### Parallel Notification Flow
```
OrderCreated → NotificationService (sendOrderConfirmation)
PaymentProcessed → NotificationService (sendPaymentConfirmation)
ShipmentPrepared → NotificationService (sendShipmentNotification)
OrderShipped → NotificationService (sendTrackingInfo)
```

#### Parallel Analytics Flow
```
OrderCreated → AnalyticsService (trackOrderCreated)
PaymentProcessed → AnalyticsService (trackPaymentSuccess)
OrderShipped → AnalyticsService (trackOrderShipped)
```

#### Cancellation Flow
```
OrderController → OrderCancelled
  ↓ (parallel)
  ├─→ InventoryService → InventoryReleased
  ├─→ FulfillmentService → ShipmentCancelled
  └─→ NotificationService → sendCancellationNotice
```

## Understanding the Visualization

### Swimlane Structure

Each swimlane contains:
- **Component Header**: Name and type (controller/service)
- **Entry Node**: Entry point for the component
- **Operation Nodes**: All operations available in the component
- **Internal Connections**: Entry → Operations

### Event Nodes

Events appear **between swimlanes** as:
- **Hexagonal shapes** (distinct from component nodes)
- **Event name** as label
- **Colored** according to theme

### Edge Types

- **Solid arrows** (`→`): "publishes" relationship (operation → event)
- **Dashed arrows** (`⇢`): "subscribes" relationship (event → component)

### Reading the Diagram

1. **Start with entry points**: Find operations that don't subscribe to events
2. **Follow solid arrows**: See what events are published
3. **Follow dashed arrows**: See which components subscribe
4. **Trace parallel flows**: Multiple components subscribing to the same event
5. **Identify feedback loops**: Events triggering further events in same or different components

## Implementation Details

### SpecVerse Syntax

The swimlane visualization is generated from standard SpecVerse v3.2 specifications:

#### Publishing Events

```yaml
controllers:
  OrderController:
    cured:
      create:
        publishes: [OrderCreated]  # Operation publishes event
```

```yaml
services:
  PaymentService:
    operations:
      processPayment:
        publishes: [PaymentProcessed, PaymentFailed]  # Multiple events
```

#### Subscribing to Events

```yaml
services:
  PaymentService:
    subscribes_to:
      OrderCreated: processPayment  # Event → Handler mapping
```

```yaml
services:
  NotificationService:
    subscribes_to:
      OrderCreated: sendOrderConfirmation
      PaymentProcessed: sendPaymentConfirmation
      OrderShipped: sendTrackingInfo  # Multiple subscriptions
```

#### Event Definitions

```yaml
events:
  OrderCreated:
    attributes:
      orderId: UUID required
      customerId: UUID required
      total: Money required
      itemCount: Integer required
      createdAt: DateTime required
```

## Swimlane vs Other Event Flow Diagrams

### Comparison Matrix

| Feature | Swimlane | Sequence | Layered |
|---------|----------|----------|---------|
| **Focus** | Parallel Processing | Temporal Order | Architecture Layers |
| **Direction** | Horizontal (LR) | Top-Down | Top-Down |
| **Best For** | Microservices | Event Chains | System Overview |
| **Complexity** | Medium | Low | High |
| **Detail Level** | Operations | Event Order | Full Stack |
| **Component View** | Isolated Lanes | Participants | Layer Groups |

### Use Case Guidelines

**Choose Swimlane when:**
- Multiple services process events independently
- You need to show component boundaries clearly
- Parallel event processing is important
- Audience includes service owners/teams
- Documenting microservice choreography

**Choose Sequence when:**
- Event order/timing is critical
- You're tracing a specific workflow
- Need to show event chains
- Simpler visualization is better
- Focus is on event flow, not components

**Choose Layered when:**
- Showing full architecture stack (models → views)
- Domain vs application event separation matters
- Need comprehensive system overview
- Explaining dual event bus pattern
- Architecture documentation

## Advanced Features

### Complex Event Patterns

#### Fan-Out Pattern
One event triggers multiple independent services:

```yaml
# OrderCreated triggers 3 services in parallel
OrderCreated →
  ├─→ PaymentService
  ├─→ NotificationService
  └─→ AnalyticsService
```

#### Fan-In Pattern
Multiple events converge to one service:

```yaml
# FulfillmentService responds to multiple events
→ InventoryReserved → FulfillmentService
→ PaymentProcessed → FulfillmentService
```

#### Feedback Loop Pattern
Service publishes events that trigger other services:

```yaml
PaymentService → PaymentFailed → NotificationService
NotificationService → CustomerNotified → AnalyticsService
```

### Swimlane Optimization Tips

1. **Limit Operations**: Only include event-relevant operations
2. **Group Related Components**: Place collaborating services adjacent
3. **Highlight Critical Paths**: Use themes to emphasize important flows
4. **Separate Concerns**: Cross-cutting services (notification, analytics) on separate lanes
5. **Document Edge Cases**: Include both happy path and error flows

## Integration with SpecVerse

### Automated Generation

Swimlane diagrams are automatically generated from your `.specly` specifications:

1. **Parse Specification**: Extract components, events, subscriptions
2. **Build Swimlanes**: Create lanes for each controller/service
3. **Map Operations**: Add operation nodes within swimlanes
4. **Connect Events**: Draw edges for publish/subscribe relationships
5. **Render Mermaid**: Generate Mermaid graph with subgraphs

### Validation

The diagram generator validates:
- ✅ Event publishers exist (controllers/services with `publishes`)
- ✅ Event subscribers exist (components with `subscribes_to`)
- ✅ Events are defined in `events` section
- ⚠️ Warns if no event flows detected

### VSCode Integration

If using the SpecVerse VSCode extension:

1. Open `.specly` file
2. Command Palette: `SpecVerse: Generate Diagram`
3. Select: `event-flow-swimlane`
4. Preview diagram in editor

## Best Practices

### Specification Design

1. **Clear Event Names**: Use descriptive names (OrderCreated, PaymentProcessed)
2. **Consistent Naming**: Follow convention (EntityAction pattern)
3. **Explicit Subscriptions**: Always map event → handler method
4. **Meaningful Operations**: Name operations clearly (processPayment, not process)
5. **Event Payloads**: Include all necessary attributes in event definitions

### Diagram Readability

1. **Limit Components**: Keep to 8-10 swimlanes maximum
2. **Logical Ordering**: Arrange lanes by workflow sequence (left to right)
3. **Group Services**: Place related services adjacent
4. **Use Themes**: Choose theme that highlights important components
5. **Include Documentation**: Add titles and context for viewers

### Architecture Patterns

**Choreography Pattern** (Recommended for Swimlanes):
- Services react independently to events
- No central orchestrator
- Clear component boundaries
- Scales horizontally

**Orchestration Pattern** (Use Sequence Instead):
- Central controller coordinates flow
- Explicit step ordering
- Tighter coupling
- Better shown in sequence diagrams

## Troubleshooting

### Empty Swimlanes

**Problem**: Component swimlane has no operations

**Solutions**:
- Ensure component has `operations` (services) or `cured`/`actions` (controllers)
- Check that operations are defined correctly
- Verify component is included in specification

### Missing Events

**Problem**: Events don't appear between swimlanes

**Solutions**:
- Verify events are defined in `events` section
- Check `publishes` arrays reference correct event names
- Ensure `subscribes_to` maps to valid events
- Match exact event names (case-sensitive)

### No Edges

**Problem**: Swimlanes and events appear but no connections

**Solutions**:
- Verify operations have `publishes` arrays
- Check `subscribes_to` format: `EventName: handlerMethod`
- Ensure event names match exactly (no typos)
- Confirm handler methods exist in operations

### Cluttered Diagram

**Problem**: Too many swimlanes/events make diagram unreadable

**Solutions**:
- Split into multiple diagrams by domain area
- Remove non-essential components
- Focus on specific workflows
- Use event-flow-sequence for simplified view

## Related Examples

- **11-01-event-flow-sequence-demo.specly**: Temporal event sequences
- **01-05-events.specly**: Event fundamentals
- **02-04-event-subscriptions.specly**: Subscription patterns
- **06-event-driven.specly**: Event-driven architecture

## Additional Resources

### Mermaid Documentation
- [Mermaid Subgraphs](https://mermaid.js.org/syntax/flowchart.html#subgraphs)
- [Mermaid Styling](https://mermaid.js.org/syntax/flowchart.html#styling)

### Event-Driven Architecture
- [Event Choreography Patterns](https://microservices.io/patterns/data/event-driven-architecture.html)
- [Swimlane Diagrams for Event Systems](https://en.wikipedia.org/wiki/Swim_lane)

### SpecVerse Resources
- **Schema Documentation**: `docs/reference/schema.md`
- **Event System Guide**: `docs/guides/event-system.md`
- **Diagram Generator**: `docs/guides/diagram-generation.md`

---

**Generated with SpecVerse v3.2 Unified Diagram Generator**
**Diagram Type**: event-flow-swimlane
**Example**: 11-02-event-flow-swimlane-demo.specly
