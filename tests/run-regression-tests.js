#!/usr/bin/env node

/**
 * Regression Test Runner
 * 
 * Runs all critical regression tests to ensure recent fixes don't regress.
 * This should be run before every deployment and as part of CI/CD pipeline.
 * 
 * Usage: node tests/run-regression-tests.js [--verbose] [--bail]
 */

const { execSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration
const CONFIG = {
  verbose: process.argv.includes('--verbose'),
  bail: process.argv.includes('--bail'),
  testTimeout: 30000, // 30 seconds per test suite
  maxRetries: 2
};

// Test suites configuration
const REGRESSION_TESTS = [
  {
    name: 'Backend Sorting',
    file: 'tests/regression/backend-sorting.test.js',
    critical: true,
    description: 'Prevents backend from ignoring sort parameters'
  },
  {
    name: 'Backend Pagination',
    file: 'tests/regression/backend-pagination.test.js',
    critical: true,
    description: 'Prevents backend from returning unlimited results'
  },
  {
    name: 'Mobile UI',
    file: 'tests/regression/mobile-ui.test.js',
    critical: true,
    description: 'Prevents mobile scrolling and duplicate control issues'
  }
];

// Color codes for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

/**
 * Print colored console output
 */
function colorLog(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Print header
 */
function printHeader() {
  console.log('');
  colorLog('═══════════════════════════════════════════════════════════', 'cyan');
  colorLog('                  REGRESSION TEST RUNNER                   ', 'bold');
  colorLog('═══════════════════════════════════════════════════════════', 'cyan');
  console.log('');
  colorLog('🛡️  Preventing Critical Bug Regressions', 'blue');
  console.log('');
  
  REGRESSION_TESTS.forEach((test, index) => {
    const status = test.critical ? '🔴 CRITICAL' : '🟡 Important';
    colorLog(`${index + 1}. ${test.name} - ${status}`, 'reset');
    colorLog(`   ${test.description}`, 'cyan');
  });
  
  console.log('');
  colorLog('───────────────────────────────────────────────────────────', 'cyan');
  console.log('');
}

/**
 * Check if test files exist
 */
function validateTestFiles() {
  const missingFiles = [];
  
  REGRESSION_TESTS.forEach(test => {
    if (!fs.existsSync(path.join(process.cwd(), test.file))) {
      missingFiles.push(test.file);
    }
  });
  
  if (missingFiles.length > 0) {
    colorLog('❌ Missing test files:', 'red');
    missingFiles.forEach(file => {
      colorLog(`   - ${file}`, 'red');
    });
    console.log('');
    colorLog('Please ensure all regression test files are created before running.', 'yellow');
    process.exit(1);
  }
  
  colorLog('✅ All test files found', 'green');
  console.log('');
}

/**
 * Setup test environment
 */
function setupEnvironment() {
  colorLog('🔧 Setting up test environment...', 'blue');
  
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.CI = 'true';
  
  // Create test logs directory
  const logsDir = path.join(process.cwd(), 'tests', 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
  
  colorLog('✅ Environment setup complete', 'green');
  console.log('');
}

/**
 * Run a single test suite
 */
async function runTestSuite(testSuite, attempt = 1) {
  const startTime = Date.now();
  
  colorLog(`🧪 Running: ${testSuite.name} (Attempt ${attempt})`, 'blue');
  
  if (CONFIG.verbose) {
    colorLog(`   File: ${testSuite.file}`, 'cyan');
    colorLog(`   Description: ${testSuite.description}`, 'cyan');
  }
  
  try {
    const testCommand = getTestCommand(testSuite);
    const result = await executeTest(testCommand, testSuite);
    
    const duration = Date.now() - startTime;
    colorLog(`✅ ${testSuite.name}: PASSED (${duration}ms)`, 'green');
    
    return { success: true, duration, attempt };
    
  } catch (error) {
    const duration = Date.now() - startTime;
    
    if (attempt < CONFIG.maxRetries) {
      colorLog(`⚠️  ${testSuite.name}: FAILED (attempt ${attempt}), retrying...`, 'yellow');
      return runTestSuite(testSuite, attempt + 1);
    }
    
    colorLog(`❌ ${testSuite.name}: FAILED after ${attempt} attempts (${duration}ms)`, 'red');
    
    if (CONFIG.verbose || testSuite.critical) {
      colorLog('Error details:', 'red');
      console.error(error.message);
    }
    
    return { success: false, duration, attempt, error };
  }
}

/**
 * Get test command based on test file type
 */
function getTestCommand(testSuite) {
  const testFile = testSuite.file;
  
  if (testFile.includes('mobile-ui')) {
    // Frontend tests use Jest with React Testing Library
    return `npx jest "${testFile}" --testTimeout=${CONFIG.testTimeout}`;
  } else {
    // Backend tests use Jest with Supertest
    return `npx jest "${testFile}" --testTimeout=${CONFIG.testTimeout} --detectOpenHandles`;
  }
}

/**
 * Execute test command
 */
async function executeTest(command, testSuite) {
  return new Promise((resolve, reject) => {
    const logFile = path.join(process.cwd(), 'tests', 'logs', `${testSuite.name.replace(/\s/g, '-')}.log`);
    
    const child = spawn('sh', ['-c', command], {
      stdio: CONFIG.verbose ? 'inherit' : ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, FORCE_COLOR: '1' }
    });
    
    let stdout = '';
    let stderr = '';
    
    if (!CONFIG.verbose) {
      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });
    }
    
    const timeout = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error(`Test timeout after ${CONFIG.testTimeout}ms`));
    }, CONFIG.testTimeout);
    
    child.on('close', (code) => {
      clearTimeout(timeout);
      
      // Write logs
      const logContent = `
REGRESSION TEST LOG: ${testSuite.name}
Date: ${new Date().toISOString()}
Command: ${command}
Exit Code: ${code}

STDOUT:
${stdout}

STDERR:
${stderr}
`;
      fs.writeFileSync(logFile, logContent);
      
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`Test failed with exit code ${code}\n${stderr || stdout}`));
      }
    });
    
    child.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
}

/**
 * Generate test report
 */
function generateReport(results) {
  console.log('');
  colorLog('═══════════════════════════════════════════════════════════', 'cyan');
  colorLog('                     REGRESSION REPORT                     ', 'bold');
  colorLog('═══════════════════════════════════════════════════════════', 'cyan');
  console.log('');
  
  const totalTests = results.length;
  const passedTests = results.filter(r => r.success).length;
  const failedTests = totalTests - passedTests;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
  
  // Summary
  colorLog(`📊 Test Summary:`, 'blue');
  colorLog(`   Total: ${totalTests}`, 'reset');
  colorLog(`   Passed: ${passedTests}`, passedTests === totalTests ? 'green' : 'reset');
  colorLog(`   Failed: ${failedTests}`, failedTests > 0 ? 'red' : 'reset');
  colorLog(`   Duration: ${totalDuration}ms`, 'reset');
  console.log('');
  
  // Individual results
  colorLog('📋 Detailed Results:', 'blue');
  results.forEach((result, index) => {
    const testSuite = REGRESSION_TESTS[index];
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    const color = result.success ? 'green' : 'red';
    const critical = testSuite.critical ? '🔴 CRITICAL' : '';
    
    colorLog(`   ${status} ${testSuite.name} ${critical} (${result.duration}ms)`, color);
    
    if (!result.success && result.attempt > 1) {
      colorLog(`       Retried ${result.attempt} times`, 'yellow');
    }
  });
  
  console.log('');
  
  // Critical failures
  const criticalFailures = results.filter((r, i) => !r.success && REGRESSION_TESTS[i].critical);
  
  if (criticalFailures.length > 0) {
    colorLog('🚨 CRITICAL FAILURES DETECTED:', 'red');
    criticalFailures.forEach((failure, index) => {
      const testIndex = results.findIndex(r => r === failure);
      const testSuite = REGRESSION_TESTS[testIndex];
      colorLog(`   ❌ ${testSuite.name}: ${testSuite.description}`, 'red');
    });
    console.log('');
    colorLog('⚠️  DEPLOYMENT BLOCKED - Fix critical issues before proceeding', 'red');
  }
  
  // Success message
  if (passedTests === totalTests) {
    console.log('');
    colorLog('🎉 ALL REGRESSION TESTS PASSED!', 'green');
    colorLog('✅ Safe to deploy - no critical regressions detected', 'green');
  }
  
  console.log('');
  colorLog('───────────────────────────────────────────────────────────', 'cyan');
  
  // Log file locations
  if (!CONFIG.verbose) {
    console.log('');
    colorLog('📄 Detailed logs available in:', 'blue');
    colorLog('   tests/logs/', 'cyan');
  }
  
  console.log('');
  
  return passedTests === totalTests;
}

/**
 * Main execution function
 */
async function main() {
  try {
    printHeader();
    validateTestFiles();
    setupEnvironment();
    
    colorLog('🚀 Starting regression test execution...', 'blue');
    console.log('');
    
    const results = [];
    
    for (const testSuite of REGRESSION_TESTS) {
      const result = await runTestSuite(testSuite);
      results.push(result);
      
      // Bail on first failure if requested
      if (CONFIG.bail && !result.success) {
        colorLog('🛑 Bailing out due to test failure', 'red');
        break;
      }
    }
    
    console.log('');
    const allPassed = generateReport(results);
    
    // Exit with appropriate code
    process.exit(allPassed ? 0 : 1);
    
  } catch (error) {
    console.error('');
    colorLog('💥 Fatal error running regression tests:', 'red');
    console.error(error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('');
  colorLog('⚠️  Test run interrupted by user', 'yellow');
  process.exit(1);
});

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  runRegressionTests: main,
  REGRESSION_TESTS,
  CONFIG
};