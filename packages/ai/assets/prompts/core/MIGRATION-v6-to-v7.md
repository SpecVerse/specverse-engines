# Migration Guide: SpecVerse Prompts v6 → v7

**Upgrade your AI workflows to the enhanced v7 prompts with data consistency and environment-adaptive generation**

## 🎯 Overview

SpecVerse v7 prompts represent a major upgrade focused on:
- **Data consistency**: Multi-layer validation and type mapping
- **Environment adaptation**: Output that scales with your needs
- **Production readiness**: Battle-tested patterns and automation
- **Real-world reliability**: Based on actual implementation experience

## 📊 What's New in v7

### Key Enhancements

| Area | v6 | v7 |
|------|----|----|
| **Data Handling** | Basic column mapping | ✅ Snake_case ↔ CamelCase automation |
| **Validation** | Client-side only | ✅ Database + API + Frontend |
| **Error Handling** | Manual patterns | ✅ Comprehensive recovery patterns |
| **Environments** | One-size-fits-all | ✅ Adaptive (dev/test/prod/enterprise) |
| **Setup** | Manual configuration | ✅ Automated scripts (start.sh) |
| **Testing** | Limited examples | ✅ Battle-tested with real applications |

### New Features
- **Database-level validation functions** for conflict detection
- **Environment-aware deployment** configurations
- **Comprehensive error handling** with recovery patterns
- **Automated setup scripts** for instant productivity
- **Multi-layer type safety** across all application layers

## 🔄 Migration Steps

### Step 1: Update File Paths

**Before (v6):**
```bash
prompts/core/standard/v6/create.prompt.yaml
prompts/core/standard/v6/materialise.prompt.yaml
prompts/core/standard/v6/realize.prompt.yaml
```

**After (v7):**
```bash
prompts/core/standard/v7/create.prompt.yaml
prompts/core/standard/v7/materialise.prompt.yaml
prompts/core/standard/v7/realize.prompt.yaml
```

### Step 2: Update Variable Sets

#### Materialise Prompt Variables

**v6 Variables:**
```yaml
specificationFile: "spec.specly"
targetFramework: "nextjs"
implementationStyle: "modern"
developmentEnvironment: "local"
```

**v7 Variables (Enhanced):**
```yaml
specificationFile: "spec.specly"
targetFramework: "nextjs"
implementationStyle: "modern"
developmentEnvironment: "local"
# NEW in v7:
dataConsistencyLevel: "strict"          # basic/strict/paranoid
errorHandlingStrategy: "comprehensive"  # minimal/standard/comprehensive
validationDepth: "multi-layer"         # client-only/api-level/multi-layer/database-enforced
setupAutomation: "full"                # manual/semi-automated/full
```

#### Realize Prompt Variables

**v6 Variables:**
```yaml
cloudProvider: "aws"
environmentType: "production"
scaleRequirements: "standard"
```

**v7 Variables (Enhanced):**
```yaml
cloudProvider: "vercel"                 # Added vercel, netlify, local
environmentType: "production"           # Now drives output complexity
scaleRequirements: "auto"              # auto adjusts based on environment
# NEW in v7:
deploymentStrategy: "rolling"          # rolling/blue-green/canary/recreate
databaseStrategy: "managed"            # managed/self-hosted/serverless/local
localDevSupport: "full"               # none/basic/full
automationLevel: "comprehensive"       # manual/basic/comprehensive
```

### Step 3: Update Prompt Templates

#### Terminal Usage

**v6 Terminal Prompt:**
```
Generate a complete implementation from this SpecVerse specification:

[SPECIFICATION]

Target Framework: nextjs
Implementation Style: modern

Please generate complete project structure and code.
```

**v7 Terminal Prompt (Enhanced):**
```
Generate a complete implementation from this SpecVerse specification:

[SPECIFICATION]

Target Framework: nextjs
Implementation Style: modern
Data Consistency Level: strict
Error Handling Strategy: comprehensive
Validation Depth: multi-layer
Setup Automation: full

Generate:
1. Complete project structure with automated setup
2. Database schema with multi-layer validation
3. API routes with comprehensive error handling
4. React components with type-safe data handling
5. Setup scripts (start.sh) for instant development
6. Production-ready configurations
```

### Step 4: Review Generated Output

#### Enhanced Database Layer

**v7 Generates:**
```typescript
// Enhanced with type mapping
export async function getBookings(): Promise<Booking[]> {
  const result = await query('SELECT * FROM bookings ORDER BY check_in')
  // v7: Automatic snake_case to camelCase mapping
  return result.rows.map(row => ({
    id: row.id,
    roomId: row.room_id,           // ← Automatic mapping
    guestName: row.guest_name,     // ← Automatic mapping
    checkIn: row.check_in,         // ← Automatic mapping
    checkOut: row.check_out,       // ← Automatic mapping
    notes: row.notes,
    createdAt: row.created_at
  }))
}
```

#### Enhanced Error Handling

**v7 Generates:**
```typescript
// Comprehensive error handling with recovery
try {
  const bookings = await getBookings()
  return NextResponse.json(bookings)
} catch (error) {
  console.error('Error fetching bookings:', error)

  // v7: Detailed error classification and recovery
  if (error.code === 'ECONNREFUSED') {
    return NextResponse.json(
      { error: 'Database connection failed', retry: true },
      { status: 503 }
    )
  }

  return NextResponse.json(
    { error: 'Internal server error', details: error.message },
    { status: 500 }
  )
}
```

#### Environment-Adaptive Deployment

**v7 Development Environment:**
```yaml
# Simple Docker Compose for development
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: guesthouse_dev
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"

  app:
    build: .
    ports:
      - "3000:3000"
    depends_on:
      - postgres
```

**v7 Production Environment:**
```yaml
# Full infrastructure with monitoring
apiVersion: apps/v1
kind: Deployment
metadata:
  name: guesthouse-app
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1
      maxSurge: 1
  template:
    spec:
      containers:
      - name: app
        image: guesthouse:latest
        ports:
        - containerPort: 3000
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
        readinessProbe:
          httpGet:
            path: /api/ready
            port: 3000
```

## ⚠️ Breaking Changes

### 1. Materialise Prompt Structure

**Breaking Change:** Multi-phase template with data analysis
```yaml
# v7 requires analysis phase before implementation
## PHASE 1: DATA ANALYSIS
Analyze the specification for:
- Data models and their relationships
- Validation rules and constraints
- Potential conflict scenarios

## PHASE 2: IMPLEMENTATION GENERATION
Generate implementation with data consistency focus
```

### 2. Realize Prompt Environment Logic

**Breaking Change:** Conditional template based on environment
```yaml
# v7 uses conditional logic
{% if environmentType == "development" %}
Generate simple Docker Compose setup
{% elif environmentType == "production" %}
Generate production infrastructure
{% endif %}
```

### 3. Enhanced Variable Requirements

**Breaking Change:** New required variables for consistency
- `dataConsistencyLevel` - Controls validation depth
- `errorHandlingStrategy` - Defines error handling approach
- `environmentType` - Drives output complexity

## 🛠️ Troubleshooting Common Migration Issues

### Issue: Data Not Displaying After Migration

**Symptoms:**
- API returns data but frontend shows empty
- Database queries work but components don't render

**v7 Solution:**
```yaml
# Use strict data consistency in materialise
dataConsistencyLevel: "strict"
validationDepth: "multi-layer"
```

**Result:** Automatic snake_case/camelCase mapping generated

### Issue: Over-Engineered Development Environment

**Symptoms:**
- Complex infrastructure for local development
- Unnecessary monitoring and compliance features

**v7 Solution:**
```yaml
# Use development environment type
environmentType: "development"
localDevSupport: "full"
```

**Result:** Simple Docker Compose + start.sh script

### Issue: Missing Error Handling

**Symptoms:**
- Application crashes on errors
- No recovery mechanisms
- Poor error messages

**v7 Solution:**
```yaml
# Use comprehensive error handling
errorHandlingStrategy: "comprehensive"
```

**Result:** Complete error handling with recovery patterns

## ✅ Validation Checklist

After migration, verify:

- [ ] **File paths updated** to v7 directories
- [ ] **New variables added** for data consistency and environment
- [ ] **Generated code includes** type mapping functions
- [ ] **Error handling is comprehensive** with recovery patterns
- [ ] **Setup scripts work** (start.sh can launch application)
- [ ] **Environment-appropriate complexity** (dev ≠ prod features)
- [ ] **Database validation** functions are generated
- [ ] **Multi-layer validation** across all boundaries

## 📚 Learning Resources

### Example Migration

See the complete guesthouse booking system example that validated v7:
- **Before**: Manual setup, data mapping issues, basic error handling
- **After**: Automated setup, consistent data flow, comprehensive error handling

### Key Files to Review

1. **`lib/db.ts`** - Data mapping functions
2. **`start.sh`** - Automated setup script
3. **`schema.sql`** - Database constraints and functions
4. **API routes** - Error handling patterns
5. **Components** - Type-safe data handling

## 🎯 Best Practices for v7

### 1. Choose Appropriate Data Consistency
- **Basic**: Simple applications, minimal validation
- **Strict**: Business applications (recommended)
- **Paranoid**: Financial/healthcare applications

### 2. Environment-Specific Configuration
- **Development**: Focus on speed and debugging
- **Production**: Include monitoring and security
- **Enterprise**: Full compliance and disaster recovery

### 3. Gradual Migration Strategy
1. Start with development environment
2. Validate data consistency patterns
3. Test error handling scenarios
4. Migrate production configurations
5. Update team documentation

## 🚀 Next Steps

1. **Update your prompts** to v7 syntax
2. **Test with a small project** to validate migration
3. **Review generated code** for quality improvements
4. **Update team documentation** with v7 patterns
5. **Enjoy enhanced productivity** with automated setup!

---

**Need help?** Check the [troubleshooting section](README.md#troubleshooting) in the main README or review the [CHANGELOG](CHANGELOG.md) for detailed changes.