# Custom Technology Providers (v3.4.0)

This example demonstrates SpecVerse v3.4.0's extensible provider system, which allows you to use any technology provider without waiting for schema updates.

## What Changed in v3.4.0

**Before v3.4.0:**
- Providers were limited to predefined enums
- New technologies required schema updates
- Innovation was blocked by schema constraints

**After v3.4.0:**
- Any provider can be used (kebab-case format)
- Custom values work immediately
- Standard providers still validated by linter

## Key Features

### 1. Custom Infrastructure Providers

```yaml
infrastructure:
  cdn:
    provider: "bunny-cdn"  # Custom CDN (not in old enum)
    advertises: ["cdn.static", "cdn.video"]
```

**Bunny CDN** wasn't in the v3.3 enum, but now works immediately!

### 2. Custom Edge Platforms

```yaml
edgeCompute:
  provider: "fly-io"  # Modern edge platform
  advertises: ["compute.edge"]
  config:
    regions: ["ams", "syd", "sjc"]
```

**Fly.io** is a modern edge platform that couldn't be used before.

### 3. Custom Monitoring Solutions

```yaml
monitoring:
  observability:
    provider: "honeycomb"  # Modern observability
    advertises: ["monitoring.traces", "monitoring.metrics"]
```

**Honeycomb** provides modern observability that wasn't in the old enum.

### 4. Custom Security Providers

```yaml
security:
  authentication:
    provider: "clerk"  # Modern auth provider
    advertises: ["security.authentication"]
```

**Clerk** is a modern authentication provider that can now be used.

### 5. Custom Runtimes and Languages

```yaml
technology:
  runtime: "zig"      # Custom runtime
  language: "zig"     # Custom language
  framework: "zap"
```

**Zig** is an emerging language that can be used without schema updates.

## Pattern Validation

All custom providers must follow kebab-case pattern:

```
^[a-z][a-z0-9-]+$
```

**Valid Examples:**
- `bunny-cdn` ✅
- `fly-io` ✅
- `clerk` ✅
- `auth0` ✅
- `zig` ✅

**Invalid Examples:**
- `BunnyCDN` ❌ (PascalCase)
- `Fly.io` ❌ (contains dot)
- `1fly` ❌ (starts with number)

## Linter Integration (v3.4.1+)

When the registry linter is available:

```bash
specverse lint --check-registry 06-08-custom-providers.specly

🔍 Validating specification...
✓ Schema validation passed
🌐 Checking against registry...

ℹ Info: CUSTOM_PROVIDER
  deployments.production.instances.infrastructure.cdn.provider
  Using custom provider: "bunny-cdn"
  → This is valid but not in the standard registry

✅ Validation complete
```

The linter will:
- ✅ Validate pattern (kebab-case)
- ✅ Check for typos in standard providers
- ✅ Warn about deprecations
- ✅ Allow custom providers

## Standard Providers Still Work

You can mix standard and custom providers:

```yaml
infrastructure:
  cdn:
    provider: "bunny-cdn"      # Custom
  loadBalancer:
    provider: "cloudflare"     # Standard

monitoring:
  observability:
    provider: "honeycomb"      # Custom
  logging:
    provider: "datadog"        # Standard
```

## Benefits

1. **No Waiting**: Use new technologies immediately
2. **No Schema Updates**: Community doesn't need PRs for every provider
3. **Innovation Friendly**: Experiment with cutting-edge tools
4. **Backwards Compatible**: All existing specs still work
5. **Quality Through Tooling**: Linter catches typos without schema constraints

## See Also

- [Basic Deployment](06-01-basic-deployment-intro.md)
- [Enhanced Deployment](06-02-enhanced-deployment-example.md)
