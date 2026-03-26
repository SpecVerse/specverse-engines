# Example 04-02: Organization Management

This comprehensive example demonstrates a complete organizational management system using advanced SpecVerse features including hierarchical relationships, role-based access control, and complex business workflows.


## Visual Diagram

import Mermaid from '@site/src/components/Mermaid';



{/* Auto-generated diagram from canonical examples */}

{/* Generated: 2025-07-26T14:40:17.071Z */}

<div className="diagram-generated">

<Mermaid chart={`
classDiagram
    class Company {
        +id: UUID required
        +name: String required
        +legalName: String required
        +tradingName: String
        +registrationNumber: String required unique
        +taxId: String required
        +incorporationDate: DateTime required
        +companyType: String required
        +status: String = active
        +industry: String required
        +website: URL
        +description: String
        +createdAt: DateTime required
        +updatedAt: DateTime required
        +calculateTotalEmployees(): Integer %% ensures: Returns total employee count across organization
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class CustomerProfile {
        <<profile>>
        +customerCategory: String required
        +customerSince: DateTime required
        +accountManager: String required
        +creditLimit: Money required
        +billingContact: String required
        +contractStartDate: DateTime
        +contractEndDate: DateTime
        +serviceLevel: String = basic
        +notes: String
        +companyId: UUID required
        +calculateOutstandingBalance(): Money %% ensures: Returns sum of unpaid invoices
        +checkCreditStatus(): String %% ensures: Returns current credit assessment
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class PublicCompanyProfile {
        <<profile>>
        +stockTicker: String required unique
        +exchange: String required
        +marketCap: Money
        +fiscalYearEnd: String required
        +secFilingNumber: String
        +annualReportUrl: URL
        +investorRelationsContact: String required
        +boardMembers: String required
        +lastQuarterlyReport: DateTime
        +nextEarningsDate: DateTime
        +companyId: UUID required
        +generateComplianceReport(reportType: String): String %% ensures: Returns formatted compliance report
        +scheduleEarningsCall(callDate: DateTime): Boolean %% ensures: Earnings call scheduled and stakeholders notified
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class AuditProfile {
        <<profile>>
        +auditTrail: String required
        +lastAuditDate: DateTime
        +nextAuditDue: DateTime
        +complianceStatus: String = under_review
        +auditFirm: String
        +auditContacts: String
        +riskAssessment: String
        +companyId: UUID required
        +recordChange(changeType: String, details: String, userId: UUID): Boolean %% ensures: Change recorded with timestamp and user info
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class Department {
        +id: UUID required
        +name: String required
        +code: String required unique
        +description: String
        +companyId: UUID required
        +divisionId: UUID
        +managerId: UUID
        +budget: Money
        +location: String
        +costCenter: String
        +parentDepartmentId: UUID
        +createdAt: DateTime required
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class Team {
        +id: UUID required
        +departmentId: UUID required
        +name: String required
        +teamLeaderId: UUID
        +description: String
        +maxSize: Integer = 10
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class Employee {
        +id: UUID required
        +employeeNumber: String required unique
        +firstName: String required
        +lastName: String required
        +email: Email required unique
        +hireDate: DateTime required
        +departmentId: UUID required
        +managerId: UUID
        +position: String required
        +salary: Money
        +status: String = active
        +personalInfo: String
        +contact: String required
        +emergencyContact: String
        +getFullName(): String %% ensures: Returns firstName + lastName
        +getAllSubordinates(): String %% ensures: Returns all subordinates recursively
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class Role {
        +id: UUID required
        +name: String required unique
        +description: String
        +roleLevel: Integer required min=1 max=10
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class Permission {
        +id: UUID required
        +name: String required unique
        +resource: String required
        +action: String required
        +scope: String
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class EmployeeRole {
        +employeeId: UUID required
        +roleId: UUID required
        +assignedDate: DateTime required
        +expiryDate: DateTime
        +assignedBy: UUID required
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class Project {
        +id: UUID required
        +name: String required
        +departmentId: UUID required
        +managerId: UUID required
        +budget: Money
        +startDate: DateTime required
        +endDate: DateTime
        +status: String = planning
        +description: String
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class LeaveRequest {
        +id: UUID required
        +employeeId: UUID required
        +leaveType: String required
        +startDate: DateTime required
        +endDate: DateTime required
        +reason: String
        +status: String = pending
        +approvedBy: UUID
        +approvedAt: DateTime
        +submitForApproval(): Boolean %% requires: startDate <= endDate, employee has sufficient leave balance | publishes: LeaveRequestSubmitted
        +approve(approverId: UUID, comments: String?): Boolean %% requires: approver has permission, status allows approval | publishes: LeaveRequestApproved
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class PerformanceReview {
        +id: UUID required
        +employeeId: UUID required
        +reviewerId: UUID required
        +reviewPeriod: String required
        +status: String = draft
        +overallRating: Integer min=1 max=5
        +goals: String
        +achievements: String
        +feedback: String
        +generateReviewReport(): String %% requires: review is completed | ensures: Returns performance report document
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }

    Company o-- Department : *_departments
    Company o-- Employee : *_employees
    Company o-- Company : *_subsidiaries
    Company -- Company : 1_parentCompany
    CustomerProfile <|.. Company : 1_attaches_to_priority__0
    PublicCompanyProfile <|.. Company : 1_attaches_to_priority__0
    AuditProfile <|.. Company : 1_attaches_to_priority__0
    Department -- Company : 1_company
    Department -- Employee : 1_manager
    Department o-- Team : *_teams
    Department o-- Employee : *_employees
    Department o-- Department : *_subdepartments
    Department -- Department : 1_parentDepartment
    Team -- Department : 1_department
    Team -- Employee : 1_leader
    Team -- Employee : *_members
    Employee -- Department : 1_department
    Employee -- Employee : 1_manager
    Employee o-- Employee : *_directReports
    Employee -- Team : *_teams
    Employee -- Role : *_roles
    Role -- Permission : *_permissions
    Role -- Employee : *_employees
    EmployeeRole -- Employee : 1_employee
    EmployeeRole -- Role : 1_assignedRole
    EmployeeRole -- Employee : 1_assignedByEmployee
    Project -- Department : 1_department
    Project -- Employee : 1_manager
    LeaveRequest -- Employee : 1_employee
    PerformanceReview -- Employee : 1_employee
    PerformanceReview -- Employee : 1_reviewer
    CompanyController -- Company : 1_manages
    EmployeeController -- Employee : 1_manages
    DepartmentController -- Department : 1_manages
    LeaveController -- LeaveRequest : 1_manages

    %% Other components
    class CompanyController {
        <<controller>>
        CompanyController
    }
    class EmployeeController {
        <<controller>>
        EmployeeController
    }
    class DepartmentController {
        <<controller>>
        DepartmentController
    }
    class LeaveController {
        <<controller>>
        LeaveController
    }
    class HRService {
        <<service>>
        HRService
    }
    class PayrollService {
        <<service>>
        PayrollService
    }
    class ComplianceService {
        <<service>>
        ComplianceService
    }
    class CompanyCreated {
        <<event>>
        CompanyCreated
    }
    class DepartmentCreated {
        <<event>>
        DepartmentCreated
    }
    class EmployeeHired {
        <<event>>
        EmployeeHired
    }
    class LeaveRequestSubmitted {
        <<event>>
        LeaveRequestSubmitted
    }
    class LeaveRequestApproved {
        <<event>>
        LeaveRequestApproved
    }
    class OnboardingCompleted {
        <<event>>
        OnboardingCompleted
    }
    class SalaryProcessed {
        <<event>>
        SalaryProcessed
    }
    class AuditCompleted {
        <<event>>
        AuditCompleted
    }
`} />

</div>


## Learning Objectives

- Model complex organizational hierarchies
- Implement role-based access control systems
- Design workflow and approval processes
- Create reporting and analytics patterns
- Build scalable enterprise architecture

## Business Domain

A complete organizational management system supporting multi-level hierarchies, department structures, employee management, role assignments, and workflow automation.

## Domain Overview

Enterprise-grade organizational management examples demonstrating SpecVerse v3.2 applied to complex company and organizational structures.

**Key Features Demonstrated**:
- Multi-entity corporate structures (parent/subsidiary companies)
- Employee lifecycle and role management
- Regulatory compliance and audit trails
- Multi-profile companies (Customer + PublicCompany + Audit)
- Department hierarchies and organizational charts
- Legal status tracking and state management

**Business Scenarios Covered**:
- Corporate registration and incorporation
- Employee onboarding and management
- B2B customer relationship management
- Public company regulatory compliance
- Audit trail and compliance tracking
- Organizational restructuring

**SpecVerse Concepts Showcased**:
- Complex ProfileAttachment with conditional logic
- Multiple model relationships (parent/child, manager/employee)
- Comprehensive audit patterns with the AuditProfile
- Legal entity lifecycle management
- Role-based access control modeling
- Cross-entity compliance tracking

### What You'll Learn

#### Organizational Modeling
- **Corporate Structures**: Parent companies, subsidiaries, legal entities
- **Employee Management**: Hierarchies, departments, roles, permissions
- **Legal Compliance**: Registration, tax IDs, regulatory requirements
- **Audit Systems**: Change tracking, compliance monitoring

#### Profile Composition Patterns
- **CustomerProfile**: B2B relationship management, credit terms, billing
- **PublicCompanyProfile**: Stock information, SEC compliance, investor relations
- **AuditProfile**: Comprehensive change tracking for any entity
- **Multi-Profile Compliance**: Same company with different regulatory requirements

#### Enterprise Patterns
- **Hierarchical Relationships**: Parent/child companies, manager/employee reporting
- **Legal Status Management**: Incorporation, active status, dissolution
- **Permission Systems**: Role-based access with inheritance
- **Compliance Workflows**: Audit scheduling, regulatory reporting

#### Business Process Flows
- **Company Registration**: Formation → Legal review → Activation → Compliance setup
- **Employee Onboarding**: Hiring → Department assignment → Permission setup → Audit logging
- **Compliance Review**: Scheduled audits → Report generation → Issue tracking → Resolution

### Prerequisites

- Complete [01-fundamentals](../fundamentals/01-01-basic-model) examples
- Understanding of [02-profiles](../profiles/02-01-using-profiles) system


- Familiarity with enterprise organizational concepts

### Real-World Applications

These examples are based on patterns found in:

- **Enterprise Software**: HR systems, CRM platforms, ERP solutions
- **Legal Tech**: Corporate compliance, entity management
- **Financial Services**: Customer onboarding, regulatory reporting
- **Consulting**: Organizational design, compliance consulting

### Key Enterprise Challenges Addressed

#### Compliance and Governance
- **Audit Trails**: Who changed what, when, and why
- **Regulatory Reporting**: Automated compliance report generation
- **Access Control**: Fine-grained permissions with audit logging
- **Data Retention**: Long-term storage for legal requirements

#### Organizational Complexity
- **Multi-Entity Management**: Global corporations with multiple legal entities
- **Cross-Border Operations**: Different legal requirements by jurisdiction
- **Merger & Acquisition**: Integrating acquired companies and employees
- **Reorganization**: Changing structures while maintaining compliance

#### Scalability Patterns
- **Large Organizations**: Thousands of employees across multiple entities
- **Complex Hierarchies**: Matrix organizations, multiple reporting lines
- **Geographic Distribution**: Multi-location, multi-timezone operations
- **Regulatory Diversity**: Different compliance requirements by location

### Integration Points

The company examples demonstrate integration with:

- **HR Systems**: Employee databases, payroll, benefits administration
- **Legal Systems**: Corporate filings, contract management
- **Financial Systems**: Accounting, invoicing, payment processing
- **Compliance Tools**: Audit management, regulatory reporting
- **Identity Systems**: SSO, LDAP, permission management

### Advanced Patterns Demonstrated

#### Profile Inheritance and Composition
```yaml
# A public company that's also a customer with audit requirements
Company -> CustomerProfile + PublicCompanyProfile + AuditProfile
```

#### Cross-Entity Relationships
```yaml
# Employees can work for multiple subsidiaries
Employee -> Company (primary) + Array<Company> (subsidiaries)
```

#### Conditional Profile Attachment
```yaml
# Only corporations can have public company profiles
PublicCompanyProfile.Conditions: ["companyType = 'corporation'"]
```

## Organizational Structure

### Core Organization Models

```specly
models:
  model Company:
    description: "Legal entity representing a company or organization"
    attributes:
      id: UUID required
      name: Text required
      legalName: Text required
      registrationNumber: Text required
      taxId: Text required
      incorporationDate: DateTime required
      companyType: String required
      status: String default=active
      industry: Text required
      website: URL

  model Department:
    description: "Organizational department within a company"
    attributes:
      id: UUID required
      name: Text required
      companyId: UUID required
      managerId: UUID
      budget: Money
      location: Text
      createdAt: DateTime required

  model Employee:
    description: "Company employee"
    attributes:
      id: UUID required
      employeeId: Text required
      firstName: Text required
      lastName: Text required
      email: Email required
      departmentId: UUID required
      managerId: UUID
      position: Text required
      salary: Money
      hireDate: DateTime required
      status: String default=active
```

### Project Management
```specly
model Project:
  description: "Company project"
  attributes:
    id: UUID required
    name: Text required
    departmentId: UUID required
    managerId: UUID required
    budget: Money
    startDate: DateTime required
    endDate: DateTime
    status: String default=planning
```

### Organization Operations
```specly
controllers:
  CompanyController:
    description: "Manage company operations"
    actions:
      createCompany:
        description: "Register new company"
        parameters:
          companyData: Object required
        returns: "Company"
        requires: ["Registration number is unique"]
        ensures: ["Company created"]
        publishes: [CompanyCreated]

  EmployeeController:
    description: "Manage employees"
    actions:
      hireEmployee:
        description: "Hire new employee"
        parameters:
          departmentId: UUID required
          employeeData: Object required
        returns: "Employee"
        requires: ["Department exists"]
        ensures: ["Employee hired"]
        publishes: [EmployeeHired]
```

### Department and Team Structure

```yaml
Department:
  Attributes:
    id: UUID required
    divisionId: UUID required
    name: Text required
    costCenter: Text
    managerEmployeeId: UUID
    
  Relations:
    division:
      Type: "BelongsTo"
      Target: "Division"
    manager:
      Type: "BelongsTo"
      Target: "Employee"
      Key: "managerEmployeeId"
    teams:
      Type: "HasMany"
      Target: "Team"
    employees:
      Type: "HasMany"
      Target: "Employee"
      
Team:
  Attributes:
    id: UUID required
    departmentId: UUID required
    name: Text required
    teamLeaderId: UUID
    
  Relations:
    department:
      Type: "BelongsTo"
      Target: "Department"
    leader:
      Type: "BelongsTo"
      Target: "Employee"
      Key: "teamLeaderId"
    members:
      Type: "ManyToMany"
      Target: "Employee"
      Through: "TeamMembership"
```

## Services with Operations

SpecVerse v3.2 introduces services with operations for business logic:

```specly
services:
  HRService:
    description: "Human resources management service"
    operations:
      processOnboarding:
        description: "Process new employee onboarding"
        parameters:
          employeeId: UUID required
          onboardingData: String required
        returns: Boolean
        requires: ["Employee exists", "Onboarding not completed"]
        ensures: ["Onboarding tasks completed"]
        publishes: [OnboardingCompleted]
  
  PayrollService:
    description: "Payroll processing service"
    operations:
      calculatePayroll:
        description: "Calculate payroll for period"
        parameters:
          payPeriodStart: DateTime required
          payPeriodEnd: DateTime required
          departmentId: UUID
        returns: String
        requires: ["Valid pay period"]
        ensures: ["Payroll calculated for all eligible employees"]
      
      processSalaryPayment:
        description: "Process salary payments"
        parameters:
          payrollId: UUID required
          paymentDate: DateTime required
        returns: Boolean
        requires: ["Payroll exists", "Payment date is valid"]
        ensures: ["Salary payments processed"]
        publishes: [SalaryProcessed]
  
  ComplianceService:
    description: "Compliance and audit service"
    operations:
      performAudit:
        description: "Perform compliance audit"
        parameters:
          companyId: UUID required
          auditType: String required
          auditorId: UUID required
        returns: String
        requires: ["Company exists", "Auditor is qualified"]
        ensures: ["Audit completed with findings"]
        publishes: [AuditCompleted]
```

### Role-Based Access Control with v3.2 Convention Syntax

```specly
Role:
  description: "Security role for access control"
  attributes:
    id: UUID required
    name: String required unique
    description: String
    roleLevel: Integer required min=1 max=10
  relationships:
    permissions: manyToMany Permission
    employees: manyToMany Employee
      
Permission:
  description: "Access permission"
  attributes:
    id: UUID required
    name: String required unique
    resource: String required
    action: String required values=["create", "read", "update", "delete"]
    scope: String values=["own", "department", "company", "all"]

EmployeeRole:
  description: "Employee role assignment"
  attributes:
    employeeId: UUID required
    roleId: UUID required
    assignedDate: DateTime required
    expiryDate: DateTime
    assignedBy: UUID required
  relationships:
    employee: belongsTo Employee
    assignedRole: belongsTo Role
    assignedByEmployee: belongsTo Employee
```

## Workflow and Approval Systems

### Leave Request Workflow with v3.2 Behaviors

```specly
LeaveRequest:
  description: "Employee leave request"
  attributes:
    id: UUID required
    employeeId: UUID required
    leaveType: String required values=["vacation", "sick", "personal", "maternity", "paternity"]
    startDate: DateTime required
    endDate: DateTime required
    reason: String
    status: String default=pending values=["pending", "approved", "rejected", "cancelled"]
    approvedBy: UUID
    approvedAt: DateTime
  relationships:
    employee: belongsTo Employee
  behaviors:
    submitForApproval:
      description: "Submit leave request for manager approval"
      requires: ["startDate <= endDate", "employee has sufficient leave balance"]
      returns: Boolean
      publishes: [LeaveRequestSubmitted]
    approve:
      description: "Approve leave request"
      parameters:
        approverId: UUID required
        comments: String
      requires: ["approver has permission", "status allows approval"]
      returns: Boolean
      publishes: [LeaveRequestApproved]
```

### Performance Review System with v3.2 Behaviors

```specly
PerformanceReview:
  description: "Employee performance review"
  attributes:
    id: UUID required
    employeeId: UUID required
    reviewerId: UUID required
    reviewPeriod: String required
    status: String default=draft values=["draft", "in_progress", "completed", "approved"]
    overallRating: Integer min=1 max=5
    goals: String
    achievements: String
    feedback: String
  relationships:
    employee: belongsTo Employee
    reviewer: belongsTo Employee
  behaviors:
    generateReviewReport:
      description: "Generate comprehensive performance report"
      requires: ["review is completed"]
      returns: String
      ensures: ["Returns performance report document"]
```

## Events with Attributes (v3.2 Format)

SpecVerse v3.2 uses `attributes` instead of `payload` for events:

```specly
events:
  CompanyCreated:
    description: "New company registered"
    attributes:
      companyId: UUID required
      name: String required
      registrationNumber: String required
      companyType: String required
      createdAt: DateTime required
  
  DepartmentCreated:
    description: "New department created"
    attributes:
      departmentId: UUID required
      companyId: UUID required
      name: String required
      code: String required
      createdAt: DateTime required
  
  EmployeeHired:
    description: "New employee hired"
    attributes:
      employeeId: UUID required
      employeeNumber: String required
      firstName: String required
      lastName: String required
      departmentId: UUID required
      position: String required
      hireDate: DateTime required
  
  LeaveRequestSubmitted:
    description: "Leave request submitted"
    attributes:
      leaveRequestId: UUID required
      employeeId: UUID required
      leaveType: String required
      startDate: DateTime required
      endDate: DateTime required
      submittedAt: DateTime required
  
  LeaveRequestApproved:
    description: "Leave request approved"
    attributes:
      leaveRequestId: UUID required
      employeeId: UUID required
      approvedBy: UUID required
      approvedAt: DateTime required
      comments: String
  
  OnboardingCompleted:
    description: "Employee onboarding completed"
    attributes:
      employeeId: UUID required
      completedBy: UUID required
      completedAt: DateTime required
      onboardingDuration: Integer required
  
  SalaryProcessed:
    description: "Salary payment processed"
    attributes:
      payrollId: UUID required
      employeeCount: Integer required
      totalAmount: Money required
      payPeriodStart: DateTime required
      payPeriodEnd: DateTime required
      processedAt: DateTime required
  
  AuditCompleted:
    description: "Audit completed"
    attributes:
      auditId: UUID required
      companyId: UUID required
      auditType: String required
      auditorId: UUID required
      findings: String required
      completedAt: DateTime required
```

### Deployments Section

SpecVerse v3.2 container format includes deployments:

```specly
deployments: {}
```

## Advanced v3.2 Features Demonstrated

### Container Format
- **Components and Deployments**: Structured container format for organization
- **Version Management**: Component versioning with semantic versioning
- **Export Control**: Explicit control over what is exposed from components

### Profile-Attachment System  
- **CustomerProfile**: Attaches customer-specific attributes to Company
- **PublicCompanyProfile**: Adds stock market and compliance attributes
- **AuditProfile**: Provides audit trail and compliance tracking
- **Dynamic Extension**: Companies can have multiple profiles attached

### Convention Syntax Features
- **Type Modifiers**: `String required unique`, `Integer min=1 max=10`
- **Value Constraints**: `values=["active", "inactive", "dissolved"]`
- **Default Values**: `default=active`, `default=10`
- **Relationship Clarity**: `hasMany Department`, `belongsTo Employee`

## Visual Diagram (v3.2 with Profile-Attachment)

```mermaid
classDiagram
    class Company {
        +id: UUID required
        +name: String required
        +legalName: String required
        +tradingName: String
        +registrationNumber: String required unique
        +taxId: String required
        +incorporationDate: DateTime required
        +companyType: String required
        +status: String = active
        +industry: String required
        +website: URL
        +description: String
        +createdAt: DateTime required
        +updatedAt: DateTime required
        +calculateTotalEmployees() String
    }
    class CustomerProfile {
        <<profile-attachment>>
        +customerCategory: String required
        +customerSince: DateTime required
        +accountManager: String required
        +creditLimit: Money required
        +billingContact: String required
        +contractStartDate: DateTime
        +contractEndDate: DateTime
        +serviceLevel: String = basic
        +notes: String
        +companyId: UUID required
        +calculateOutstandingBalance() Money
        +checkCreditStatus() String
    }
    class PublicCompanyProfile {
        <<profile-attachment>>
        +stockTicker: String required unique
        +exchange: String required
        +marketCap: Money
        +fiscalYearEnd: String required
        +secFilingNumber: String
        +annualReportUrl: URL
        +investorRelationsContact: String required
        +boardMembers: String required
        +lastQuarterlyReport: DateTime
        +nextEarningsDate: DateTime
        +companyId: UUID required
        +generateComplianceReport(reportType: String) String
        +scheduleEarningsCall(callDate: DateTime) Boolean
    }
    class AuditProfile {
        <<profile-attachment>>
        +auditTrail: String required
        +lastAuditDate: DateTime
        +nextAuditDue: DateTime
        +complianceStatus: String = under_review
        +auditFirm: String
        +auditContacts: String
        +riskAssessment: String
        +companyId: UUID required
        +recordChange(changeType: String, details: String, userId: UUID) Boolean
    }
    class Department {
        +id: UUID required
        +name: String required
        +code: String required unique
        +description: String
        +companyId: UUID required
        +divisionId: UUID
        +managerId: UUID
        +budget: Money
        +location: String
        +costCenter: String
        +parentDepartmentId: UUID
        +createdAt: DateTime required
    }
    class Team {
        +id: UUID required
        +departmentId: UUID required
        +name: String required
        +teamLeaderId: UUID
        +description: String
        +maxSize: Integer = 10
    }
    class Employee {
        +id: UUID required
        +employeeNumber: String required unique
        +firstName: String required
        +lastName: String required
        +email: Email required unique
        +hireDate: DateTime required
        +departmentId: UUID required
        +managerId: UUID
        +position: String required
        +salary: Money
        +status: String = active
        +personalInfo: String
        +contact: String required
        +emergencyContact: String
        +getFullName() String
        +getAllSubordinates() String
    }
    class Role {
        +id: UUID required
        +name: String required unique
        +description: String
        +roleLevel: Integer required
    }
    class Permission {
        +id: UUID required
        +name: String required unique
        +resource: String required
        +action: String required
        +scope: String
    }
    class EmployeeRole {
        +employeeId: UUID required
        +roleId: UUID required
        +assignedDate: DateTime required
        +expiryDate: DateTime
        +assignedBy: UUID required
    }
    class Project {
        +id: UUID required
        +name: String required
        +departmentId: UUID required
        +managerId: UUID required
        +budget: Money
        +startDate: DateTime required
        +endDate: DateTime
        +status: String = planning
        +description: String
    }
    class LeaveRequest {
        +id: UUID required
        +employeeId: UUID required
        +leaveType: String required
        +startDate: DateTime required
        +endDate: DateTime required
        +reason: String
        +status: String = pending
        +approvedBy: UUID
        +approvedAt: DateTime
        +submitForApproval() Boolean
        +approve(approverId: UUID, comments: String) Boolean
    }
    class PerformanceReview {
        +id: UUID required
        +employeeId: UUID required
        +reviewerId: UUID required
        +reviewPeriod: String required
        +status: String = draft
        +overallRating: Integer
        +goals: String
        +achievements: String
        +feedback: String
        +generateReviewReport() String
    }

    Company ||--o{ CustomerProfile : "profile-attachment"
    Company ||--o{ PublicCompanyProfile : "profile-attachment"
    Company ||--o{ AuditProfile : "profile-attachment"
    Company ||--o{ Department : "hasMany departments"
    Company ||--o{ Employee : "hasMany employees"
    Company ||--o{ Company : "hasMany subsidiaries"
    Company }o--|| Company : "belongsTo parentCompany"
    Department }o--|| Company : "belongsTo company"
    Department }o--|| Employee : "belongsTo manager"
    Department ||--o{ Team : "hasMany teams"
    Department ||--o{ Employee : "hasMany employees"
    Department ||--o{ Department : "hasMany subdepartments"
    Department }o--|| Department : "belongsTo parentDepartment"
    Team }o--|| Department : "belongsTo department"
    Team }o--|| Employee : "belongsTo leader"
    Team }o--o{ Employee : "manyToMany members"
    Employee }o--|| Department : "belongsTo department"
    Employee }o--|| Employee : "belongsTo manager"
    Employee ||--o{ Employee : "hasMany directReports"
    Employee }o--o{ Team : "manyToMany teams"
    Employee }o--o{ Role : "manyToMany roles"
    Role }o--o{ Permission : "manyToMany permissions"
    Role }o--o{ Employee : "manyToMany employees"
    EmployeeRole }o--|| Employee : "belongsTo employee"
    EmployeeRole }o--|| Role : "belongsTo assignedRole"
    EmployeeRole }o--|| Employee : "belongsTo assignedByEmployee"
    Project }o--|| Department : "belongsTo department"
    Project }o--|| Employee : "belongsTo manager"
    LeaveRequest }o--|| Employee : "belongsTo employee"
    PerformanceReview }o--|| Employee : "belongsTo employee"
    PerformanceReview }o--|| Employee : "belongsTo reviewer"
```


## Complete Example

### Primary Specly DSL Format (v3.2)
See [04-02-organization-management.specly](./04-02-organization-management.specly) for the complete SpecVerse v3.2 Specly DSL format.

To validate the specification:
```bash
specverse validate 04-02-organization-management.specly
```

## Key v3.2 Features Demonstrated

- **Container Format**: Components and deployments structure
- **Profile-Attachment System**: CustomerProfile, PublicCompanyProfile, AuditProfile
- **Convention Syntax**: Type modifiers, value constraints, defaults
- **Controller-Model Association**: Controllers linked to specific models
- **Services with Operations**: Business logic services separate from controllers
- **Event Attributes**: Events use attributes instead of payload
- **Relationship Clarity**: Clear belongsTo, hasMany, manyToMany syntax
- **Advanced Behaviors**: Parameters, returns, requires, ensures, publishes

## v3.2 Architecture Patterns

### Profile-Attachment Pattern
- **Dynamic Extension**: Companies can have multiple profiles attached
- **Separation of Concerns**: Core model vs. specialized attributes
- **Type Safety**: Profile-specific behaviors and validations

### Container Organization
- **Component Isolation**: Clear boundaries with exports
- **Version Management**: Semantic versioning for components
- **Dependency Management**: Explicit import/export declarations

### Convention-Over-Configuration
- **Readable Syntax**: Human-friendly type specifications
- **Type Safety**: Built-in validation with constraints
- **Consistency**: Standardized patterns across all definitions

## v3.2 Implementation Benefits

### Developer Experience
- **Convention Syntax**: More readable than pure YAML
- **Type Safety**: Built-in validation and constraints
- **IDE Support**: Rich completion and validation

### Architecture Quality
- **Clear Separation**: Models, controllers, services, events clearly separated
- **Profile System**: Clean extension mechanism without inheritance
- **Service Layer**: Business logic properly separated from controllers

## Validation

Test this v3.2 example:
```bash
specverse validate examples/04-domains/04-02-organization-management.specly
```

## Next Steps

Continue to [Example 05-01: SpecVerse Meta-Specification](../05-meta/05-01-specverse-meta-specification) to see how SpecVerse v3.2 can model itself.

## Related Examples

- [Example 03-07: Relationships Demo](../03-architecture/03-07-relationships-demo) - Advanced v3.2 relationship patterns
- [Example 02-02: Profile Attachment](../02-profiles/02-02-profile-attachment) - Profile-attachment system basics
- [Example 03-05: Complete Event Flow](../03-architecture/03-05-complete-event-flow) - v3.2 event orchestration