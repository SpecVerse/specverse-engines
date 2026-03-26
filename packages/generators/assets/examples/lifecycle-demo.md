# Lifecycle State Diagram Demo

This example demonstrates comprehensive lifecycle state machines with guards, actions, and complex state transitions for three models in an e-commerce system.

## Overview

The lifecycle diagram type visualizes the complete state machine for models, showing all possible states, transitions, guards, and actions. This is essential for understanding business processes, workflow automation, and state management.

## Features Demonstrated

### Order Lifecycle
- **9 States**: From draft to delivered/cancelled/refunded
- **Complex Guards**: Payment retry limits, refund windows, cancellation conditions
- **Multi-stage Actions**: Email notifications, inventory management, invoice generation
- **Multiple End States**: delivered, cancelled, refunded

### Product Lifecycle
- **5 States**: Active inventory management states
- **Inventory Triggers**: Automatic transitions based on stock levels
- **Supplier Integration**: Backorder and restocking workflows
- **Discontinuation Path**: Product retirement process

### Shipment Lifecycle
- **7 States**: Complete delivery tracking workflow
- **Self-transitions**: Multiple in_transit updates as package moves
- **Retry Logic**: Failed delivery reattempts with limits
- **Return Handling**: Customer refusal and failed delivery returns

## Generated Diagram

```mermaid
stateDiagram-v2
  %% Model Lifecycles

  %% Order - orderStatus

  [*] --> Order_orderStatus_draft : start
  Order_orderStatus_draft --> Order_orderStatus_pending_payment
  Order_orderStatus_pending_payment --> Order_orderStatus_confirmed
  Order_orderStatus_confirmed --> Order_orderStatus_processing
  Order_orderStatus_processing --> Order_orderStatus_shipped
  Order_orderStatus_shipped --> Order_orderStatus_delivered

  %% Product - inventoryStatus

  [*] --> Product_inventoryStatus_active : start
  Product_inventoryStatus_active --> Product_inventoryStatus_low_stock
  Product_inventoryStatus_low_stock --> Product_inventoryStatus_out_of_stock
  Product_inventoryStatus_out_of_stock --> Product_inventoryStatus_backordered
  Product_inventoryStatus_backordered --> Product_inventoryStatus_active

  %% Shipment - trackingStatus

  [*] --> Shipment_trackingStatus_created : start
  Shipment_trackingStatus_created --> Shipment_trackingStatus_picked_up
  Shipment_trackingStatus_picked_up --> Shipment_trackingStatus_in_transit
  Shipment_trackingStatus_in_transit --> Shipment_trackingStatus_out_for_delivery
  Shipment_trackingStatus_out_for_delivery --> Shipment_trackingStatus_delivered
```

## Generation

```bash
# Generate lifecycle diagram
specverse gen diagram 11-06-lifecycle-demo.specly -t lifecycle -o lifecycle-demo.mmd

# Generate for specific model
specverse gen diagram 11-06-lifecycle-demo.specly -t lifecycle --filter Order -o order-lifecycle.mmd
```

## Key Concepts

### Guards
Guards are boolean conditions that must be satisfied for a transition to occur:
```yaml
guards:
  - "stockLevel > reorderPoint"
  - "retryCount < 3"
```

### Actions
Actions are side effects executed when a transition occurs:
```yaml
actions:
  - "sendConfirmationEmail"
  - "allocateInventory"
  - "generateTrackingNumber"
```

### Self-transitions
A state can transition back to itself for status updates:
```yaml
- from: in_transit
  to: in_transit
  event: arrive_facility
```

## Use Cases

1. **Business Process Documentation**: Visualize complete order fulfillment workflows
2. **State Machine Validation**: Verify all states are reachable and transitions are valid
3. **Developer Onboarding**: Show new team members the system's state flows
4. **Testing Coverage**: Identify all state transitions that need test coverage
5. **Compliance**: Document audit trails for financial or regulatory requirements

## Best Practices

1. **Name states descriptively**: Use clear, business-oriented state names
2. **Document all transitions**: Every state change should have a clear trigger event
3. **Use guards wisely**: Guards prevent invalid transitions and encode business rules
4. **Track actions**: Actions show side effects and help identify integration points
5. **Consider end states**: Ensure all workflows have clear terminal states
