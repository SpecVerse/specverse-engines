/**
 * SpecVerse Engine Interfaces
 *
 * Standard interfaces for discoverable, composable engines.
 * Each engine registers with the EngineRegistry and is discovered at runtime.
 */

export interface EngineInfo {
  name: string;
  version: string;
  capabilities: string[];
  config?: Record<string, any>;
}

/**
 * Base interface for all SpecVerse engines.
 * Engines are independent packages that can be discovered and loaded at runtime.
 */
export interface SpecVerseEngine {
  /** Engine identifier (e.g., "parser", "inference", "realize") */
  name: string;

  /** Semantic version */
  version: string;

  /** Capabilities this engine provides (e.g., ["parse", "validate", "import-resolution"]) */
  capabilities: string[];

  /** Initialize the engine (load rules, schemas, etc.) */
  initialize(config?: any): Promise<void>;

  /** Get engine metadata */
  getInfo(): EngineInfo;
}

/**
 * Parser engine — transforms .specly content into a SpecVerseAST.
 */
export interface ParserEngine extends SpecVerseEngine {
  /** Parse string content into AST */
  parseContent(content: string, filename?: string): ParseResult;

  /** Parse a file with import resolution */
  parseFileWithImports(filePath: string, options?: ParseOptions): Promise<ParseResult>;
}

/**
 * Inference engine — generates architecture from models.
 */
export interface InferenceEngine extends SpecVerseEngine {
  /** Load inference rules */
  loadRules(): Promise<ValidationResult>;

  /** Run inference on a parsed AST */
  infer(ast: any, options?: InferenceOptions): Promise<InferenceResult>;
}

/**
 * Realize engine — generates code from specifications.
 */
export interface RealizeEngine extends SpecVerseEngine {
  /** Resolve a capability to an instance factory */
  resolve(capability: string): any;

  /** Generate code from a resolved implementation */
  generate(resolved: any, template: string, context: any): Promise<GeneratedOutput>;
}

// Supporting types used by engine interfaces

export interface ParseResult {
  ast?: any;
  errors: string[];
  warnings?: string[];
}

export interface ParseOptions {
  enableImports?: boolean;
  basePath?: string;
  debug?: boolean;
}

export interface ValidationResult {
  valid: boolean;
  errors: Array<{ code: string; message: string; location?: string }>;
  warnings: Array<{ code: string; message: string; location?: string }>;
}

export interface InferenceOptions {
  generateControllers?: boolean;
  generateServices?: boolean;
  generateEvents?: boolean;
  generateViews?: boolean;
  generateDeployment?: boolean;
  targetEnvironment?: 'development' | 'staging' | 'production';
  verbose?: boolean;
}

export interface InferenceResult {
  component: any;
  deployments?: Record<string, any>;
  yaml: string;
  validation: ValidationResult;
  statistics: {
    modelsProcessed: number;
    controllersGenerated: number;
    servicesGenerated: number;
    eventsGenerated: number;
    viewsGenerated: number;
    rulesApplied: number;
    processingTimeMs: number;
  };
}

export interface GeneratedOutput {
  code: string;
  filePath: string;
  templateName: string;
  instanceFactory: string;
}
