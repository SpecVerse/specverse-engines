/**
 * UnifiedDiagramGenerator - Core diagram generation engine
 *
 * Orchestrates diagram generation using plugins and provides unified API
 */

import { SpecVerseAST } from '@specverse/types';
import {
  DiagramType,
  DiagramOptions,
  DiagramGeneratorConfig,
  DiagramPlugin,
  ThemeConfig,
  ValidationResult
} from '../types/index.js';
import { DiagramContext } from './DiagramContext.js';
import { StyleManager, styleManager } from './StyleManager.js';
import { MermaidRenderer } from '../renderers/MermaidRenderer.js';

/**
 * UnifiedDiagramGenerator - Main entry point for diagram generation
 */
export class UnifiedDiagramGenerator {
  private plugins: Map<DiagramType, DiagramPlugin>;
  private styleManager: StyleManager;
  private renderer: MermaidRenderer;
  private defaultTheme: ThemeConfig;

  constructor(config: DiagramGeneratorConfig = { plugins: [] }) {
    this.plugins = new Map();
    this.styleManager = styleManager;
    this.renderer = new MermaidRenderer();

    // Register provided plugins
    for (const plugin of config.plugins) {
      this.registerPlugin(plugin);
    }

    // Set default theme
    this.defaultTheme = typeof config.theme === 'string'
      ? this.styleManager.getTheme(config.theme)
      : config.theme || this.styleManager.getTheme('default');
  }

  /**
   * Register a diagram plugin
   */
  registerPlugin(plugin: DiagramPlugin): void {
    for (const type of plugin.supportedTypes) {
      if (this.plugins.has(type)) {
        console.warn(`Plugin for diagram type '${type}' already registered, overwriting`);
      }
      this.plugins.set(type, plugin);
    }
  }

  /**
   * Unregister a plugin for a specific diagram type
   */
  unregisterPlugin(type: DiagramType): boolean {
    return this.plugins.delete(type);
  }

  /**
   * Get all available diagram types
   */
  getAvailableTypes(): DiagramType[] {
    return Array.from(this.plugins.keys());
  }

  /**
   * Check if a diagram type is supported
   */
  isTypeSupported(type: DiagramType): boolean {
    return this.plugins.has(type);
  }

  /**
   * Get plugin for a specific diagram type
   */
  getPlugin(type: DiagramType): DiagramPlugin | undefined {
    return this.plugins.get(type);
  }

  /**
   * Validate AST before diagram generation
   */
  validate(ast: SpecVerseAST, type: DiagramType): ValidationResult {
    const plugin = this.plugins.get(type);
    if (!plugin) {
      return {
        valid: false,
        errors: [`No plugin registered for diagram type: ${type}`],
        warnings: []
      };
    }

    return plugin.validate(ast);
  }

  /**
   * Generate a single diagram
   */
  generate(
    ast: SpecVerseAST,
    type: DiagramType,
    options: DiagramOptions = {}
  ): string {
    // Get plugin for this diagram type
    const plugin = this.plugins.get(type);
    if (!plugin) {
      throw new Error(`No plugin registered for diagram type: ${type}`);
    }

    // Validate AST
    const validation = plugin.validate(ast);
    if (!validation.valid) {
      throw new Error(`AST validation failed: ${validation.errors.join(', ')}`);
    }

    // Merge options with plugin defaults
    const mergedOptions: DiagramOptions = {
      ...plugin.getDefaultOptions(),
      ...options
    };

    // Get theme
    const theme = options.theme
      ? this.styleManager.getTheme(options.theme)
      : this.defaultTheme;

    // Create diagram context
    const context = new DiagramContext(ast, mergedOptions, theme);

    // Generate diagram using plugin
    const diagram = plugin.generate(context, type);

    // Render to Mermaid string
    return this.renderer.render(diagram, context);
  }

  /**
   * Generate all diagram types
   */
  generateAll(
    ast: SpecVerseAST,
    options: DiagramOptions = {}
  ): Map<DiagramType, string> {
    const diagrams = new Map<DiagramType, string>();

    for (const type of this.getAvailableTypes()) {
      try {
        const diagram = this.generate(ast, type, options);
        diagrams.set(type, diagram);
      } catch (error) {
        // Skip diagrams that aren't applicable (e.g., deployment diagrams without deployments)
        // Only log in verbose mode
        if (options.verbose) {
          console.warn(`Skipped ${type} diagram:`, (error as Error).message);
        }
      }
    }

    return diagrams;
  }

  /**
   * Generate diagrams for a specific plugin
   */
  generateForPlugin(
    ast: SpecVerseAST,
    pluginName: string,
    options: DiagramOptions = {}
  ): Map<DiagramType, string> {
    const diagrams = new Map<DiagramType, string>();

    for (const [type, plugin] of this.plugins.entries()) {
      if (plugin.name === pluginName) {
        try {
          const diagram = this.generate(ast, type, options);
          diagrams.set(type, diagram);
        } catch (error) {
          console.warn(`Failed to generate ${type} diagram:`, error);
        }
      }
    }

    return diagrams;
  }

  /**
   * Get diagram metadata (for documentation)
   */
  getMetadata(): Array<{ type: DiagramType; plugin: string; description: string }> {
    const metadata: Array<{ type: DiagramType; plugin: string; description: string }> = [];

    for (const [type, plugin] of this.plugins.entries()) {
      metadata.push({
        type,
        plugin: plugin.name,
        description: plugin.description
      });
    }

    return metadata;
  }

  /**
   * Get options documentation for a diagram type
   */
  getOptionsForType(type: DiagramType): Partial<DiagramOptions> | undefined {
    const plugin = this.plugins.get(type);
    return plugin?.getDefaultOptions();
  }

  /**
   * Get all available themes
   */
  getAvailableThemes(): string[] {
    return this.styleManager.getAvailableThemes();
  }

  /**
   * Register a custom theme
   */
  registerTheme(theme: ThemeConfig): void {
    this.styleManager.registerTheme(theme);
  }

  /**
   * Set default theme for all diagrams
   */
  setDefaultTheme(theme: string | ThemeConfig): void {
    this.defaultTheme = typeof theme === 'string'
      ? this.styleManager.getTheme(theme)
      : theme;
  }

  /**
   * Generate diagram with custom context (advanced usage)
   */
  generateWithContext(
    context: DiagramContext,
    type: DiagramType
  ): string {
    const plugin = this.plugins.get(type);
    if (!plugin) {
      throw new Error(`No plugin registered for diagram type: ${type}`);
    }

    const diagram = plugin.generate(context, type);
    return this.renderer.render(diagram, context);
  }
}
