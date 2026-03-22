/**
 * StyleManager - Theme management for diagram generation
 *
 * Provides predefined themes and custom theme loading
 */

import { ThemeConfig, ColorPalette, ShapeConfig, LayoutConfig } from '../types/index.js';

/**
 * Default color palette
 */
const DEFAULT_COLORS: ColorPalette = {
  model: '#e1f5fe',
  profile: '#e8f5e9',
  controller: '#f3e5f5',
  service: '#e8f5e9',
  event: '#fff3e0',
  view: '#fce4ec',
  domainEvent: '#fff3e0',
  appEvent: '#ffe0b2',
  lifecycle: '#f3e5f5',
  deployment: '#e8f5e9',
  manifest: '#fff3e0',
  component: '#E8F5E9',
  implementation: '#E3F2FD',
  technology: '#FFF9C4',
  capability: '#FFF3E0'
};

/**
 * Dark mode color palette
 */
const DARK_MODE_COLORS: ColorPalette = {
  model: '#1e3a5f',
  profile: '#2d4a2c',
  controller: '#4a2d4a',
  service: '#2d4a2c',
  event: '#5f4a2d',
  view: '#5f2d4a',
  domainEvent: '#5f4a2d',
  appEvent: '#6b5340',
  lifecycle: '#4a2d4a',
  deployment: '#2d4a2c',
  manifest: '#5f4a2d',
  component: '#2d4a2c',
  implementation: '#1e3a5f',
  technology: '#5f4a2d',
  capability: '#5f4a2d'
};

/**
 * Colorblind-safe palette (using patterns + high contrast)
 */
const COLORBLIND_SAFE_COLORS: ColorPalette = {
  model: '#0072B2',      // Blue
  profile: '#009E73',    // Bluish green
  controller: '#D55E00', // Vermillion
  service: '#009E73',    // Bluish green
  event: '#F0E442',      // Yellow
  view: '#CC79A7',       // Reddish purple
  domainEvent: '#F0E442', // Yellow
  appEvent: '#E69F00',   // Orange
  lifecycle: '#CC79A7',  // Reddish purple
  deployment: '#009E73', // Bluish green
  manifest: '#F0E442',    // Yellow
  component: '#009E73',  // Bluish green
  implementation: '#0072B2', // Blue
  technology: '#F0E442', // Yellow
  capability: '#F0E442'  // Yellow
};

/**
 * Presentation theme (high contrast, bold colors)
 */
const PRESENTATION_COLORS: ColorPalette = {
  model: '#bbdefb',
  profile: '#c8e6c9',
  controller: '#e1bee7',
  service: '#c8e6c9',
  event: '#ffecb3',
  view: '#f8bbd0',
  domainEvent: '#ffecb3',
  appEvent: '#ffe0b2',
  lifecycle: '#e1bee7',
  deployment: '#c8e6c9',
  manifest: '#ffecb3',
  component: '#c8e6c9',
  implementation: '#bbdefb',
  technology: '#ffecb3',
  capability: '#ffecb3'
};

/**
 * Default shape configuration
 */
const DEFAULT_SHAPES: ShapeConfig = {
  model: 'rectangle',
  controller: 'rounded',
  service: 'rounded',
  event: 'hexagon',
  view: 'rounded'
};

/**
 * Default layout configuration
 */
const DEFAULT_LAYOUT: LayoutConfig = {
  rankDir: 'TB',
  nodeSpacing: 50,
  rankSpacing: 100,
  edgeSpacing: 10
};

/**
 * Predefined themes
 */
export const THEMES: Record<string, ThemeConfig> = {
  default: {
    name: 'default',
    description: 'Default light theme with soft colors',
    colors: DEFAULT_COLORS,
    shapes: DEFAULT_SHAPES,
    layout: DEFAULT_LAYOUT
  },

  'dark-mode': {
    name: 'dark-mode',
    description: 'Dark mode theme for low-light environments',
    colors: DARK_MODE_COLORS,
    shapes: DEFAULT_SHAPES,
    layout: DEFAULT_LAYOUT
  },

  'colorblind-safe': {
    name: 'colorblind-safe',
    description: 'Colorblind-safe palette using distinct hues and patterns',
    colors: COLORBLIND_SAFE_COLORS,
    shapes: DEFAULT_SHAPES,
    layout: DEFAULT_LAYOUT
  },

  presentation: {
    name: 'presentation',
    description: 'High-contrast theme optimized for presentations',
    colors: PRESENTATION_COLORS,
    shapes: DEFAULT_SHAPES,
    layout: DEFAULT_LAYOUT
  }
};

/**
 * StyleManager - Manages themes and styling for diagrams
 */
export class StyleManager {
  private themes: Map<string, ThemeConfig>;

  constructor() {
    this.themes = new Map();

    // Load predefined themes
    for (const [name, theme] of Object.entries(THEMES)) {
      this.themes.set(name, theme);
    }
  }

  /**
   * Load a theme by name
   */
  loadTheme(name: string): ThemeConfig {
    const theme = this.themes.get(name);
    if (!theme) {
      console.warn(`Theme '${name}' not found, using default theme`);
      return this.themes.get('default')!;
    }
    return theme;
  }

  /**
   * Register a custom theme
   */
  registerTheme(theme: ThemeConfig): void {
    this.themes.set(theme.name, theme);
  }

  /**
   * Get all available theme names
   */
  getAvailableThemes(): string[] {
    return Array.from(this.themes.keys());
  }

  /**
   * Get theme by name or return default
   */
  getTheme(nameOrTheme?: string | ThemeConfig): ThemeConfig {
    // If already a theme object, return it
    if (typeof nameOrTheme === 'object') {
      return nameOrTheme;
    }

    // If string, load by name
    if (typeof nameOrTheme === 'string') {
      return this.loadTheme(nameOrTheme);
    }

    // Default theme
    return this.themes.get('default')!;
  }

  /**
   * Merge custom theme with base theme
   */
  mergeTheme(baseName: string, overrides: Partial<ThemeConfig>): ThemeConfig {
    const base = this.loadTheme(baseName);
    return {
      ...base,
      ...overrides,
      colors: { ...base.colors, ...overrides.colors },
      shapes: { ...base.shapes, ...overrides.shapes },
      layout: { ...base.layout, ...overrides.layout }
    };
  }

  /**
   * Create a custom theme from scratch
   */
  createTheme(
    name: string,
    colors: Partial<ColorPalette>,
    shapes?: Partial<ShapeConfig>,
    layout?: Partial<LayoutConfig>
  ): ThemeConfig {
    return {
      name,
      colors: { ...DEFAULT_COLORS, ...colors },
      shapes: { ...DEFAULT_SHAPES, ...shapes },
      layout: { ...DEFAULT_LAYOUT, ...layout }
    };
  }

  /**
   * Get color for a specific element type
   */
  getColor(theme: ThemeConfig, type: keyof ColorPalette): string {
    return theme.colors[type];
  }

  /**
   * Get shape for a specific element type
   */
  getShape(theme: ThemeConfig, type: keyof ShapeConfig): string {
    return theme.shapes[type];
  }
}

// Export default instance
export const styleManager = new StyleManager();
