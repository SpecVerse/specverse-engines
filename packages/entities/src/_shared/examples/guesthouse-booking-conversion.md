# Example 07-03: Guesthouse Booking Conversion

**Source**: `../SpecLang/guesthouse.spec.json`  
**Category**: Legacy Format Conversions  
**Format**: SpecVerse v3.2 Container  


## Visual Diagram

import Mermaid from '@site/src/components/Mermaid';



{/* Auto-generated diagram from canonical examples */}

{/* Generated: 2025-07-26T14:40:16.328Z */}

<div className="diagram-generated">

<Mermaid chart={`
classDiagram
    class House {
        +id: UUID required unique
        +name: String required
        +address: String
        +createdAt: DateTime required
        +addRoom(roomData: Room): Room %% publishes: RoomAdded
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class Room {
        +id: UUID required unique
        +houseId: UUID required
        +name: String required
        +createdAt: DateTime required
        +checkAvailability(checkIn: Date, checkOut: Date): Boolean
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class Booking {
        +id: UUID required unique
        +roomId: UUID required
        +guestName: String required
        +checkIn: Date required
        +checkOut: Date required
        +notes: String
        +createdAt: DateTime required
        +validateDates(): Boolean
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class User {
        +id: UUID required unique
        +email: String required
        +isAllowed: Boolean required
        +lastLogin: DateTime
        +validateAccess(): Boolean
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }

    House o-- Room : *_rooms
    Room -- House : 1_house
    Room o-- Booking : *_bookings
    Booking -- Room : 1_room
    BookingController -- Booking : 1_manages
    AuthController -- User : 1_manages

    %% Other components
    class BookingController {
        <<controller>>
        BookingController
    }
    class AuthController {
        <<controller>>
        AuthController
    }
    class TimelineService {
        <<service>>
        TimelineService
    }
    class ValidationService {
        <<service>>
        ValidationService
    }
    class HouseCreated {
        <<event>>
        HouseCreated
    }
    class RoomAdded {
        <<event>>
        RoomAdded
    }
    class BookingCreated {
        <<event>>
        BookingCreated
    }
    class BookingUpdated {
        <<event>>
        BookingUpdated
    }
    class BookingDeleted {
        <<event>>
        BookingDeleted
    }
    class UserAuthenticated {
        <<event>>
        UserAuthenticated
    }
`} />

</div>


## Overview

This example demonstrates the conversion of a multi-property booking system from legacy JSON format, showcasing advanced relational modeling, authentication, timeline visualization, and service-oriented architecture patterns.

## Business Domain

**Multi-Property Booking System** with property management, guest reservations, and timeline visualization

## Key Features Demonstrated

### Advanced Patterns
- **Model Relationships**: hasMany and belongsTo patterns
- **Authentication System**: User management and access control
- **Timeline Components**: Advanced date range and scheduling UI
- **Service Architecture**: Business logic separation
- **Modal Dialogs**: Complex UI interaction patterns

### Business Functionality
- Multi-property management (House → Room → Booking hierarchy)
- Guest booking and reservation system
- Timeline visualization for availability
- User authentication and role management
- Property and room scheduling

## SpecVerse Concepts

### Models with Relationships
```specly
House:
  relationships:
    rooms: hasMany Room
    
Room:
  relationships:
    house: belongsTo House
    bookings: hasMany Booking
    
Booking:
  relationships:
    room: belongsTo Room
    guest: belongsTo User
```

### Controllers  
- **PropertyController**: Multi-property management
- **BookingController**: Reservation processing
- **AuthController**: Authentication and user management

### Services
- **BookingService**: Business logic for reservations
- **PropertyService**: Property and room management
- **NotificationService**: Guest and owner communications

### Views
- **Timeline Components**: Advanced scheduling visualization
- **Modal Dialogs**: Booking forms and confirmations
- **Property Management**: Multi-property dashboard
- **Guest Portal**: Booking interface for guests

## Advanced Patterns

#### 1. Relational Data Modeling
```specly
# Complex relationship hierarchy
House:
  attributes:
    name: String required
    address: String required
  relationships:
    rooms: hasMany Room
    owner: belongsTo User
    
Room:
  attributes:
    number: String required
    capacity: Integer required
  relationships:
    house: belongsTo House
    bookings: hasMany Booking
```

#### 2. Timeline Visualization
```specly
TimelineView:
  components:
    DateRangePicker:
      properties:
        minDate: "today"
        maxDate: "+1 year"
        format: "MM/dd/yyyy"
    AvailabilityCalendar:
      properties:
        displayMode: "month"
        selectable: true
        events: [BookingUpdated, AvailabilityChanged]
```

#### 3. Authentication Integration
```specly
AuthController:
  actions:
    login:
      parameters:
        email: String required
        password: String required
      returns: SessionToken
    register:
      parameters:
        userInfo: UserRegistration required
      returns: User
```

## Key Conversions Made

#### 1. Relationship Modeling
- **Flat Data Structure** → **Hierarchical Relationships**
- Proper hasMany/belongsTo modeling
- Cascade handling and referential integrity

#### 2. UI Component Enhancement
- **Basic Forms** → **Rich Interactive Components**
- Timeline and calendar components
- Modal dialog specifications
- Advanced data visualization

#### 3. Service Architecture
- **Controller-Heavy Logic** → **Service-Oriented Design**
- Business logic separation
- Reusable service components
- Clean API boundaries

## Prerequisites

- Complete [07-02: Inventory Management Conversion](./07-02-inventory-management-conversion)
- Understanding of relational data modeling
- Familiarity with booking and reservation systems
- Knowledge of authentication patterns

## Learning Outcomes

1. **Relational Modeling**: Complex multi-entity relationships
2. **Timeline Visualization**: Advanced scheduling UI components
3. **Service Architecture**: Business logic organization
4. **Authentication Integration**: User management patterns
5. **Modal UI Patterns**: Complex user interaction flows

## Validation

This converted specification demonstrates enterprise-grade patterns:

```bash
# Validate the conversion
specverse validate examples/07-legacy-conversions/07-03-guesthouse-booking-conversion.specly

# Run full test cycle
specverse test cycle examples/07-legacy-conversions/07-03-guesthouse-booking-conversion.specly
```

**Result**: ✅ 100% validation success with complex relationships

## Next Steps

- Review [04-02: Organization Management](../04-domains/04-02-organization-management) for enterprise patterns
- Explore [03-07: Relationships Demo](../03-architecture/03-07-relationships-demo) for advanced relationships
- See [01-04: Models with Relations](../01-fundamentals/01-04-models-with-relations) for relationship fundamentals

This example demonstrates how complex multi-entity legacy systems can be successfully migrated to SpecVerse v3.2, gaining enhanced relationship modeling, improved UI components, and better architectural separation while maintaining all original functionality.