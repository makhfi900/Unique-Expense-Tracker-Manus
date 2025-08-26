#!/usr/bin/env node

/**
 * Test Script for ML-based Expense Categorization System
 * Tests Pakistani context awareness and confidence scoring
 */

const { IntelligentCategorizationEngine } = require('./ml-categorization-engine');

// Test cases with Pakistani business context
const TEST_CASES = [
  {
    description: 'BP SABIR DIGITAL OFFICE SUPPLY',
    notes: 'STATIONARY ITEMS',
    amount: 5000,
    expectedCategory: 'Office Supplies',
    minConfidence: 0.8
  },
  {
    description: 'BP ABID CCTV BILLS',
    notes: 'SECURITY CAMERA MAINTENANCE',
    amount: 15000,
    expectedCategory: 'Technology',
    minConfidence: 0.8
  },
  {
    description: 'BP MUHAMMAD QURESH ELECTRICITY',
    notes: 'MONTHLY ELECTRICITY BILL',
    amount: 8000,
    expectedCategory: 'Utilities',
    minConfidence: 0.9
  },
  {
    description: 'BP SOBIA PARVEEN SALARY',
    notes: 'STAFF MONTHLY SALARY',
    amount: 25000,
    expectedCategory: 'Salaries',
    minConfidence: 0.9
  },
  {
    description: 'BP RAZZAQ HARDWARE STORE',
    notes: 'REPAIR AND MAINTENANCE ITEMS',
    amount: 12000,
    expectedCategory: 'Maintenance & Repairs',
    minConfidence: 0.8
  },
  {
    description: 'BP RIKSHA RENT',
    notes: 'TRANSPORTATION EXPENSE',
    amount: 500,
    expectedCategory: 'Transportation',
    minConfidence: 0.8
  },
  {
    description: 'BP HAJI SHAIB MARKETING',
    notes: 'PUBLICITY AND ADVERTISING',
    amount: 3000,
    expectedCategory: 'Marketing',
    minConfidence: 0.8
  },
  {
    description: 'BP CHAI PANI',
    notes: 'REFRESHMENT FOR OFFICE',
    amount: 800,
    expectedCategory: 'Food & Dining',
    minConfidence: 0.7
  },
  {
    description: 'EOBI VOUCHER PAYMENT',
    notes: 'EMPLOYEE BENEFITS TAX',
    amount: 45000,
    expectedCategory: 'Employee Benefits',
    minConfidence: 0.8
  },
  {
    description: 'UNKNOWN EXPENSE ITEM',
    notes: 'NO CLEAR DESCRIPTION',
    amount: 1000,
    expectedCategory: 'Miscellaneous',
    minConfidence: 0.1
  }
];

// Urdu/English mixed text test cases
const URDU_TEST_CASES = [
  {
    description: 'BP کمپیوٹر REPAIR',
    notes: 'COMPUTER سے مسئلہ',
    amount: 8000,
    expectedCategory: 'Technology',
    minConfidence: 0.7
  },
  {
    description: 'BP تنخواہ PAYMENT',
    notes: 'ملازم کی اجرت',
    amount: 20000,
    expectedCategory: 'Salaries',
    minConfidence: 0.8
  },
  {
    description: 'BP بجلی BILL',
    notes: 'MONTHLY ELECTRICITY',
    amount: 6000,
    expectedCategory: 'Utilities',
    minConfidence: 0.8
  }
];

class MLCategorizationTester {
  constructor() {
    this.engine = new IntelligentCategorizationEngine();
    this.testResults = {
      total: 0,
      passed: 0,
      failed: 0,
      categoryMatches: 0,
      confidenceMatches: 0,
      details: []
    };
  }

  async initialize() {
    console.log('🚀 INITIALIZING ML CATEGORIZATION ENGINE...\n');
    await this.engine.initialize();
    console.log('✅ Engine initialized successfully!\n');
  }

  runSingleTest(testCase, testType = 'Standard') {
    const result = this.engine.intelligentCategorization(
      testCase.description,
      testCase.notes || '',
      testCase.amount
    );

    const categoryMatch = result.categoryName === testCase.expectedCategory;
    const confidenceMatch = result.confidence >= testCase.minConfidence;
    const testPassed = categoryMatch && confidenceMatch;

    const testResult = {
      testType,
      description: testCase.description,
      amount: testCase.amount,
      expected: {
        category: testCase.expectedCategory,
        minConfidence: testCase.minConfidence
      },
      actual: {
        category: result.categoryName,
        confidence: result.confidence,
        reasoning: result.reasoning
      },
      categoryMatch,
      confidenceMatch,
      passed: testPassed,
      matchedKeywords: result.matchedKeywords || [],
      matchedUrduPatterns: result.matchedUrduPatterns || []
    };

    this.testResults.total++;
    if (testPassed) {
      this.testResults.passed++;
    } else {
      this.testResults.failed++;
    }

    if (categoryMatch) {
      this.testResults.categoryMatches++;
    }

    if (confidenceMatch) {
      this.testResults.confidenceMatches++;
    }

    this.testResults.details.push(testResult);

    return testResult;
  }

  runAllTests() {
    console.log('🧪 RUNNING STANDARD CATEGORIZATION TESTS...\n');
    
    TEST_CASES.forEach((testCase, index) => {
      console.log(`Test ${index + 1}: ${testCase.description}`);
      const result = this.runSingleTest(testCase, 'Standard');
      
      if (result.passed) {
        console.log(`✅ PASSED - ${result.actual.category} (${(result.actual.confidence * 100).toFixed(1)}%)`);
      } else {
        console.log(`❌ FAILED - Expected: ${result.expected.category}, Got: ${result.actual.category} (${(result.actual.confidence * 100).toFixed(1)}%)`);
      }
      
      if (result.matchedKeywords.length > 0) {
        console.log(`   🔍 Keywords: ${result.matchedKeywords.join(', ')}`);
      }
      
      console.log(`   📝 Reasoning: ${result.actual.reasoning}\n`);
    });

    console.log('🌏 RUNNING URDU/ENGLISH MIXED TEXT TESTS...\n');
    
    URDU_TEST_CASES.forEach((testCase, index) => {
      console.log(`Urdu Test ${index + 1}: ${testCase.description}`);
      const result = this.runSingleTest(testCase, 'Urdu/English');
      
      if (result.passed) {
        console.log(`✅ PASSED - ${result.actual.category} (${(result.actual.confidence * 100).toFixed(1)}%)`);
      } else {
        console.log(`❌ FAILED - Expected: ${result.expected.category}, Got: ${result.actual.category} (${(result.actual.confidence * 100).toFixed(1)}%)`);
      }
      
      if (result.matchedUrduPatterns.length > 0) {
        console.log(`   🔍 Urdu Patterns: ${result.matchedUrduPatterns.join(', ')}`);
      }
      
      console.log(`   📝 Reasoning: ${result.actual.reasoning}\n`);
    });
  }

  generateReport() {
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('========================\n');
    
    console.log(`Total Tests: ${this.testResults.total}`);
    console.log(`Passed: ${this.testResults.passed} (${(this.testResults.passed / this.testResults.total * 100).toFixed(1)}%)`);
    console.log(`Failed: ${this.testResults.failed} (${(this.testResults.failed / this.testResults.total * 100).toFixed(1)}%)`);
    console.log(`Category Accuracy: ${this.testResults.categoryMatches}/${this.testResults.total} (${(this.testResults.categoryMatches / this.testResults.total * 100).toFixed(1)}%)`);
    console.log(`Confidence Accuracy: ${this.testResults.confidenceMatches}/${this.testResults.total} (${(this.testResults.confidenceMatches / this.testResults.total * 100).toFixed(1)}%)`);

    console.log('\n📈 DETAILED PERFORMANCE BY CATEGORY:');
    console.log('====================================\n');
    
    const categoryPerformance = {};
    this.testResults.details.forEach(result => {
      const expected = result.expected.category;
      if (!categoryPerformance[expected]) {
        categoryPerformance[expected] = {
          total: 0,
          correct: 0,
          avgConfidence: 0,
          confidenceSum: 0
        };
      }
      
      categoryPerformance[expected].total++;
      categoryPerformance[expected].confidenceSum += result.actual.confidence;
      
      if (result.categoryMatch) {
        categoryPerformance[expected].correct++;
      }
    });

    Object.entries(categoryPerformance).forEach(([category, stats]) => {
      const accuracy = (stats.correct / stats.total * 100).toFixed(1);
      const avgConfidence = (stats.confidenceSum / stats.total * 100).toFixed(1);
      console.log(`${category}: ${stats.correct}/${stats.total} (${accuracy}%) - Avg Confidence: ${avgConfidence}%`);
    });

    console.log('\n❌ FAILED TESTS ANALYSIS:');
    console.log('=========================\n');
    
    const failedTests = this.testResults.details.filter(result => !result.passed);
    if (failedTests.length === 0) {
      console.log('🎉 All tests passed!');
    } else {
      failedTests.forEach((result, index) => {
        console.log(`${index + 1}. "${result.description}"`);
        console.log(`   Expected: ${result.expected.category} (>= ${result.expected.minConfidence})`);
        console.log(`   Got: ${result.actual.category} (${result.actual.confidence.toFixed(3)})`);
        console.log(`   Issue: ${!result.categoryMatch ? 'Wrong Category' : 'Low Confidence'}`);
        console.log('');
      });
    }

    return this.testResults;
  }

  async testBulkOperations() {
    console.log('🔄 TESTING BULK OPERATIONS...\n');
    
    try {
      // Test analysis mode (dry run)
      console.log('Testing bulk analysis...');
      const analysisResult = await this.engine.bulkRecategorizeExpenses({
        minConfidence: 0.8,
        dryRun: true,
        limit: 10
      });
      
      console.log(`✅ Analysis completed:`);
      console.log(`   Processed: ${analysisResult.processedCount}`);
      console.log(`   High confidence suggestions: ${analysisResult.highConfidenceCount}`);
      console.log(`   Average confidence: ${(analysisResult.averageConfidence * 100).toFixed(1)}%`);
      
      return true;
    } catch (error) {
      console.log(`❌ Bulk operations test failed: ${error.message}`);
      return false;
    }
  }
}

async function runTests() {
  const tester = new MLCategorizationTester();
  
  try {
    await tester.initialize();
    
    // Run categorization tests
    tester.runAllTests();
    
    // Generate comprehensive report
    const results = tester.generateReport();
    
    // Test bulk operations
    await tester.testBulkOperations();
    
    console.log('\n🏁 TESTING COMPLETED!');
    console.log(`Overall Success Rate: ${(results.passed / results.total * 100).toFixed(1)}%`);
    
    // Exit with appropriate code
    const successRate = results.passed / results.total;
    if (successRate >= 0.8) {
      console.log('🎉 Tests passed with excellent performance!');
      process.exit(0);
    } else if (successRate >= 0.6) {
      console.log('⚠️  Tests passed with acceptable performance, but improvements needed.');
      process.exit(0);
    } else {
      console.log('❌ Tests failed - significant improvements needed.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('💥 Test execution failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  runTests();
}

module.exports = { MLCategorizationTester };