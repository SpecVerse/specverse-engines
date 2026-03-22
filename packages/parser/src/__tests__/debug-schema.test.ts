import { describe, it, expect } from 'vitest';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import fs from 'fs';
import path from 'path';

describe('Debug Schema Loading', () => {
  it('should identify the schema loading issue', () => {
    const schemaPath = path.join(__dirname, '../../../schema/SPECVERSE-SCHEMA.json');
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');
    const schema = JSON.parse(schemaContent);
    
    console.log('Schema $schema:', schema.$schema);
    console.log('Schema $id:', schema.$id);
    
    const ajv = new Ajv({ 
      allErrors: true,
      strict: false
    });
    
    // Load draft-07 meta-schema
    if (!ajv.getSchema('http://json-schema.org/draft-07/schema')) {
      const draft7 = require('ajv/dist/refs/json-schema-draft-07.json');
      ajv.addMetaSchema(draft7);
    }
    
    addFormats(ajv);
    
    // Try to compile the schema
    try {
      const validate = ajv.compile(schema);
      console.log('Schema compiled successfully');
      
      // Try to validate simple data
      const testData = {
        component: "Test",
        version: "1.0.0"
      };
      
      const valid = validate(testData);
      console.log('Validation result:', valid);
      if (!valid) {
        console.log('Validation errors:', validate.errors);
      }
    } catch (error) {
      console.log('Schema compilation error:', error);
    }
  });
});