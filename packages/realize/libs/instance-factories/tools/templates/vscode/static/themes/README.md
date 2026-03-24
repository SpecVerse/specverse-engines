# SpecVerse VS Code Color Themes

This directory contains VS Code color theme configurations for enhanced SpecVerse syntax highlighting.

## Available Themes

### Basic Theme (`specverse-theme-colors.json`)
A minimal color theme with essential highlighting for SpecVerse constructs:
- Keywords (component, models, etc.)
- Types (String, UUID, etc.)
- Modifiers (required, unique, etc.)
- Relationships (hasMany, belongsTo, etc.)

### Complete Theme (`complete-specverse-colors.json`)
A comprehensive color theme with detailed highlighting for all SpecVerse features:
- Section keywords (component, deployment, etc.)
- CURED operations (create, update, retrieve, etc.)
- Lifecycle flows and states
- Attribute and relationship modifiers
- Executable properties
- Comments and strings

## Installation

### Option 1: Manual VS Code Settings
1. Open VS Code Settings (Cmd/Ctrl + ,)
2. Search for "token color customizations"
3. Edit `settings.json` and add the content from either theme file

### Option 2: Copy to Settings
```bash
# For basic theme
cat themes/specverse-theme-colors.json >> ~/.vscode/settings.json

# For complete theme
cat themes/complete-specverse-colors.json >> ~/.vscode/settings.json
```

### Option 3: Built-in Extension Themes
The SpecVerse extension now includes built-in color themes:

1. Install the SpecVerse extension
2. Open Command Palette (Cmd/Ctrl + Shift + P)
3. Type "Preferences: Color Theme"
4. Select either:
   - **SpecVerse Basic** - Essential highlighting
   - **SpecVerse Complete** - Comprehensive highlighting

## Theme Comparison

| Feature | Basic Theme | Complete Theme |
|---------|-------------|----------------|
| Keywords | ✅ | ✅ |
| Types | ✅ | ✅ |
| Modifiers | ✅ | ✅ |
| CURED Operations | ❌ | ✅ |
| Lifecycle Flows | ❌ | ✅ |
| Executable Properties | ❌ | ✅ |
| Advanced Syntax | ❌ | ✅ |

## Customization

You can customize colors by modifying the `foreground` values in the theme files:
- Use hex colors: `#569CD6`
- Adjust `fontStyle`: `"bold"`, `"italic"`, `"bold italic"`
- Modify scopes to target specific syntax elements

## Contributing

To improve the themes:
1. Test with various `.specly` files
2. Identify missing or incorrect highlighting
3. Update the appropriate theme file
4. Test the changes in VS Code