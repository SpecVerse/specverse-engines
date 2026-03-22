import { AbstractProcessor } from '@specverse/types';
import { ExecutablePropertiesSpec, AttributeSpec } from '@specverse/types';
import { AttributeProcessor } from './AttributeProcessor.js';

export class ExecutableProcessor extends AbstractProcessor<any, ExecutablePropertiesSpec> {
  private attributeProcessor: AttributeProcessor;

  constructor(context: any) {
    super(context);
    this.attributeProcessor = new AttributeProcessor(context);
  }

  /**
   * Process executable properties (unified pattern)
   * Supports both human-friendly input/output and structured parameters/returns
   */
  process(input: any, contextName: string = 'Executable'): ExecutablePropertiesSpec {
    const spec: ExecutablePropertiesSpec = {
      parameters: {}
    };
    
    // Track supported properties for convention expansion
    const supportedProperties = new Set([
      'description', 'input', 'output', 'parameters', 'returns', 
      'requires', 'ensures', 'publishes', 'steps'
    ]);
    
    // Check for unsupported properties and warn, but preserve them
    const unsupportedProperties = Object.keys(input).filter(key => !supportedProperties.has(key));
    if (unsupportedProperties.length > 0) {
      this.addWarning(
        `${contextName}: Property '${unsupportedProperties.join(', ')}' is not supported and will be ignored. ` +
        `Supported properties are: ${Array.from(supportedProperties).join(', ')}`
      );
    }
    
    if (input.description) {
      spec.description = input.description;
    }
    
    // Handle human-friendly input/output convention
    if (input.input || input.output) {
      // Convert input/output to parameters/returns
      if (input.input) {
        // Convert single input type to parameter
        const inputParam = this.parseInputToParameter(input.input);
        spec.parameters[inputParam.name] = inputParam;
      }
      
      if (input.output) {
        // Convert output type to returns
        spec.returns = input.output;
      }
    }
    
    // Handle structured parameters/returns (takes precedence over input/output)
    if (input.parameters) {
      // Clear input-converted parameters if explicit parameters provided
      spec.parameters = {};
      for (const [paramName, paramDef] of Object.entries(input.parameters)) {
        spec.parameters[paramName] = this.attributeProcessor.process(paramName, paramDef);
      }
    }
    
    if (input.returns) {
      spec.returns = input.returns;
    }
    
    if (input.requires) {
      spec.requires = Array.isArray(input.requires) ? input.requires : [input.requires];
    }
    
    if (input.ensures) {
      spec.ensures = Array.isArray(input.ensures) ? input.ensures : [input.ensures];
    }
    
    if (input.publishes) {
      spec.publishes = Array.isArray(input.publishes) ? input.publishes : [input.publishes];
    }
    
    if (input.steps) {
      spec.steps = Array.isArray(input.steps) ? input.steps : [input.steps];
    }
    
    // PRESERVE ALL UNSUPPORTED PROPERTIES - let schema validation handle them
    for (const key of unsupportedProperties) {
      (spec as any)[key] = input[key];
    }
    
    return spec;
  }

  /**
   * Convert human-friendly input to structured parameter
   */
  private parseInputToParameter(input: string): AttributeSpec {
    // Handle various input formats:
    // "UserData" -> { name: "data", type: "UserData", required: true }
    // "UserData required" -> { name: "data", type: "UserData", required: true }  
    // "userData: UserData" -> { name: "userData", type: "UserData", required: true }
    
    // Check if it has explicit name (contains colon)
    if (input.includes(':')) {
      const [name, typeDef] = input.split(':', 2);
      return this.attributeProcessor.process(name.trim(), typeDef.trim());
    }
    
    // Simple type format - infer parameter name
    const parts = input.trim().split(/\s+/);
    const type = parts[0];
    const modifiers = parts.slice(1);
    
    // Infer parameter name from type (UserData -> userData, ValidationResult -> validationResult)
    const paramName = this.inferParameterName(type);
    
    const spec: AttributeSpec = {
      name: paramName,
      type,
      required: true, // Input parameters are required by default
      unique: false
    };
    
    // Process modifiers
    for (const modifier of modifiers) {
      if (modifier === 'optional') {
        spec.required = false;
      } else if (modifier === 'required') {
        spec.required = true;
      } else if (modifier === 'unique') {
        spec.unique = true;
      } else if (modifier.startsWith('default=')) {
        spec.default = modifier.substring('default='.length);
      }
    }
    
    return spec;
  }

  /**
   * Infer parameter name from type name
   * UserData -> userData, ValidationResult -> validationResult, String -> value
   */
  private inferParameterName(type: string): string {
    // Built-in primitives that map to 'value'
    const SINGLE_VALUE_PRIMITIVES = [
      'String', 'Integer', 'Number', 'Boolean',
      'UUID', 'DateTime', 'Date', 'Email', 'URL'
    ];
    
    if (SINGLE_VALUE_PRIMITIVES.includes(type)) {
      return 'value';
    }
    
    if (type === 'Object') {
      return 'data';
    }
    
    // Convert PascalCase to camelCase for complex types
    return type.charAt(0).toLowerCase() + type.slice(1);
  }
}
