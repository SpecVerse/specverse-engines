import { describe, it, expect, beforeEach } from 'vitest';
import { SpecialistViewExpander } from '../specialist-view-expander.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { ExpansionTemplateRuleFile } from '../../../core/rule-file-types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('SpecialistViewExpander', () => {
  let expander: SpecialistViewExpander;
  let rules: ExpansionTemplateRuleFile;

  beforeEach(() => {
    expander = new SpecialistViewExpander();

    // Load the domain-specific v3.4 specialist view rules
    const rulesPath = join(__dirname, '../../../../entities/core/views/inference/v3.4-specialist-views.json');
    const rulesContent = readFileSync(rulesPath, 'utf8');
    rules = JSON.parse(rulesContent) as ExpansionTemplateRuleFile;

    expander.loadRulesFromDomainSpecific(rules);
  });

  it('should load specialist view rules', () => {
    expect(expander.isLoaded()).toBe(true);
    expect(expander.getVersion()).toBe('v3.4.0');
  });

  it('should identify available specialist view types', () => {
    const types = expander.getAvailableTypes();
    expect(types).toContain('dashboard');
    expect(types).toContain('analytics');
    expect(types).toContain('board');
  });

  it('should identify specialist views', () => {
    expect(expander.isSpecialistView('dashboard')).toBe(true);
    expect(expander.isSpecialistView('analytics')).toBe(true);
    expect(expander.isSpecialistView('list')).toBe(false);
  });

  it('should expand dashboard view with metrics', () => {
    const viewDef = {
      type: 'dashboard',
      model: 'Task',
      metrics: ['total', 'completed', 'overdue']
    };

    const components = expander.expandSpecialistView(viewDef);

    // Should create metric cards
    expect(components.totalCard).toBeDefined();
    expect(components.totalCard.type).toBe('card');
    expect(components.totalCard.properties.metric).toBe('total');

    expect(components.completedCard).toBeDefined();
    expect(components.completedCard.type).toBe('card');

    expect(components.overdueCard).toBeDefined();
    expect(components.overdueCard.type).toBe('card');

    // Should create summary table
    expect(components.summaryTable).toBeDefined();
    expect(components.summaryTable.type).toBe('table');
  });

  it('should expand analytics view', () => {
    const viewDef = {
      type: 'analytics',
      model: 'Task',
      charts: ['trend', 'distribution']
    };

    const components = expander.expandSpecialistView(viewDef);

    // Should create filter panel
    expect(components.filterPanel).toBeDefined();
    expect(components.filterPanel.type).toBe('filterPanel');

    // Should create charts
    expect(components.trendChart).toBeDefined();
    expect(components.trendChart.type).toBe('chart');

    expect(components.distributionChart).toBeDefined();
    expect(components.distributionChart.type).toBe('chart');

    // Should create data table
    expect(components.dataTable).toBeDefined();
    expect(components.dataTable.type).toBe('table');
  });

  it('should expand board view with columns', () => {
    const viewDef = {
      type: 'board',
      model: 'Task',
      columns: ['todo', 'inProgress', 'done']
    };

    const components = expander.expandSpecialistView(viewDef);

    // Should create board container
    expect(components.boardContainer).toBeDefined();
    expect(components.boardContainer.type).toBe('container');

    // Should create columns
    expect(components.todoColumn).toBeDefined();
    expect(components.todoColumn.type).toBe('container');

    expect(components.inProgressColumn).toBeDefined();
    expect(components.doneColumn).toBeDefined();

    // Should create task cards
    expect(components.taskCard).toBeDefined();
    expect(components.taskCard.type).toBe('card');
    expect(components.taskCard.properties.draggable).toBe(true);
  });

  it('should use v3.4 atomic component types', () => {
    const viewDef = {
      type: 'dashboard',
      model: 'Task',
      metrics: ['total']
    };

    const components = expander.expandSpecialistView(viewDef);

    // All components should use v3.4 atomic types
    const componentTypes = Object.values(components).map((c: any) => c.type);

    // Should only contain v3.4 atomic types
    const atomicTypes = ['card', 'chart', 'table', 'container', 'filterPanel'];
    for (const type of componentTypes) {
      expect(atomicTypes).toContain(type);
    }

    // Should NOT contain old composite types
    expect(componentTypes).not.toContain('DashboardCard');
    expect(componentTypes).not.toContain('MetricCard');
    expect(componentTypes).not.toContain('SummaryTable');
  });
});
