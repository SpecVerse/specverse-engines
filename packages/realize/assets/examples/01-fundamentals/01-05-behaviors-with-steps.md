# Example 01-05: Behaviors with Steps

This example demonstrates how to add procedural documentation to behaviors using the `steps` property in SpecVerse v3.2, providing clear, sequential documentation of complex business processes.

## Learning Objectives

- Understand the `steps` property in ExecutableProperties
- Learn to document complex business processes with sequential steps
- Apply steps to behaviors, controller actions, and service operations
- Master step-by-step process documentation for better code clarity

## Key Concepts

### Steps Property in ExecutableProperties

The `steps` property allows you to document the sequential execution process of any ExecutableProperty:

```specly
behaviors:
  processOrder:
    description: "Process customer order with detailed steps"
    parameters:
      orderId: UUID required
      customerData: Object required
    returns: OrderResult
    steps:
      - "Validate customer information and order data"
      - "Check inventory availability for all items"
      - "Calculate pricing with applicable discounts"
      - "Reserve inventory for order items"
      - "Process payment authorization"
      - "Generate order confirmation"
      - "Send confirmation email to customer"
    requires:
      - "Customer exists and is active"
      - "All order items are available"
    ensures:
      - "Order is created with confirmed status"
      - "Inventory is reserved"
      - "Customer receives confirmation"
```

### Steps in Different Contexts

Steps can be used across all ExecutableProperties in SpecVerse v3.2:

**Model Behaviors**: Document business logic execution flow
```specly
validatePayment:
  description: "Validate payment information with security checks"
  parameters:
    paymentMethod: String required
    amount: Money required
  returns: Boolean
  steps:
    - "Verify payment method is supported"
    - "Validate payment amount against limits"
    - "Check fraud detection systems"
    - "Authenticate payment credentials"
    - "Return validation result"
```

**Controller Actions**: Detail API endpoint processing steps
```specly
controllers:
  OrderController:
    actions:
      validateAndCreate:
        description: "Validate order data and create new order"
        parameters:
          orderData: Object required
        returns: Order
        steps:
          - "Validate required order fields"
          - "Check customer eligibility"
          - "Verify product availability"
          - "Calculate total pricing"
          - "Create order record"
```

**Service Operations**: Outline business logic workflow steps
```specly
services:
  OrderProcessingService:
    operations:
      executeFullWorkflow:
        description: "Execute complete order processing workflow"
        parameters:
          orderId: UUID required
        returns: ProcessingResult
        steps:
          - "Retrieve order details"
          - "Process payment authorization"
          - "Update inventory levels"
          - "Generate shipping labels"
          - "Send confirmation notifications"
          - "Update order status to processed"
```

### Steps Format and Syntax

The `steps` property uses a simple array of strings format:
- **Type**: Array of strings (`steps: Array<string>`)
- **Optional**: Not required - existing specifications continue to work
- **Position**: Can be placed alongside other ExecutableProperty attributes
- **Content**: Each step should be a clear, actionable description

```specly
# Steps work with all ExecutableProperty attributes
processComplexOperation:
  description: "Handle complex multi-step operation"
  parameters:
    data: Object required
    options: Object
  returns: Result
  steps:
    - "Validate input data structure"
    - "Apply business rule transformations"
    - "Execute core processing logic"
    - "Generate output in required format"
  requires: ["data is well-formed", "user has permissions"]
  ensures: ["operation completes successfully", "result is validated"]
  publishes: [OperationCompleted]
```

## Visual Diagram

import Mermaid from '@site/src/components/Mermaid';

{/* Auto-generated diagram from canonical examples */}

{/* Generated: 2025-07-28T10:13:33.624Z */}

<div className="diagram-generated">

<Mermaid chart={`
classDiagram
    class OrderProcessor {
        +id: UUID required
        +status: String required
        +processOrder(orderId: UUID, customerData: Object): OrderResult %% steps: Validate customer information and order data, Check inventory availability for all items, Calculate pricing with applicable discounts, Reserve inventory for order items, Process payment authorization, Generate order confirmation, Send confirmation email to customer | requires: Customer exists and is active, All order items are available | ensures: Order is created with confirmed status, Inventory is reserved, Customer receives confirmation
        +validatePayment(paymentMethod: String, amount: Money): Boolean %% steps: Verify payment method is supported, Validate payment amount against limits, Check fraud detection systems, Authenticate payment credentials, Return validation result
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }

    %% Other components
    class OrderController {
        <<controller>>
        OrderController
    }
    class OrderProcessingService {
        <<service>>
        OrderProcessingService
    }
`} />

</div>

## Complete Example

### Primary: Specly DSL Format (.specly)
```specly
components:
  BehaviorsWithSteps:
    version: "3.2.0"
    description: "Example 01-05: Behaviors with steps for process documentation"
    
    export:
      models: [OrderProcessor]
      controllers: [OrderController]
      services: [OrderProcessingService]
    
    import:
      - from: "@specverse/primitives"
        select: [UUID, Money, DateTime]
    
    models:
      OrderProcessor:
        description: "Order processing model with step-documented behaviors"
        attributes:
          id: UUID required
          status: String required
        behaviors:
          processOrder:
            description: "Process customer order with detailed steps"
            parameters:
              orderId: UUID required
              customerData: Object required
            returns: OrderResult
            steps:
              - "Validate customer information and order data"
              - "Check inventory availability for all items"
              - "Calculate pricing with applicable discounts"
              - "Reserve inventory for order items"
              - "Process payment authorization"
              - "Generate order confirmation"
              - "Send confirmation email to customer"
            requires:
              - "Customer exists and is active"
              - "All order items are available"
            ensures:
              - "Order is created with confirmed status"
              - "Inventory is reserved"
              - "Customer receives confirmation"
          
          validatePayment:
            description: "Validate payment information with security checks"
            parameters:
              paymentMethod: String required
              amount: Money required
            returns: Boolean
            steps:
              - "Verify payment method is supported"
              - "Validate payment amount against limits"
              - "Check fraud detection systems"
              - "Authenticate payment credentials"
              - "Return validation result"
    
    controllers:
      OrderController:
        model: OrderProcessor
        description: "Handle order-related API operations"
        actions:
          validateAndCreate:
            description: "Validate order data and create new order"
            parameters:
              orderData: Object required
            returns: Order
            steps:
              - "Validate required order fields"
              - "Check customer eligibility"
              - "Verify product availability"
              - "Calculate total pricing"
              - "Create order record"
    
    services:
      OrderProcessingService:
        description: "Business logic for order processing workflows"
        operations:
          executeFullWorkflow:
            description: "Execute complete order processing workflow"
            parameters:
              orderId: UUID required
            returns: ProcessingResult
            steps:
              - "Retrieve order details"
              - "Process payment authorization"
              - "Update inventory levels"
              - "Generate shipping labels"
              - "Send confirmation notifications"
              - "Update order status to processed"

deployments: {}
```

See the full file: [01-05-behaviors-with-steps.specly](./01-05-behaviors-with-steps.specly)

### Generated: YAML Format
The YAML format is automatically generated from the Specly DSL using:
```bash
specverse gen yaml 01-05-behaviors-with-steps.specly -o 01-05-behaviors-with-steps.yaml
```

## Key Features Demonstrated

- **Steps Property**: Array of strings documenting sequential execution process
- **Universal Application**: Steps work in behaviors, controller actions, and service operations
- **Documentation Enhancement**: Clear process flow documentation alongside existing contracts
- **Backward Compatibility**: Optional property that doesn't break existing specifications
- **Integration**: Steps work seamlessly with requires, ensures, and publishes properties

## Validation

Test this example:
```bash
# Validate the Specly source file
specverse validate examples/01-fundamentals/01-05-behaviors-with-steps.specly

# Process to YAML and validate
specverse gen yaml examples/01-fundamentals/01-05-behaviors-with-steps.specly -o temp.yaml
specverse validate temp.yaml

# Or use the test cycle command for full validation
specverse test cycle examples/01-fundamentals/01-05-behaviors-with-steps.specly
```

## Next Steps

This completes the fundamentals series. Continue to [Example 02-01: Using Profiles](../02-profiles/02-01-using-profiles) to learn about extending models with profiles.

## Related Examples

- [Example 01-03: Model with Behaviors](./01-03-model-with-behaviors) - Foundation of behaviors without steps
- [Example 03-02: Controllers and Actions](../03-architecture/03-02-controllers-and-actions) - Advanced controller patterns
- [Example 03-03: Services and Events](../03-architecture/03-03-services-and-events) - Service operation patterns