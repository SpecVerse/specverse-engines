# Example 11-09: Event Flow Layered Diagram

## Overview

This example demonstrates a **5-layer architecture with dual event bus pattern** for an e-commerce platform. It shows how domain events (business logic layer) and application events (UI notification layer) flow through different architectural layers.

## Generated Diagram

```mermaid
graph TD
  %% Event Flow Architecture - will be auto-generated
```

## Diagram Types Generated

- **event-flow-layered**: Shows the 5-layer architecture with event flow
- Plus 10 other unified diagram types

## Architecture Pattern

### 5-Layer Architecture:
1. **Layer 1: Models** - Core business entities (Order, Product, Payment, Customer, Shipment)
2. **Layer 2: Domain Events** - Business logic events (OrderPlaced, PaymentConfirmed, StockReserved)
3. **Layer 3: Controllers & Services** - Application logic that subscribes to domain events and publishes app events
4. **Layer 4: Application Events** - UI notification events (OrderCreatedNotification, PaymentSuccessNotification)
5. **Layer 5: Views** - UI components that subscribe to application events

### Dual Event Bus Pattern:
- **Domain Event Bus**: Handles business logic events between services
- **Application Event Bus**: Handles UI notification events to views

## Key Features

### Models (5)
- **Order**: Customer order with complete workflow
- **Product**: Product with inventory management
- **Payment**: Payment transaction
- **Customer**: Customer account with loyalty points
- **Shipment**: Shipment tracking

### Controllers (3)
- **OrderController**: Handles order domain events, publishes app events
- **ProductController**: Handles product domain events, publishes app events
- **CustomerController**: Handles customer domain events, publishes app events

### Services (6)
- **PaymentService**: Processes payments, subscribes to OrderPlaced
- **InventoryService**: Manages inventory, subscribes to PaymentConfirmed
- **ShippingService**: Coordinates shipping, subscribes to StockReserved
- **NotificationService**: Sends notifications
- **AnalyticsService**: Tracks metrics across all events
- **LoyaltyService**: Manages loyalty program

### Domain Events (22)
Order flow: OrderPlaced, PaymentConfirmed, OrderShipped, OrderCompleted, OrderCancelled

Inventory: StockReserved, LowStockDetected, PriceChanged, StockReplenished

Payment: PaymentProcessed, PaymentFailed, RefundProcessed

Customer: CustomerRegistered, PointsAwarded, ProfileUpdated

Shipping: ShipmentCreated, TrackingUpdated, ShipmentDelivered

### Application Events (15)
UI notifications for orders, payments, shipping, inventory updates, customer interactions

### Views (6)
- OrderDashboard, ProductCatalog, CustomerProfile, TrackingPage, CheckoutFlow, AdminAnalytics

## Event Flow Example

```
1. OrderPlaced (Domain) → PaymentService.processPayment()
2. PaymentProcessed (Domain) → PaymentConfirmed (Domain)
3. PaymentConfirmed (Domain) → InventoryService.reserveStock()
4. StockReserved (Domain) → ShippingService.createShipment()
5. OrderController.handleOrderPlaced() → OrderCreatedNotification (App Event)
6. OrderCreatedNotification → OrderDashboard.update()
```

## Use Cases

- E-commerce platforms with complex order workflows
- Systems requiring separation between business logic and UI events
- Event-driven architectures with multiple subscriber patterns
- Applications needing clear layer separation

## Related Examples

- **11-01**: Basic event flow sequence
- **11-02**: Event flow with swimlanes
- **11-08**: Deployment topology with event bus
