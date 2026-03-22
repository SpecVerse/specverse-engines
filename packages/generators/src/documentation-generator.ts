/**
 * SpecVerse v3.0 Documentation Generator
 * 
 * Generates comprehensive documentation from SpecVerse AST
 * Supports Markdown, HTML, and API documentation formats
 */

import {
  SpecVerseAST,
  ModelSpec,
  ControllerSpec,
  ServiceSpec,
  ViewSpec,
  EventSpec,
  AttributeSpec,
  RelationshipSpec,
  ExecutablePropertiesSpec,
  LifecycleSpec
} from '@specverse/types';

export interface DocumentationOptions {
  format: 'markdown' | 'html' | 'openapi';
  includeTableOfContents?: boolean;
  includeExamples?: boolean;
  includeDiagrams?: boolean;
  baseUrl?: string;
}

export class DocumentationGenerator {
  
  /**
   * Generate documentation based on options
   */
  generate(ast: SpecVerseAST, options: DocumentationOptions = { format: 'markdown' }): string {
    switch (options.format) {
      case 'markdown':
        return this.generateMarkdown(ast, options);
      case 'html':
        return this.generateHTML(ast, options);
      case 'openapi':
        return this.generateOpenAPI(ast, options);
      default:
        return this.generateMarkdown(ast, options);
    }
  }

  /**
   * Generate Markdown documentation
   */
  private generateMarkdown(ast: SpecVerseAST, options: DocumentationOptions): string {
    const sections: string[] = [];
    
    // Collect all items from all components
    const allModels: ModelSpec[] = [];
    const allControllers: ControllerSpec[] = [];
    const allServices: ServiceSpec[] = [];
    const allViews: ViewSpec[] = [];
    const allEvents: EventSpec[] = [];
    
    for (const component of ast.components) {
      allModels.push(...component.models);
      allControllers.push(...component.controllers);
      allServices.push(...component.services);
      allViews.push(...component.views);
      allEvents.push(...component.events);
    }
    
    // Header
    sections.push(this.generateMarkdownHeader(ast));
    
    // Table of Contents
    if (options.includeTableOfContents !== false) {
      sections.push(this.generateMarkdownTOC(ast));
    }
    
    // Overview
    sections.push(this.generateMarkdownOverview(ast));
    
    // Models
    if (allModels.length > 0) {
      sections.push(this.generateMarkdownModels(allModels, options));
    }
    
    // Controllers
    if (allControllers.length > 0) {
      sections.push(this.generateMarkdownControllers(allControllers, options));
    }
    
    // Services
    if (allServices.length > 0) {
      sections.push(this.generateMarkdownServices(allServices));
    }
    
    // Views
    if (allViews.length > 0) {
      sections.push(this.generateMarkdownViews(allViews));
    }
    
    // Events
    if (allEvents.length > 0) {
      sections.push(this.generateMarkdownEvents(allEvents));
    }
    
    return sections.join('\n\n');
  }

  private generateMarkdownHeader(ast: SpecVerseAST): string {
    const primaryComponent = ast.components[0];
    const title = primaryComponent?.name || ast.deployments[0]?.name || 'SpecVerse Specification';
    const lines: string[] = [
      `# ${title}`,
      '',
      primaryComponent?.description || ast.deployments[0]?.description || 'Generated from SpecVerse specification.',
      ''
    ];
    
    if (primaryComponent?.version || ast.deployments[0]?.version) {
      lines.push(`**Version:** ${primaryComponent?.version || ast.deployments[0]?.version}  `);
    }
    
    const allTags: string[] = [];
    for (const component of ast.components) {
      if (component.tags) allTags.push(...component.tags);
    }
    if (allTags.length > 0) {
      lines.push(`**Tags:** ${allTags.map(t => `\`${t}\``).join(', ')}  `);
    }
    
    lines.push(`**Generated:** ${new Date().toISOString()}`);
    
    return lines.join('\n');
  }

  private generateMarkdownTOC(ast: SpecVerseAST): string {
    const lines: string[] = ['## Table of Contents', ''];
    
    lines.push('- [Overview](#overview)');
    
    // Collect all items for TOC
    const allModels: ModelSpec[] = [];
    const allControllers: ControllerSpec[] = [];
    let totalServices = 0;
    let totalViews = 0;
    let totalEvents = 0;
    
    for (const component of ast.components) {
      allModels.push(...component.models);
      allControllers.push(...component.controllers);
      totalServices += component.services.length;
      totalViews += component.views.length;
      totalEvents += component.events.length;
    }
    
    if (allModels.length > 0) {
      lines.push('- [Models](#models)');
      allModels.forEach(model => {
        lines.push(`  - [${model.name}](#${model.name.toLowerCase()})`);
      });
    }
    
    if (allControllers.length > 0) {
      lines.push('- [Controllers](#controllers)');
      allControllers.forEach(controller => {
        lines.push(`  - [${controller.name}](#${controller.name.toLowerCase()})`);
      });
    }
    
    if (totalServices > 0) {
      lines.push('- [Services](#services)');
    }
    
    if (totalViews > 0) {
      lines.push('- [Views](#views)');
    }
    
    if (totalEvents > 0) {
      lines.push('- [Events](#events)');
    }
    
    return lines.join('\n');
  }

  private generateMarkdownOverview(ast: SpecVerseAST): string {
    const lines: string[] = ['## Overview', ''];
    
    // Count all items across components
    let totalModels = 0;
    let totalControllers = 0;
    let totalServices = 0;
    let totalViews = 0;
    let totalEvents = 0;
    let totalImports = 0;
    
    for (const component of ast.components) {
      totalModels += component.models.length;
      totalControllers += component.controllers.length;
      totalServices += component.services.length;
      totalViews += component.views.length;
      totalEvents += component.events.length;
      if (component.imports) totalImports += component.imports.length;
    }
    
    // Component statistics
    lines.push('### Component Statistics', '');
    lines.push('| Component Type | Count |');
    lines.push('|----------------|-------|');
    lines.push(`| Models | ${totalModels} |`);
    lines.push(`| Controllers | ${totalControllers} |`);
    lines.push(`| Services | ${totalServices} |`);
    lines.push(`| Views | ${totalViews} |`);
    lines.push(`| Events | ${totalEvents} |`);
    
    // Imports
    if (totalImports > 0) {
      lines.push('', '### Imports', '');
      for (const component of ast.components) {
        if (component.imports && component.imports.length > 0) {
          component.imports.forEach(imp => {
            if (typeof imp === 'string') {
              lines.push(`- ${imp}`);
            } else if (imp.file) {
              lines.push(`- ${imp.file} (${imp.select?.join(', ') || 'all'})`);
            }
          });
        }
      }
    }
    
    // Exports
    let hasExports = false;
    for (const component of ast.components) {
      if (component.exports && Object.keys(component.exports).length > 0) {
        if (!hasExports) {
          lines.push('', '### Exports', '');
          hasExports = true;
        }
        lines.push(`**${component.name}:**`);
        Object.entries(component.exports).forEach(([type, items]) => {
          if (Array.isArray(items) && items.length > 0) {
            lines.push(`- **${type}:** ${items.join(', ')}`);
          }
        });
      }
    }
    
    return lines.join('\n');
  }

  private generateMarkdownModels(models: ModelSpec[], options: DocumentationOptions): string {
    const lines: string[] = ['## Models', ''];
    
    models.forEach(model => {
      lines.push(`### ${model.name}`, '');
      
      if (model.description) {
        lines.push(model.description, '');
      }
      
      // Attributes table
      if (model.attributes.length > 0) {
        lines.push('#### Attributes', '');
        lines.push('| Name | Type | Required | Unique | Description |');
        lines.push('|------|------|----------|--------|-------------|');
        
        model.attributes.forEach(attr => {
          const required = attr.required ? '✓' : '';
          const unique = attr.unique ? '✓' : '';
          const description = this.generateAttributeDescription(attr);
          lines.push(`| ${attr.name} | ${attr.type} | ${required} | ${unique} | ${description} |`);
        });
        lines.push('');
      }
      
      // Relationships
      if (model.relationships.length > 0) {
        lines.push('#### Relationships', '');
        lines.push('| Name | Type | Target | Description |');
        lines.push('|------|------|--------|-------------|');
        
        model.relationships.forEach(rel => {
          const description = this.generateRelationshipDescription(rel);
          lines.push(`| ${rel.name} | ${rel.type} | ${rel.target} | ${description} |`);
        });
        lines.push('');
      }
      
      // Lifecycles
      if (model.lifecycles.length > 0) {
        lines.push('#### Lifecycles', '');
        model.lifecycles.forEach(lifecycle => {
          lines.push(`**${lifecycle.name}:** ${lifecycle.states.join(' → ')}`);
          if (lifecycle.actions.length > 0) {
            lines.push(`- Actions: ${lifecycle.actions.join(', ')}`);
          }
        });
        lines.push('');
      }
      
      // Behaviors
      if (Object.keys(model.behaviors).length > 0) {
        lines.push('#### Behaviors', '');
        Object.entries(model.behaviors).forEach(([name, behavior]) => {
          lines.push(`##### ${name}`, '');
          this.generateExecutableDocumentation(behavior, lines);
        });
      }
      
      lines.push('---', '');
    });
    
    return lines.join('\n');
  }

  private generateMarkdownControllers(controllers: ControllerSpec[], options: DocumentationOptions): string {
    const lines: string[] = ['## Controllers', ''];
    
    controllers.forEach(controller => {
      lines.push(`### ${controller.name}`, '');
      
      if (controller.description) {
        lines.push(controller.description, '');
      }
      
      if (controller.model) {
        lines.push(`**Model:** ${controller.model}  `);
      }
      
      if (controller.path) {
        lines.push(`**Base Path:** ${controller.path}  `);
      }
      
      lines.push('');
      
      // CURED Operations
      if (controller.cured && Object.keys(controller.cured).length > 0) {
        lines.push('#### CURED Operations', '');
        
        Object.entries(controller.cured).forEach(([operation, spec]) => {
          if (spec) {
            lines.push(`##### ${operation}`, '');
            const endpoint = this.inferEndpoint(operation, controller.path || `/${controller.model?.toLowerCase()}`);
            lines.push(`**Endpoint:** ${endpoint}  `);
            lines.push('');
            this.generateExecutableDocumentation(spec, lines);
          }
        });
      }
      
      // Custom Actions
      if (Object.keys(controller.actions).length > 0) {
        lines.push('#### Custom Actions', '');
        
        Object.entries(controller.actions).forEach(([name, action]) => {
          lines.push(`##### ${name}`, '');
          this.generateExecutableDocumentation(action, lines);
        });
      }
      
      // Subscriptions
      if (controller.subscriptions && controller.subscriptions.events.length > 0) {
        lines.push('#### Event Subscriptions', '');
        controller.subscriptions.events.forEach(event => {
          const handler = controller.subscriptions.handlers?.[event] || 'default handler';
          lines.push(`- **${event}** → ${handler}`);
        });
        lines.push('');
      }
      
      lines.push('---', '');
    });
    
    return lines.join('\n');
  }

  private generateMarkdownServices(services: ServiceSpec[]): string {
    const lines: string[] = ['## Services', ''];
    
    services.forEach(service => {
      lines.push(`### ${service.name}`, '');
      
      if (service.description) {
        lines.push(service.description, '');
      }
      
      // Operations
      if (Object.keys(service.operations).length > 0) {
        lines.push('#### Operations', '');
        
        Object.entries(service.operations).forEach(([name, operation]) => {
          lines.push(`##### ${name}`, '');
          this.generateExecutableDocumentation(operation, lines);
        });
      }
      
      // Subscriptions
      if (service.subscriptions && service.subscriptions.events.length > 0) {
        lines.push('#### Event Subscriptions', '');
        service.subscriptions.events.forEach(event => {
          const handler = service.subscriptions.handlers?.[event] || 'default handler';
          lines.push(`- **${event}** → ${handler}`);
        });
        lines.push('');
      }
      
      lines.push('---', '');
    });
    
    return lines.join('\n');
  }

  private generateMarkdownViews(views: ViewSpec[]): string {
    const lines: string[] = ['## Views', ''];
    
    views.forEach(view => {
      lines.push(`### ${view.name}`, '');
      
      if (view.description) {
        lines.push(view.description, '');
      }
      
      // Components
      if (Object.keys(view.uiComponents).length > 0) {
        lines.push('#### Components', '');
        lines.push('| Component | Type | Description |');
        lines.push('|-----------|------|-------------|');
        
        Object.entries(view.uiComponents).forEach(([name, component]) => {
          const type = component.type || 'Component';
          const description = component.description || '';
          lines.push(`| ${name} | ${type} | ${description} |`);
        });
        lines.push('');
      }
      
      // Subscriptions
      if (view.subscriptions && view.subscriptions.events.length > 0) {
        lines.push('#### Event Subscriptions', '');
        view.subscriptions.events.forEach(event => {
          lines.push(`- ${event}`);
        });
        lines.push('');
      }
      
      lines.push('---', '');
    });
    
    return lines.join('\n');
  }

  private generateMarkdownEvents(events: EventSpec[]): string {
    const lines: string[] = ['## Events', ''];
    
    events.forEach(event => {
      lines.push(`### ${event.name}`, '');
      
      if (event.description) {
        lines.push(event.description, '');
      }
      
      // Payload
      if (event.payload.length > 0) {
        lines.push('#### Payload', '');
        lines.push('| Field | Type | Required | Description |');
        lines.push('|-------|------|----------|-------------|');
        
        event.payload.forEach(field => {
          const required = field.required ? '✓' : '';
          const description = this.generateAttributeDescription(field);
          lines.push(`| ${field.name} | ${field.type} | ${required} | ${description} |`);
        });
        lines.push('');
      }
      
      lines.push('---', '');
    });
    
    return lines.join('\n');
  }

  /**
   * Generate HTML documentation
   */
  private generateHTML(ast: SpecVerseAST, options: DocumentationOptions): string {
    const markdown = this.generateMarkdown(ast, options);
    
    // Basic HTML wrapper with styling
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${ast.components[0]?.name || ast.deployments[0]?.name || 'SpecVerse'} Documentation</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 900px;
            margin: 0 auto;
            padding: 20px;
        }
        h1, h2, h3, h4, h5 { 
            color: #2c3e50;
            margin-top: 1.5em;
        }
        h1 { border-bottom: 2px solid #3498db; padding-bottom: 0.3em; }
        h2 { border-bottom: 1px solid #ecf0f1; padding-bottom: 0.2em; }
        table {
            border-collapse: collapse;
            width: 100%;
            margin: 1em 0;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        th {
            background-color: #f8f9fa;
            font-weight: bold;
        }
        code {
            background-color: #f4f4f4;
            padding: 2px 4px;
            border-radius: 3px;
            font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
        }
        pre {
            background-color: #f4f4f4;
            padding: 1em;
            border-radius: 5px;
            overflow-x: auto;
        }
        .toc {
            background-color: #f8f9fa;
            padding: 1em;
            border-radius: 5px;
            margin: 1em 0;
        }
        .toc ul {
            list-style-type: none;
            padding-left: 1em;
        }
        .toc a {
            text-decoration: none;
            color: #3498db;
        }
        .toc a:hover {
            text-decoration: underline;
        }
        hr {
            border: none;
            border-top: 1px solid #ecf0f1;
            margin: 2em 0;
        }
    </style>
</head>
<body>
    ${this.markdownToHTML(markdown)}
</body>
</html>`;
  }

  /**
   * Generate OpenAPI specification
   */
  private generateOpenAPI(ast: SpecVerseAST, options: DocumentationOptions): string {
    const primaryComponent = ast.components[0];
    const spec: any = {
      openapi: '3.0.3',
      info: {
        title: primaryComponent?.name || ast.deployments[0]?.name || 'SpecVerse API',
        description: primaryComponent?.description || ast.deployments[0]?.description || 'Generated from SpecVerse specification',
        version: primaryComponent?.version || ast.deployments[0]?.version || '1.0.0'
      },
      servers: options.baseUrl ? [{ url: options.baseUrl }] : [],
      paths: {},
      components: {
        schemas: {},
        responses: {},
        parameters: {}
      }
    };
    
    // Collect all items from all components
    const allModels: ModelSpec[] = [];
    const allControllers: ControllerSpec[] = [];
    
    for (const component of ast.components) {
      allModels.push(...component.models);
      allControllers.push(...component.controllers);
    }
    
    // Generate schemas from models
    allModels.forEach(model => {
      spec.components.schemas[model.name] = this.modelToOpenAPISchema(model);
    });
    
    // Generate paths from controllers
    allControllers.forEach(controller => {
      const basePath = controller.path || `/${controller.model?.toLowerCase() || controller.name.toLowerCase()}`;
      
      // CURED operations
      if (controller.cured) {
        if (controller.cured.create) {
          const path = basePath;
          spec.paths[path] = spec.paths[path] || {};
          spec.paths[path].post = this.generateOpenAPIOperation('create', controller.cured.create, controller.model);
        }
        
        if (controller.cured.retrieve) {
          const path = `${basePath}/{id}`;
          spec.paths[path] = spec.paths[path] || {};
          spec.paths[path].get = this.generateOpenAPIOperation('retrieve', controller.cured.retrieve, controller.model);
        }
        
        if (controller.cured.retrieve_many) {
          const path = basePath;
          spec.paths[path] = spec.paths[path] || {};
          spec.paths[path].get = this.generateOpenAPIOperation('list', controller.cured.retrieve_many, controller.model);
        }
        
        if (controller.cured.update) {
          const path = `${basePath}/{id}`;
          spec.paths[path] = spec.paths[path] || {};
          spec.paths[path].put = this.generateOpenAPIOperation('update', controller.cured.update, controller.model);
        }
        
        if (controller.cured.delete) {
          const path = `${basePath}/{id}`;
          spec.paths[path] = spec.paths[path] || {};
          spec.paths[path].delete = this.generateOpenAPIOperation('delete', controller.cured.delete, controller.model);
        }
      }
      
      // Custom actions
      Object.entries(controller.actions).forEach(([name, action]) => {
        const path = `${basePath}/${this.toKebabCase(name)}`;
        const method = this.inferHttpMethod(name);
        spec.paths[path] = spec.paths[path] || {};
        spec.paths[path][method] = this.generateOpenAPIOperation(name, action, controller.model);
      });
    });
    
    return JSON.stringify(spec, null, 2);
  }

  /**
   * Helper methods
   */
  
  private generateAttributeDescription(attr: AttributeSpec): string {
    const parts: string[] = [];
    
    if (attr.default) parts.push(`Default: ${attr.default}`);
    if (attr.min !== undefined) parts.push(`Min: ${attr.min}`);
    if (attr.max !== undefined) parts.push(`Max: ${attr.max}`);
    if (attr.auto) parts.push(`Auto: ${attr.auto}`);
    if (attr.verified) parts.push('Verified');
    if (attr.searchable) parts.push('Searchable');
    
    return parts.join(', ');
  }

  private generateRelationshipDescription(rel: RelationshipSpec): string {
    const parts: string[] = [];
    
    if (rel.cascade) parts.push('Cascade delete');
    if (rel.dependent) parts.push('Dependent');
    if (rel.eager) parts.push('Eager loading');
    if (rel.lazy) parts.push('Lazy loading');
    if (rel.through) parts.push(`Through: ${rel.through}`);
    
    return parts.join(', ');
  }

  private generateExecutableDocumentation(spec: ExecutablePropertiesSpec, lines: string[]): void {
    if (spec.description) {
      lines.push(spec.description, '');
    }
    
    // Parameters
    if (spec.parameters && Object.keys(spec.parameters).length > 0) {
      lines.push('**Parameters:**');
      Object.entries(spec.parameters).forEach(([name, param]) => {
        const required = param.required ? ' (required)' : ' (optional)';
        lines.push(`- \`${name}\`: ${param.type}${required}`);
      });
      lines.push('');
    }
    
    // Returns
    if (spec.returns) {
      lines.push(`**Returns:** ${spec.returns}`, '');
    }
    
    // Steps
    if (spec.steps && spec.steps.length > 0) {
      lines.push('**Steps:**');
      spec.steps.forEach((step, index) => lines.push(`${index + 1}. ${step}`));
      lines.push('');
    }
    
    // Business rules
    if (spec.requires && spec.requires.length > 0) {
      lines.push('**Preconditions:**');
      spec.requires.forEach(req => lines.push(`- ${req}`));
      lines.push('');
    }
    
    if (spec.ensures && spec.ensures.length > 0) {
      lines.push('**Postconditions:**');
      spec.ensures.forEach(ens => lines.push(`- ${ens}`));
      lines.push('');
    }
    
    if (spec.publishes && spec.publishes.length > 0) {
      lines.push(`**Publishes:** ${spec.publishes.join(', ')}`, '');
    }
  }

  private inferEndpoint(operation: string, basePath: string): string {
    const endpoints: { [key: string]: string } = {
      'create': `POST ${basePath}`,
      'retrieve': `GET ${basePath}/:id`,
      'retrieve_many': `GET ${basePath}`,
      'update': `PUT ${basePath}/:id`,
      'evolve': `PATCH ${basePath}/:id/evolve`,
      'delete': `DELETE ${basePath}/:id`
    };
    
    return endpoints[operation] || `${basePath}/${operation}`;
  }

  private modelToOpenAPISchema(model: ModelSpec): any {
    const schema: any = {
      type: 'object',
      description: model.description,
      properties: {},
      required: []
    };
    
    model.attributes.forEach(attr => {
      schema.properties[attr.name] = {
        type: this.mapToOpenAPIType(attr.type),
        description: this.generateAttributeDescription(attr)
      };
      
      if (attr.required) {
        schema.required.push(attr.name);
      }
      
      if (attr.min !== undefined) {
        schema.properties[attr.name].minimum = attr.min;
      }
      
      if (attr.max !== undefined) {
        schema.properties[attr.name].maximum = attr.max;
      }
      
      if (attr.default !== undefined) {
        schema.properties[attr.name].default = attr.default;
      }
    });
    
    return schema;
  }

  private mapToOpenAPIType(type: string): string {
    const typeMap: { [key: string]: string } = {
      'String': 'string',
      'Text': 'string',
      'Integer': 'integer',
      'Number': 'number',
      'Boolean': 'boolean',
      'Date': 'string',
      'DateTime': 'string',
      'UUID': 'string',
      'Email': 'string',
      'URL': 'string',
      'JSON': 'object',
      'Object': 'object',
      'Array': 'array'
    };
    
    return typeMap[type] || 'string';
  }

  private generateOpenAPIOperation(name: string, spec: ExecutablePropertiesSpec, modelName?: string): any {
    const operation: any = {
      summary: name,
      description: spec.description || `${name} operation`,
      responses: {
        '200': {
          description: 'Successful response',
          content: {
            'application/json': {
              schema: spec.returns ? { $ref: `#/components/schemas/${spec.returns}` } : { type: 'object' }
            }
          }
        }
      }
    };
    
    // Add parameters
    if (spec.parameters && Object.keys(spec.parameters).length > 0) {
      operation.requestBody = {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {},
              required: []
            }
          }
        }
      };
      
      Object.entries(spec.parameters).forEach(([paramName, param]) => {
        operation.requestBody.content['application/json'].schema.properties[paramName] = {
          type: this.mapToOpenAPIType(param.type)
        };
        
        if (param.required) {
          operation.requestBody.content['application/json'].schema.required.push(paramName);
        }
      });
    }
    
    return operation;
  }

  private inferHttpMethod(name: string): string {
    const prefixes: { [key: string]: string } = {
      'get': 'get',
      'find': 'get',
      'search': 'get',
      'list': 'get',
      'create': 'post',
      'add': 'post',
      'update': 'put',
      'patch': 'patch',
      'delete': 'delete',
      'remove': 'delete'
    };
    
    const nameLower = name.toLowerCase();
    for (const [prefix, method] of Object.entries(prefixes)) {
      if (nameLower.startsWith(prefix)) {
        return method;
      }
    }
    
    return 'post';
  }

  private toKebabCase(str: string): string {
    return str
      .replace(/([A-Z])/g, '-$1')
      .toLowerCase()
      .replace(/^-/, '');
  }

  private markdownToHTML(markdown: string): string {
    // Simple markdown to HTML conversion
    return markdown
      .replace(/^##### (.*$)/gim, '<h5>$1</h5>')
      .replace(/^#### (.*$)/gim, '<h4>$1</h4>')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^\* (.+)/gim, '<li>$1</li>')
      .replace(/^- (.+)/gim, '<li>$1</li>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code>$1</code>')
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/^/g, '<p>')
      .replace(/$/g, '</p>')
      .replace(/<p><h/g, '<h')
      .replace(/<\/h(\d)><\/p>/g, '</h$1>')
      .replace(/<p><li>/g, '<ul><li>')
      .replace(/<\/li><\/p>/g, '</li></ul>')
      .replace(/\|(.+)\|/g, (match) => {
        const cells = match.split('|').filter(c => c.trim());
        const isHeader = cells.every(c => c.trim().match(/^-+$/));
        if (isHeader) return '';
        const tag = match.includes('---') ? 'th' : 'td';
        return `<tr>${cells.map(c => `<${tag}>${c.trim()}</${tag}>`).join('')}</tr>`;
      });
  }
}