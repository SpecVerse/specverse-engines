# Example 11-04: Service Architecture Diagram

**Demonstrates**: Service layer organization and dependencies

## Overview

The **Service Architecture** diagram visualizes service layer organization, showing how services interact with models and communicate via events. Ideal for microservices, service-oriented architectures, and complex business logic layers.

## Key Features

- Service groupings and responsibilities
- Service-to-model data access patterns
- Service dependencies via event subscriptions
- Event-driven communication visualization
- Business logic encapsulation

## When to Use

✅ **Use when:**
- Documenting **microservices or SOA**
- Showing **service dependencies**
- Explaining **business logic organization**
- Planning **service decomposition**
- Reviewing **event-driven patterns**

## Generated Diagram

The service architecture diagram shows services, their operations, event subscriptions, and data model access:

```mermaid
graph TB
  subgraph services_layer["🔧 SERVICE LAYER"]
    AccountService("AccountService<br/>Operations: openAccount, closeAccount, transferFunds")
    TransactionService("TransactionService<br/>Operations: processTransaction<br/>Subscribes: FundsTransferred")
    FraudDetectionService("FraudDetectionService<br/>Subscribes: TransactionCreated")
    NotificationService("NotificationService<br/>Subscribes: TransactionProcessed, FraudAlertCreated")
  end
  subgraph models_layer["📦 DATA MODELS"]
    model_Account("Account")
    model_Transaction("Transaction")
    model_Customer("Customer")
  end

  AccountService -->|"uses"| model_Account
  TransactionService -->|"uses"| model_Transaction
  FraudDetectionService -->|"uses"| model_Transaction
  NotificationService -->|"uses"| model_Customer
  TransactionService -.->|"FundsTransferred"| FraudDetectionService
  TransactionService -.->|"TransactionProcessed"| NotificationService
```

*Note: This is a simplified view. The complete diagram includes all 8 services with full event subscription patterns.*

## Generating

```bash
# Basic generation
specverse gen diagram 11-04-service-architecture-demo.specly -d service-architecture -o service.mmd

# With theme
specverse gen diagram 11-04-service-architecture-demo.specly -d service-architecture --theme forest -o service-forest.mmd
```

## Example Scenario

**Banking Transaction Processing System** with 8 services:

### Services
1. **AccountService**: Account management and transfers
2. **TransactionService**: Transaction processing
3. **FraudDetectionService**: Real-time fraud analysis
4. **NotificationService**: Customer alerts
5. **AuditService**: Audit trail logging
6. **ComplianceService**: Regulatory compliance
7. **ReportingService**: Analytics and reporting
8. **BalanceReconciliationService**: Balance verification

### Service Communication Patterns

**Event-Driven Dependencies**:
```
AccountService → FundsTransferred → TransactionService
TransactionService → TransactionCreated → FraudDetectionService
FraudDetectionService → FraudAlertCreated → NotificationService
```

**Parallel Processing**:
```
TransactionProcessed → NotificationService
TransactionProcessed → AuditService
TransactionProcessed → ReportingService
```

## Visualization Structure

### Service Nodes
- Service name and operations
- Subscribed events
- Business logic responsibilities

### Model Nodes
- Data models accessed by services
- Key attributes
- Grouped in data layer

### Edges
- **Solid**: Service → Model (data access)
- **Dashed**: Service → Service (via events)
- **Labels**: Event names or "uses"

## Best Practices

1. **Clear responsibilities**: Each service has focused purpose
2. **Event-driven communication**: Reduce direct dependencies
3. **Shared models**: Services access common data models
4. **Service grouping**: Related services shown together
5. **Document operations**: Show key business operations

## Troubleshooting

### Missing Service Dependencies

**Problem**: Services shown but no connections

**Solution**: Define event subscriptions with `subscribes_to`

### Too Complex

**Problem**: Too many services make diagram cluttered

**Solution**: Split by domain area or create multiple diagrams

---

**Generated with SpecVerse v3.2**
**Diagram Type**: service-architecture
**Example**: 11-04-service-architecture-demo.specly
