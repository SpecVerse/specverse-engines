import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('v3.4.0 View Component Types - Schema Validation', () => {

  it('should have exactly 49 atomic component types in schema', () => {
    const schemaPath = join(__dirname, '../../../schema/SPECVERSE-SCHEMA.json');
    const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));

    const componentTypes = schema.$defs.ViewComponent.properties.type.anyOf[0].enum;

    expect(componentTypes).toBeDefined();
    expect(componentTypes.length).toBe(49);
  });

  it('should include all Data Display components (9)', () => {
    const schemaPath = join(__dirname, '../../../schema/SPECVERSE-SCHEMA.json');
    const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));
    const componentTypes = schema.$defs.ViewComponent.properties.type.anyOf[0].enum;

    const dataDisplay = ['table', 'list', 'grid', 'card', 'chart', 'tree', 'timeline', 'avatar', 'image'];

    dataDisplay.forEach(component => {
      expect(componentTypes).toContain(component);
    });
  });

  it('should include all Forms & Inputs components (11)', () => {
    const schemaPath = join(__dirname, '../../../schema/SPECVERSE-SCHEMA.json');
    const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));
    const componentTypes = schema.$defs.ViewComponent.properties.type.anyOf[0].enum;

    const formsInputs = ['form', 'input', 'textarea', 'select', 'checkbox', 'radio', 'slider', 'switch', 'autocomplete', 'datepicker', 'timepicker'];

    formsInputs.forEach(component => {
      expect(componentTypes).toContain(component);
    });
  });

  it('should include all Actions components (5)', () => {
    const schemaPath = join(__dirname, '../../../schema/SPECVERSE-SCHEMA.json');
    const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));
    const componentTypes = schema.$defs.ViewComponent.properties.type.anyOf[0].enum;

    const actions = ['button', 'button-group', 'link', 'icon', 'menu'];

    actions.forEach(component => {
      expect(componentTypes).toContain(component);
    });
  });

  it('should include all Overlays & Feedback components (9)', () => {
    const schemaPath = join(__dirname, '../../../schema/SPECVERSE-SCHEMA.json');
    const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));
    const componentTypes = schema.$defs.ViewComponent.properties.type.anyOf[0].enum;

    const overlays = ['modal', 'dialog', 'drawer', 'popover', 'tooltip', 'alert', 'snackbar', 'badge', 'spinner'];

    overlays.forEach(component => {
      expect(componentTypes).toContain(component);
    });
  });

  it('should include all Navigation components (5)', () => {
    const schemaPath = join(__dirname, '../../../schema/SPECVERSE-SCHEMA.json');
    const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));
    const componentTypes = schema.$defs.ViewComponent.properties.type.anyOf[0].enum;

    const navigation = ['tabs', 'breadcrumb', 'navbar', 'sidebar', 'pagination'];

    navigation.forEach(component => {
      expect(componentTypes).toContain(component);
    });
  });

  it('should include all Layout components (6)', () => {
    const schemaPath = join(__dirname, '../../../schema/SPECVERSE-SCHEMA.json');
    const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));
    const componentTypes = schema.$defs.ViewComponent.properties.type.anyOf[0].enum;

    const layout = ['accordion', 'carousel', 'container', 'divider', 'header', 'footer'];

    layout.forEach(component => {
      expect(componentTypes).toContain(component);
    });
  });

  it('should include all Progress components (2)', () => {
    const schemaPath = join(__dirname, '../../../schema/SPECVERSE-SCHEMA.json');
    const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));
    const componentTypes = schema.$defs.ViewComponent.properties.type.anyOf[0].enum;

    const progress = ['progress-bar', 'progress-circle'];

    progress.forEach(component => {
      expect(componentTypes).toContain(component);
    });
  });

  it('should include all Specialized components (2)', () => {
    const schemaPath = join(__dirname, '../../../schema/SPECVERSE-SCHEMA.json');
    const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));
    const componentTypes = schema.$defs.ViewComponent.properties.type.anyOf[0].enum;

    const specialized = ['searchBar', 'filterPanel'];

    specialized.forEach(component => {
      expect(componentTypes).toContain(component);
    });
  });

  it('should NOT include removed component types', () => {
    const schemaPath = join(__dirname, '../../../schema/SPECVERSE-SCHEMA.json');
    const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));
    const componentTypes = schema.$defs.ViewComponent.properties.type.anyOf[0].enum;

    const removedTypes = [
      'data-grid', 'kanban', 'gantt', 'calendar',
      'dropdown', 'icon-button', 'fab',
      'chip', 'skeleton', 'stepper',
      'file-upload', 'color-picker', 'rating', 'otp-input'
    ];

    removedTypes.forEach(type => {
      expect(componentTypes).not.toContain(type);
    });
  });

  it('should verify total breakdown: 9+11+5+9+5+6+2+2 = 49', () => {
    const schemaPath = join(__dirname, '../../../schema/SPECVERSE-SCHEMA.json');
    const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));
    const componentTypes = schema.$defs.ViewComponent.properties.type.anyOf[0].enum;

    const categories = {
      dataDisplay: 9,
      formsInputs: 11,
      actions: 5,
      overlays: 9,
      navigation: 5,
      layout: 6,
      progress: 2,
      specialized: 2
    };

    const total = Object.values(categories).reduce((sum, count) => sum + count, 0);
    expect(total).toBe(49);
    expect(componentTypes.length).toBe(49);
  });
});
