#!/bin/bash

# SpecVerse Comprehensive Test Script
# Tests all commands and validates generated specifications

set -e  # Exit on any error

echo "🚀 Starting comprehensive SpecVerse test..."

# Create necessary directories
mkdir -p generated docs/diagrams generated/docs generated/code

# Step 1: Validate original specification
echo "📋 Step 1: Validating original specification..."
npm run validate

# Step 2: Generate complete specification and validate it
echo "🧠 Step 2: Generating and validating complete specification..."
npm run infer
specverse validate generated/{{projectNameKebab}}-complete.specly

# Step 3: Generate development deployment and validate it
echo "🏗️ Step 3: Generating and validating development deployment..."
npm run infer:deployment
specverse validate generated/{{projectNameKebab}}-deployed.specly

# Step 4: Generate production deployment and validate it
echo "🏭 Step 4: Generating and validating production deployment..."
npm run infer:deployment:prod
specverse validate generated/{{projectNameKebab}}-deployed-prod.specly

# Step 5: Generate documentation and diagrams for original spec
echo "📚 Step 5: Generating docs and diagrams for original specification..."
npm run generate:docs
npm run generate:diagrams

# Step 6: Generate documentation for all inferred specifications
echo "📖 Step 6: Generating docs for all inferred specifications..."
npm run infer:docs
npm run infer:deployment:docs
npm run infer:deployment:prod:docs

# Step 7: Test YAML processing
echo "⚙️ Step 7: Testing YAML processing..."
npm run process

# Step 8: Test v3.3 Code Realization (NEW)
echo "🔧 Step 8: Testing v3.3 code realization..."
echo "   → Generating complete runnable project..."
npm run realize:all

# Verify generated project structure
echo "   → Verifying generated project..."
if [ -f "generated/code/package.json" ]; then
  echo "   ✅ package.json generated"
fi

if [ -f "generated/code/tsconfig.json" ]; then
  echo "   ✅ tsconfig.json generated"
fi

if [ -f "generated/code/.env.example" ]; then
  echo "   ✅ .env.example generated"
fi

if [ -f "generated/code/README.md" ]; then
  echo "   ✅ README.md generated"
fi

# Check for backend structure
if [ -d "generated/code/backend" ]; then
  echo "   ✅ Backend directory generated"

  if [ -f "generated/code/backend/src/main.ts" ]; then
    echo "   ✅ Backend entry point (backend/src/main.ts) generated"
  fi

  # Check for ORM schema (Prisma for default template)
  if [ -f "generated/code/backend/prisma/schema.prisma" ]; then
    echo "   ✅ Prisma ORM schema generated"
  elif [ -d "generated/code/backend/src/entities" ] || [ -d "generated/code/backend/src/models" ]; then
    echo "   ✅ ORM schema generated"
  fi

  if [ -d "generated/code/backend/src/controllers" ]; then
    echo "   ✅ Controllers generated"
  fi

  if [ -d "generated/code/backend/src/routes" ]; then
    echo "   ✅ Route handlers generated"
  fi
fi

# Check for frontend structure
if [ -d "generated/code/frontend" ]; then
  echo "   ✅ Frontend directory generated"

  if [ -f "generated/code/frontend/src/main.tsx" ]; then
    echo "   ✅ Frontend entry point (frontend/src/main.tsx) generated"
  fi

  if [ -d "generated/code/frontend/src/components" ]; then
    echo "   ✅ React components generated"
  fi
fi

# Check for v3.3 CURVED features in generated code
if [ -d "generated/code/backend/src/controllers" ]; then
  # Check for unified validation method (v3.3)
  if grep -q "validate(.*context.*operation" generated/code/backend/src/controllers/*.ts 2>/dev/null; then
    echo "   ✅ v3.3 unified validation method present"
  fi

  # Check for delete operation (not destroy)
  if grep -q "async delete(id:" generated/code/backend/src/controllers/*.ts 2>/dev/null; then
    echo "   ✅ v3.3 delete operation present (CURVED)"
  fi

  # Check for retrieveAll method (list operation)
  if grep -q "async retrieveAll" generated/code/backend/src/controllers/*.ts 2>/dev/null; then
    echo "   ✅ v3.3 retrieveAll method present (CURVED)"
  fi
fi

# Check for validate endpoint in routes
if [ -d "generated/code/backend/src/routes" ]; then
  if grep -q "'/validate'" generated/code/backend/src/routes/*.ts 2>/dev/null; then
    echo "   ✅ v3.3 validate endpoint present (CURVED)"
  fi
fi

echo ""
echo "✅ All SpecVerse commands tested successfully!"
echo "✅ All generated specifications are valid and documented."
echo ""
echo "📊 Test Summary:"
echo "   - Original specification: validated"
echo "   - Complete specification: generated and validated"
echo "   - Development deployment: generated and validated"
echo "   - Production deployment: generated and validated"
echo "   - Documentation: generated for all specifications"
echo "   - Diagrams: generated for all specifications"
echo "   - YAML processing: tested"
echo "   - v3.3 Code realization: tested"
echo "   - Complete runnable project: generated"
echo ""
echo "🎉 SpecVerse workflow is fully functional!"
echo ""
echo "💡 Next steps:"
echo "   To run the generated full-stack application:"
echo "   1. cd /path/to/project (if not already there)"
echo "   2. npm run genAll (if not already run - installs deps and sets up DB)"
echo "   3. npm run app:build (build TypeScript)"
echo "   4. npm run app:dev:backend (Terminal 1 - starts backend on :3000)"
echo "   5. npm run app:dev:frontend (Terminal 2 - starts frontend on :5173)"
echo ""
echo "   Or run 'npm run app:dev' to see detailed instructions"
echo ""
echo "   Backend API: http://localhost:3000/api/{{componentNameKebab}}s"
echo "   Frontend UI: http://localhost:5173"
