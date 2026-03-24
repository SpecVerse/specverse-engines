#!/usr/bin/env node

/**
 * SpecVerse v3.1 Examples Validation Harness (Basic)
 * 
 * Validates and processes all .specly examples in the examples directory
 * 
 * Usage: Run from examples/ directory
 *   cd examples && node validate-examples.cjs
 * 
 * Features:
 * - Simple 3-phase validation (specly → yaml → validation)
 * - No expected failures handling
 * - Focused on examples directory only
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ANSI Colors for better output
const colors = {
  blue: '\x1b[1m\x1b[34m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

class ExamplesValidator {
  constructor() {
    this.results = {
      validation: { passed: 0, failed: 0, errors: [] },
      processing: { passed: 0, failed: 0, errors: [] },
      yamlValidation: { passed: 0, failed: 0, errors: [] }
    };
    this.cliPath = '../dist/cli/specverse-cli.js';
  }

  log(message, color = '') {
    console.log(`${color}${message}${colors.reset}`);
  }

  findSpeclyFiles() {
    const speclyFiles = [];
    
    function scanDirectory(dir) {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'diagrams' && item !== 'docs' && item !== 'metadata' && item !== 'common') {
          scanDirectory(fullPath);
        } else if (item.endsWith('.specly')) {
          speclyFiles.push(fullPath);
        }
      }
    }
    
    scanDirectory('.');
    return speclyFiles.sort();
  }

  async validateSpeclyFile(filePath) {
    try {
      const cmd = `node ${this.cliPath} validate "${filePath}"`;
      execSync(cmd, { stdio: 'pipe' });
      this.results.validation.passed++;
      this.log(`✅ ${path.basename(filePath)} validation passed`, colors.green);
      return true;
    } catch (error) {
      this.results.validation.failed++;
      this.results.validation.errors.push({
        file: filePath,
        error: error.message,
        type: '.specly validation'
      });
      this.log(`❌ ${path.basename(filePath)} validation failed`, colors.red);
      this.log(`   Error: ${error.message.split('\\n')[0]}`, '');
      return false;
    }
  }

  async processSpeclyFile(filePath) {
    try {
      const outputPath = `/tmp/example-${path.basename(filePath, '.specly')}.yaml`;
      const cmd = `node ${this.cliPath} gen yaml "${filePath}" -o "${outputPath}"`;
      execSync(cmd, { stdio: 'pipe' });
      
      // Check if output file was created and has content
      if (fs.existsSync(outputPath)) {
        const content = fs.readFileSync(outputPath, 'utf8');
        if (content.trim().length > 50) { // More than just empty structure
          this.results.processing.passed++;
          this.log(`✅ ${path.basename(filePath)} processing succeeded`, colors.green);
          return { success: true, outputPath };
        } else {
          throw new Error('Generated YAML is empty or minimal');
        }
      } else {
        throw new Error('Output file was not created');
      }
    } catch (error) {
      this.results.processing.failed++;
      this.results.processing.errors.push({
        file: filePath,
        error: error.message,
        type: '.specly → .yaml processing'
      });
      this.log(`❌ ${path.basename(filePath)} processing failed`, colors.red);
      this.log(`   Error: ${error.message.split('\\n')[0]}`, '');
      return { success: false };
    }
  }

  async validateYamlFile(filePath) {
    try {
      const cmd = `node ${this.cliPath} validate "${filePath}"`;
      execSync(cmd, { stdio: 'pipe' });
      this.results.yamlValidation.passed++;
      this.log(`✅ Generated ${path.basename(filePath)} validation passed`, colors.green);
      return true;
    } catch (error) {
      this.results.yamlValidation.failed++;
      this.results.yamlValidation.errors.push({
        file: filePath,
        error: error.message,
        type: 'Generated .yaml validation'
      });
      this.log(`❌ Generated ${path.basename(filePath)} validation failed`, colors.red);
      this.log(`   Error: ${error.message.split('\\n')[0]}`, '');
      return false;
    }
  }

  printSummary() {
    const total = this.results.validation.passed + this.results.validation.failed;
    const validationRate = total > 0 ? ((this.results.validation.passed / total) * 100).toFixed(1) : 0;
    const processingRate = total > 0 ? ((this.results.processing.passed / total) * 100).toFixed(1) : 0;
    const yamlRate = this.results.processing.passed > 0 ? 
      ((this.results.yamlValidation.passed / this.results.processing.passed) * 100).toFixed(1) : 0;

    this.log('\\n🏆 Examples Validation Summary', colors.blue);
    this.log(`Total Examples: ${total}`);
    this.log(`✅ Specly Validation: ${this.results.validation.passed}/${total} (${validationRate}%)`, colors.green);
    this.log(`✅ Processing: ${this.results.processing.passed}/${total} (${processingRate}%)`, colors.green);
    this.log(`✅ Generated YAML Validation: ${this.results.yamlValidation.passed}/${this.results.processing.passed} (${yamlRate}%)`, colors.green);
    
    const overallPassed = Math.min(this.results.validation.passed, this.results.processing.passed, this.results.yamlValidation.passed);
    const overallRate = total > 0 ? ((overallPassed / total) * 100).toFixed(1) : 0;
    
    this.log(`\\n🎯 Overall Success Rate: ${overallRate}%`, overallRate >= 90 ? colors.green : overallRate >= 70 ? colors.yellow : colors.red);

    if (this.results.validation.errors.length > 0 || 
        this.results.processing.errors.length > 0 || 
        this.results.yamlValidation.errors.length > 0) {
      this.log('\\n❌ Failed Examples Details', colors.red);
      let errorIndex = 1;
      
      for (const error of [...this.results.validation.errors, ...this.results.processing.errors, ...this.results.yamlValidation.errors]) {
        this.log(`${errorIndex}. ${error.type}`, colors.red);
        this.log(`   File: ${error.file}`, '');
        this.log(`   Error: ${error.error.split('\\n')[0]}`, '');
        this.log('');
        errorIndex++;
      }
    }

    this.log('\\n🔧 Recommended Actions', colors.blue);
    if (overallRate < 50) {
      this.log('1. Update examples to v3.1 container format (components: structure)');
      this.log('2. Fix data types (Text → String, etc.)');
      this.log('3. Update import/export syntax to match v3.1 schema');
    } else if (overallRate < 90) {
      this.log('1. Fix specific validation errors shown above');
      this.log('2. Ensure all examples use current v3.1 conventions');
    } else {
      this.log('1. Examples are in excellent shape!');
      this.log('2. Consider adding more complex examples or edge cases');
    }
  }

  async run() {
    this.log('🚀 SpecVerse v3.1 Examples Validation Harness', colors.blue);
    this.log('Validating .specly examples → processing → validating generated YAML\\n');

    const speclyFiles = this.findSpeclyFiles();
    
    if (speclyFiles.length === 0) {
      this.log('❌ No .specly files found in examples directory', colors.red);
      return;
    }

    this.log(`📁 Found ${speclyFiles.length} .specly example files\\n`);

    // Phase 1: Validate all .specly files
    this.log('Phase 1: .specly File Validation', colors.blue);
    for (const file of speclyFiles) {
      this.log(`🧪 Validating ${path.basename(file)}`);
      await this.validateSpeclyFile(file);
    }

    // Phase 2: Process .specly → .yaml
    this.log('\\nPhase 2: .specly → .yaml Processing', colors.blue);
    for (const file of speclyFiles) {
      this.log(`🧪 Processing ${path.basename(file)} → .yaml`);
      const result = await this.processSpeclyFile(file);
      
      // Phase 3: Validate generated YAML (only if processing succeeded)
      if (result.success) {
        this.log(`🧪 Validating generated ${path.basename(result.outputPath)}`);
        await this.validateYamlFile(result.outputPath);
      }
    }

    this.printSummary();
  }
}

// Run the validator
const validator = new ExamplesValidator();
validator.run().catch(console.error);