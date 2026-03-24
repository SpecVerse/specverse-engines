#!/usr/bin/env node

/**
 * SpecVerse v3.1 Enhanced Examples Validation Harness with Expected Failures Support
 * 
 * Validates and processes all .specly examples and test files
 * Uses expected-failures.json to distinguish expected vs unexpected failures
 * 
 * Usage: Run from project root directory  
 *   node examples/validate-examples-with-expected-failures.cjs
 * 
 * Features:
 * - Comprehensive validation (examples + tests directories)
 * - Expected failures management system
 * - 3-phase validation with failure categorization
 * - Integration with test suite expected failures
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const ExpectedFailuresManager = require('../tests/expected-failures.cjs');

// ANSI Colors for better output
const colors = {
  blue: '\x1b[1m\x1b[34m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  orange: '\x1b[38;5;208m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

class EnhancedExamplesValidator {
  constructor() {
    this.results = {
      validation: { passed: 0, expectedFailures: 0, unexpectedFailures: 0, errors: [] },
      processing: { passed: 0, expectedFailures: 0, unexpectedFailures: 0, errors: [] },
      yamlValidation: { passed: 0, expectedFailures: 0, unexpectedFailures: 0, errors: [] }
    };
    this.cliPath = './dist/cli/specverse-cli.js';
    this.expectedFailures = new ExpectedFailuresManager();
    this.allTestedFiles = new Set();
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
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'diagrams' && item !== 'docs' && item !== 'metadata' && item !== 'common' && item !== 'archive' && item !== 'templates') {
          scanDirectory(fullPath);
        } else if (item.endsWith('.specly') && !fullPath.includes('/archive/')) {
          // Skip any .specly files that are in archive directories at any level
          speclyFiles.push(fullPath);
        }
      }
    }
    
    // Scan examples directory and test directories
    // Note: Excluding templates as they contain {{variables}} that are invalid until processed
    const searchPaths = [
      'examples',
      'tests'
    ];
    
    searchPaths.forEach(searchPath => {
      if (fs.existsSync(searchPath)) {
        scanDirectory(searchPath);
      }
    });
    
    return speclyFiles.sort();
  }

  handleValidationResult(filePath, success, error = null) {
    const relativePath = path.relative('.', filePath);
    this.allTestedFiles.add(relativePath);
    
    if (success) {
      this.log(`✅ ${path.basename(filePath)} validation passed`, colors.green);
      this.results.validation.passed++;
    } else {
      const isExpected = this.expectedFailures.isExpectedFailure(relativePath);
      
      if (isExpected) {
        const reason = this.expectedFailures.getExpectedFailureReason(relativePath);
        this.log(`⚠️  ${path.basename(filePath)} validation failed (EXPECTED: ${reason.category})`, colors.orange);
        this.results.validation.expectedFailures++;
      } else {
        this.log(`❌ ${path.basename(filePath)} validation failed (UNEXPECTED!)`, colors.red);
        this.results.validation.unexpectedFailures++;
        if (error) {
          this.log(`   Error: ${error}`, colors.red);
        }
      }
      
      this.results.validation.errors.push({
        file: relativePath,
        error: error,
        expected: isExpected
      });
    }
  }

  handleProcessingResult(filePath, success, error = null) {
    const relativePath = path.relative('.', filePath);
    
    if (success) {
      this.log(`✅ ${path.basename(filePath)} processing succeeded`, colors.green);
      this.results.processing.passed++;
    } else {
      const isExpected = this.expectedFailures.isExpectedFailure(relativePath);
      
      if (isExpected) {
        const reason = this.expectedFailures.getExpectedFailureReason(relativePath);
        this.log(`⚠️  ${path.basename(filePath)} processing failed (EXPECTED: ${reason.category})`, colors.orange);
        this.results.processing.expectedFailures++;
      } else {
        this.log(`❌ ${path.basename(filePath)} processing failed (UNEXPECTED!)`, colors.red);
        this.results.processing.unexpectedFailures++;
        if (error && error.length > 200) {
          // Truncate very long errors
          error = error.substring(0, 200) + '...';
        }
        if (error) {
          this.log(`❌ Processing failed:\n   ${error}`, colors.red);
        }
      }
      
      this.results.processing.errors.push({
        file: relativePath,
        error: error,
        expected: isExpected
      });
    }
  }

  validateSpeclyFile(filePath) {
    this.log(`🧪 Validating ${path.basename(filePath)}`, colors.blue);
    
    try {
      execSync(`node ${this.cliPath} validate "${filePath}"`, { 
        stdio: 'pipe',
        timeout: 10000 
      });
      this.handleValidationResult(filePath, true);
    } catch (error) {
      this.handleValidationResult(filePath, false, error.message);
    }
  }

  processSpeclyFile(filePath) {
    const fileName = path.basename(filePath, '.specly');
    const outputPath = `/tmp/example-${fileName}.yaml`;
    
    this.log(`🧪 Processing ${path.basename(filePath)} → .yaml`, colors.blue);
    
    try {
      const result = execSync(`node ${this.cliPath} gen yaml "${filePath}" -o "${outputPath}"`, { 
        stdio: 'pipe',
        timeout: 15000,
        encoding: 'utf8'
      });
      
      // Check if output file was created and has content
      if (fs.existsSync(outputPath)) {
        const content = fs.readFileSync(outputPath, 'utf8').trim();
        if (content.length > 10) { // Minimal content check
          this.handleProcessingResult(filePath, true);
          
          // Validate the generated YAML
          this.validateGeneratedYaml(outputPath, fileName);
        } else {
          this.handleProcessingResult(filePath, false, "Generated YAML is empty or minimal");
        }
      } else {
        this.handleProcessingResult(filePath, false, "No output file generated");
      }
    } catch (error) {
      this.handleProcessingResult(filePath, false, error.message);
    }
  }

  validateGeneratedYaml(yamlPath, baseName) {
    this.log(`🧪 Validating generated ${path.basename(yamlPath)}`, colors.blue);
    
    try {
      execSync(`node ${this.cliPath} validate "${yamlPath}"`, { 
        stdio: 'pipe',
        timeout: 10000 
      });
      this.log(`✅ Generated ${path.basename(yamlPath)} validation passed`, colors.green);
      this.results.yamlValidation.passed++;
    } catch (error) {
      this.log(`❌ Generated ${path.basename(yamlPath)} validation failed`, colors.red);
      this.results.yamlValidation.unexpectedFailures++;
      this.results.yamlValidation.errors.push({
        file: yamlPath,
        error: error.message,
        expected: false
      });
    }
    
    // Clean up
    try {
      fs.unlinkSync(yamlPath);
    } catch (e) {
      // Ignore cleanup errors
    }
  }

  printSummary() {
    this.log('', '');
    this.log('📊 Enhanced Test Results Summary', colors.bold + colors.blue);
    
    const phases = [
      { name: 'Phase 1: .specly Validation', results: this.results.validation },
      { name: 'Phase 2: .specly → .yaml Processing', results: this.results.processing },
      { name: 'Phase 3: Generated .yaml Validation', results: this.results.yamlValidation }
    ];
    
    let totalPassed = 0;
    let totalExpected = 0;
    let totalUnexpected = 0;
    
    phases.forEach(phase => {
      const r = phase.results;
      totalPassed += r.passed;
      totalExpected += r.expectedFailures;
      totalUnexpected += r.unexpectedFailures;
      
      this.log(`\n${phase.name}:`, colors.bold);
      this.log(`  ✅ Passed: ${r.passed}`, colors.green);
      if (r.expectedFailures > 0) {
        this.log(`  ⚠️  Expected Failures: ${r.expectedFailures}`, colors.orange);
      }
      if (r.unexpectedFailures > 0) {
        this.log(`  ❌ Unexpected Failures: ${r.unexpectedFailures}`, colors.red);
      }
    });
    
    // Overall summary
    this.log('\n=== OVERALL SUMMARY ===', colors.bold);
    this.log(`Total Tests: ${totalPassed + totalExpected + totalUnexpected}`);
    this.log(`✅ Passed: ${totalPassed}`, colors.green);
    this.log(`⚠️  Expected Failures: ${totalExpected}`, colors.orange);
    this.log(`❌ Unexpected Failures: ${totalUnexpected}`, colors.red);
    
    // Generate expected failures report
    const allActualFailures = [
      ...this.results.validation.errors.filter(e => !e.expected).map(e => e.file),
      ...this.results.processing.errors.filter(e => !e.expected).map(e => e.file),
      ...this.results.yamlValidation.errors.filter(e => !e.expected).map(e => e.file)
    ];
    
    const analysis = this.expectedFailures.generateReport(
      allActualFailures, 
      totalPassed + totalExpected + totalUnexpected
    );
    
    this.log(analysis.report, '');
    
    // Return success status
    return {
      success: analysis.isHealthy,
      summary: analysis.summary,
      hasUnexpectedFailures: totalUnexpected > 0
    };
  }

  async run() {
    this.log('🚀 SpecVerse v3.1 Enhanced Examples Validation Harness', colors.bold + colors.blue);
    this.log('Validating .specly examples with expected failures support\\n', '');
    
    const speclyFiles = this.findSpeclyFiles();
    this.log(`📁 Found ${speclyFiles.length} .specly example files\\n`, colors.blue);
    
    // Phase 1: Validation
    this.log('Phase 1: .specly File Validation', colors.bold + colors.blue);
    for (const file of speclyFiles) {
      this.validateSpeclyFile(file);
    }
    
    // Phase 2: Processing (only for files that passed validation OR are expected to pass processing)
    this.log('\\nPhase 2: .specly → .yaml Processing', colors.bold + colors.blue);
    const validFiles = speclyFiles.filter(file => {
      const relativePath = path.relative('.', file);
      const validationError = this.results.validation.errors.find(e => e.file === relativePath);
      return !validationError || validationError.expected;
    });
    
    for (const file of validFiles) {
      // Only process if validation passed OR it's an expected validation failure
      const relativePath = path.relative('.', file);
      const validationFailed = this.results.validation.errors.some(e => e.file === relativePath);
      
      if (!validationFailed || this.expectedFailures.isExpectedFailure(relativePath)) {
        this.processSpeclyFile(file);
      }
    }
    
    return this.printSummary();
  }
}

// Run if called directly
if (require.main === module) {
  const validator = new EnhancedExamplesValidator();
  validator.run().then(result => {
    process.exit(result.hasUnexpectedFailures ? 1 : 0);
  }).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = EnhancedExamplesValidator;