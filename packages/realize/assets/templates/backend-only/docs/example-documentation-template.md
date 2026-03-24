# Example Template for SpecVerse Example Documentation

This template provides a consistent structure for documenting SpecVerse examples. Use this when adding new examples to maintain consistency across the documentation.

## Common Structure Pattern

Based on analysis of existing examples, here's the standard structure:

### Basic Structure (for fundamental examples)
```markdown
# Example XX-YY: [Descriptive Title]

This example demonstrates [brief description of what the example shows] in SpecVerse.

## Learning Objectives

- [First learning objective]
- [Second learning objective]
- [Third learning objective]
- [Fourth learning objective]

## Key Concepts

### [First Concept Name]
[Description of the concept with code example]
```specly
[code example]
```

### [Second Concept Name]
[Description with code example]

## Visual Diagram

import Mermaid from '@site/src/components/Mermaid';

{/* Auto-generated diagram from canonical examples */}

{/* Generated: [TIMESTAMP] */}

<div className="diagram-generated">

<Mermaid chart={`
[mermaid diagram content]
`} />

</div>

## Complete Example

### Primary: Specly DSL Format (.specly)
```specly
[complete example code]
```

See the full file: [XX-YY-example-name.specly](./XX-YY-example-name.specly)

### Generated: YAML Format
The YAML format is automatically generated from the Specly DSL using:
```bash
specverse gen yaml XX-YY-example-name.specly -o XX-YY-example-name.yaml
```

## Key Features Demonstrated

- [Feature 1]
- [Feature 2]
- [Feature 3]

## Validation

Test this example:
```bash
# Validate the Specly source file
specverse validate examples/[category]/XX-YY-example-name.specly

# Run full test cycle
specverse test cycle examples/[category]/XX-YY-example-name.specly
```

## Next Steps

Continue to [Example XX-YY: Next Example](./XX-YY-next-example) to learn about [next topic].

## Related Examples

- [Example AA-BB: Related Example](../category/AA-BB-related-example) - [Brief description]
- [Example CC-DD: Another Related](../category/CC-DD-another-related) - [Brief description]
```

### Advanced Structure (for architecture/domain examples)
```markdown
# Example XX-YY: [Descriptive Title]

This [comprehensive/advanced] example demonstrates [complex scenario description] in SpecVerse, showcasing [list of major features].

## Learning Objectives

- [Learning objective focused on real-world application]
- [Learning objective about integration]
- [Learning objective about advanced patterns]
- [Learning objective about scalability]

## Business Domain / Use Case

[Description of the business domain or real-world scenario this example addresses]

## Key Features

### [Feature Category 1]
```specly
[code example showing this feature]
```

### [Feature Category 2] 
```specly
[code example]
```

## Visual Diagram

[Same diagram structure as basic]

## Architecture Patterns

### [Pattern Name 1]
- [Description of the pattern]
- [When to use it]
- [Benefits]

### [Pattern Name 2]
- [Description]
- [Implementation details]

## Complete Example

### Primary: Specly DSL Format
```specly
[full example]
```

## Key Features Demonstrated

### V3.1 Core Features
- [Core feature 1]
- [Core feature 2]

### Advanced Patterns
- [Advanced pattern 1]
- [Advanced pattern 2]

## Business Use Cases

- [Use case 1]
- [Use case 2]

## Validation

[Same validation structure]

## Next Steps / Related Examples

[Same structure]
```

### Special Structure (for feature demonstration like steps)
```markdown
# Example XX-YY: [Feature Name]

**Example**: `XX-YY-feature-name.specly`  
**Category**: [Category]  
**Demonstrates**: [Brief description of the specific feature being demonstrated]

## Overview

[Detailed description of what the feature does and why it's useful]

## Key Features

### [Feature Name] Support
- **Context 1**: [How it works in first context]
- **Context 2**: [How it works in second context]  
- **Context 3**: [How it works in third context]

### Format and Usage
```yaml
[example showing the feature syntax]
```

## Implementation Details

### [Context 1] with [Feature]
[Description of how the feature is used in this context]

### [Context 2] with [Feature]
[Description of usage in second context]

## Benefits

### [Benefit Category 1]
- [Specific benefit 1]
- [Specific benefit 2]

### [Benefit Category 2]
- [Specific benefit 3]
- [Specific benefit 4]

## Schema Validation

[Description of how the feature is validated]

```json
[schema snippet if relevant]
```

## Backward Compatibility

[Description of compatibility considerations]

## Usage Guidelines

### When to Use [Feature]
- [Scenario 1]
- [Scenario 2]

### Best Practices
- [Practice 1]
- [Practice 2]

[Rest follows standard structure]
```

## Template Usage Instructions

1. **Choose the appropriate structure** based on your example type:
   - **Basic**: For fundamental concepts (01-fundamentals)
   - **Advanced**: For architecture/domain examples (03-architecture, 04-domains)
   - **Special**: For specific feature demonstrations

2. **Replace placeholder content**:
   - `XX-YY`: Replace with actual example number
   - `[Descriptive Title]`: Replace with clear, descriptive title
   - `[Category]`: Replace with category name (Fundamentals, Architecture, etc.)
   - All bracketed placeholders with actual content

3. **Maintain consistency**:
   - Use the same section headings across similar examples
   - Keep code examples properly formatted with ```specly blocks
   - Include validation commands for all examples
   - Always link to related examples

4. **Key sections that should always be present**:
   - Learning Objectives (3-5 bullet points)
   - Key Concepts (with code examples)
   - Complete Example (full .specly code)
   - Validation (with bash commands)
   - Next Steps / Related Examples

5. **Visual diagrams**: 
   - Include the standard Mermaid import and structure
   - The diagram content is auto-generated, so use placeholder text
   - Always include the "Generated: [TIMESTAMP]" comment

6. **File naming**:
   - MD file should match .specly file name exactly
   - Use descriptive, hyphenated names
   - Follow category numbering convention

This template ensures consistency across all SpecVerse examples while allowing flexibility for different types of content.