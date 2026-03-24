/**
 * SpecVerse AI Support MCP Server - Clean Implementation
 * Main exports for the clean implementation
 */

// Core exports
export { SpecVerseCleanMCPServer } from './server/mcp-server.js';
export { MCPServerController } from './controllers/MCPServerController.js';

// Service exports
export { ResourcesProviderService } from './services/ResourcesProviderService.js';
export { LibraryToolsService } from './services/LibraryToolsService.js';
export { PromptToolsService } from './services/PromptToolsService.js';

// Model exports
export { SpecVerseResourceModel } from './models/SpecVerseResource.js';
export { LibrarySuggestionModel } from './models/LibrarySuggestion.js';

// Event system exports
export { EventEmitter } from './events/EventEmitter.js';
export type { EventType, EventData, EventHandler } from './events/EventEmitter.js';

// Type exports
export type * from './types/index.js';