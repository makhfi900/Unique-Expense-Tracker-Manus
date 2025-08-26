#!/usr/bin/env node

/**
 * ML Categorization CLI Utility
 * Command-line interface for intelligent expense categorization
 */

const { IntelligentCategorizationEngine } = require('./ml-categorization-engine');
const { MLCategorizationTester } = require('./test-ml-categorization');

class CategorizationCLI {
  constructor() {
    this.engine = new IntelligentCategorizationEngine();
  }

  async initialize() {
    await this.engine.initialize();
  }

  printUsage() {
    console.log('\n🧠 ML Categorization CLI - Pakistani Context-Aware Expense Categorization');
    console.log('========================================================================\n');
    console.log('Usage: node categorization-cli.js <command> [options]\n');
    console.log('Commands:');
    console.log('  test                           - Run comprehensive test suite');
    console.log('  analyze [confidence] [limit]   - Analyze expenses for recategorization');
    console.log('  apply <confidence> [limit]     - Apply recategorization with min confidence');
    console.log('  single <description> [amount]  - Test single expense categorization');
    console.log('  report [limit]                 - Generate categorization accuracy report');
    console.log('  bulk-demo                      - Run bulk operation demonstration');
    console.log('  patterns                       - Show categorization patterns');
    console.log('  stats                          - Show system statistics');
    console.log('\nExamples:');
    console.log('  node categorization-cli.js test');
    console.log('  node categorization-cli.js analyze 0.8 100');
    console.log('  node categorization-cli.js apply 0.85 500');
    console.log('  node categorization-cli.js single "BP SABIR DIGITAL OFFICE SUPPLY" 5000');
    console.log('  node categorization-cli.js report 20');
    console.log('\nNote: Apply commands will make permanent changes to the database.');
    console.log('      Always run analyze first to preview changes.\n');
  }

  async runTest() {
    console.log('🧪 Running comprehensive ML categorization tests...\n');
    const tester = new MLCategorizationTester();
    await tester.initialize();
    tester.runAllTests();
    const results = tester.generateReport();
    await tester.testBulkOperations();
    
    const successRate = results.passed / results.total;
    console.log(`\n📊 Overall Test Success Rate: ${(successRate * 100).toFixed(1)}%`);
    
    if (successRate >= 0.8) {
      console.log('✅ System performing excellently!');
    } else if (successRate >= 0.6) {
      console.log('⚠️  System needs some improvements.');
    } else {
      console.log('❌ System requires significant improvements.');
    }
    
    return results;
  }

  async runAnalyze(confidence = 0.7, limit = 100) {
    console.log(`🔍 Analyzing expenses with confidence >= ${confidence} (limit: ${limit})...\n`);
    
    const results = await this.engine.bulkRecategorizeExpenses({
      minConfidence: parseFloat(confidence),
      dryRun: true,
      limit: parseInt(limit)
    });

    console.log('📊 ANALYSIS RESULTS:');
    console.log(`   Processed: ${results.processedCount} expenses`);
    console.log(`   High confidence suggestions: ${results.highConfidenceCount}`);
    console.log(`   Average confidence: ${(results.averageConfidence * 100).toFixed(1)}%`);
    
    if (results.suggestions.length > 0) {
      console.log('\n🎯 TOP SUGGESTIONS:');
      results.suggestions.slice(0, 10).forEach((suggestion, index) => {
        console.log(`${index + 1}. $${suggestion.expense.amount} "${suggestion.expense.description.substring(0, 40)}..."`);
        console.log(`   → ${suggestion.suggestedCategoryName} (${(suggestion.confidence * 100).toFixed(1)}%)`);
        console.log(`   Reason: ${suggestion.reasoning}\n`);
      });
    }

    console.log(`\n💡 To apply these changes, run:`);
    console.log(`   node categorization-cli.js apply ${confidence} ${limit}`);
    
    return results;
  }

  async runApply(confidence, limit = 500) {
    if (!confidence) {
      console.log('❌ Error: Confidence threshold is required for apply command.');
      console.log('   Usage: node categorization-cli.js apply <confidence> [limit]');
      console.log('   Example: node categorization-cli.js apply 0.8 100');
      return;
    }

    const conf = parseFloat(confidence);
    if (conf < 0.7) {
      console.log('⚠️  Warning: Confidence below 0.7 may result in inaccurate categorizations.');
      console.log('   Recommended minimum: 0.75');
    }

    console.log(`⚡ Applying recategorization with confidence >= ${conf} (max ${limit} updates)...\n`);
    console.log('⚠️  This will make permanent changes to your database.');
    
    // Simple confirmation in CLI
    console.log('Press Ctrl+C within 5 seconds to cancel...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    const results = await this.engine.bulkRecategorizeExpenses({
      minConfidence: conf,
      dryRun: false,
      limit: parseInt(limit)
    });

    console.log('\n✅ RECATEGORIZATION COMPLETED:');
    console.log(`   Total processed: ${results.processedCount}`);
    console.log(`   Successfully updated: ${results.highConfidenceCount} expenses`);
    console.log(`   Average confidence: ${(results.averageConfidence * 100).toFixed(1)}%`);
    
    return results;
  }

  async runSingle(description, amount = 1000) {
    if (!description) {
      console.log('❌ Error: Description is required for single command.');
      console.log('   Usage: node categorization-cli.js single "<description>" [amount]');
      return;
    }

    console.log(`🔍 Testing categorization for: "${description}" (Rs. ${amount})\n`);
    
    const result = this.engine.intelligentCategorization(description, '', parseFloat(amount));
    
    console.log('🎯 CATEGORIZATION RESULT:');
    console.log(`   Category: ${result.categoryName}`);
    console.log(`   Confidence: ${(result.confidence * 100).toFixed(1)}%`);
    console.log(`   Reasoning: ${result.reasoning}`);
    
    if (result.matchedKeywords && result.matchedKeywords.length > 0) {
      console.log(`   Matched Keywords: ${result.matchedKeywords.join(', ')}`);
    }
    
    if (result.matchedUrduPatterns && result.matchedUrduPatterns.length > 0) {
      console.log(`   Matched Urdu Patterns: ${result.matchedUrduPatterns.join(', ')}`);
    }

    console.log(`\n💡 Confidence Level: ${this.getConfidenceLevel(result.confidence)}`);
    
    return result;
  }

  async runReport(limit = 20) {
    console.log(`📋 Generating categorization accuracy report (limit: ${limit})...\n`);
    
    const report = await this.engine.generateCategorizationReport(null);
    const limitedReport = report.slice(0, parseInt(limit));
    
    console.log('📊 CATEGORIZATION ACCURACY REPORT:');
    console.log('===================================\n');
    
    const correct = limitedReport.filter(item => item.isCorrect).length;
    const accuracy = (correct / limitedReport.length * 100).toFixed(1);
    
    console.log(`Overall Accuracy: ${correct}/${limitedReport.length} (${accuracy}%)`);
    console.log(`Average Confidence: ${(limitedReport.reduce((sum, item) => sum + item.confidence, 0) / limitedReport.length * 100).toFixed(1)}%\n`);
    
    console.log('Recent Expense Analysis:');
    console.log('------------------------');
    
    limitedReport.forEach((item, index) => {
      const status = item.isCorrect ? '✅' : '❌';
      const confidence = `${(item.confidence * 100).toFixed(1)}%`;
      
      console.log(`${index + 1}. ${status} $${item.amount} - "${item.description.substring(0, 40)}..."`);
      console.log(`   Current: ${item.currentCategory} | Suggested: ${item.suggestedCategory} (${confidence})`);
      
      if (!item.isCorrect) {
        console.log(`   💡 ${item.reasoning}`);
      }
      
      console.log('');
    });
    
    return limitedReport;
  }

  async runBulkDemo() {
    console.log('🚀 Running bulk operations demonstration...\n');
    
    // Demo analysis
    console.log('1️⃣ DEMO ANALYSIS (Dry Run):');
    const analysis = await this.runAnalyze(0.8, 50);
    
    console.log('\n2️⃣ DEMO SINGLE CATEGORIZATION:');
    await this.runSingle('BP SABIR DIGITAL OFFICE SUPPLIES', 3500);
    
    console.log('\n3️⃣ DEMO ACCURACY REPORT:');
    await this.runReport(10);
    
    console.log('\n🎉 Bulk operations demo completed!');
    console.log('💡 To apply real changes, use: node categorization-cli.js apply 0.8 100');
    
    return { analysis };
  }

  showPatterns() {
    console.log('🎯 PAKISTANI CATEGORIZATION PATTERNS');
    console.log('====================================\n');
    
    const patterns = {
      'Office Supplies': ['stationary', 'register', 'file', 'marker', 'almari', 'desk'],
      'Technology': ['cctv', 'digital', 'computer', 'internet', 'mobile'],
      'Utilities': ['electricity', 'bijli', 'gas', 'wapda', 'ptcl'],
      'Transportation': ['rickshaw', 'petrol', 'taxi', 'travel'],
      'Salaries': ['salary', 'tankhwah', 'employee', 'staff'],
      'Maintenance & Repairs': ['mistri', 'mazdoor', 'cement', 'hardware', 'repair'],
      'Marketing': ['marketing', 'photo', 'advertising', 'publicity'],
      'Food & Dining': ['chai', 'food', 'khana', 'restaurant']
    };

    Object.entries(patterns).forEach(([category, keywords]) => {
      console.log(`${category}:`);
      console.log(`  Keywords: ${keywords.join(', ')}`);
      console.log('');
    });

    console.log('🌍 URDU SUPPORT:');
    console.log('Supports mixed Urdu/English text including:');
    console.log('تنخواہ (salary), بجلی (electricity), کمپیوٹر (computer), مستری (mistri), رکشہ (rickshaw)');
    console.log('');
  }

  async showStats() {
    console.log('📈 SYSTEM STATISTICS');
    console.log('===================\n');
    
    const patterns = Object.keys({
      'Office Supplies': 1, 'Technology': 1, 'Utilities': 1, 'Transportation': 1,
      'Salaries': 1, 'Maintenance & Repairs': 1, 'Marketing': 1, 'Food & Dining': 1,
      'Professional Services': 1, 'Employee Benefits': 1, 'Travel': 1
    });
    
    console.log(`Supported Categories: ${patterns.length}`);
    console.log(`Pattern Recognition: Rule-based + Historical Learning`);
    console.log(`Language Support: English + Urdu`);
    console.log(`Confidence Scoring: Advanced multi-factor algorithm`);
    console.log(`Bulk Operations: Supported with safety limits`);
    console.log(`Pakistani Context: Specialized for local business terms`);
    console.log('');
    
    // Get engine statistics
    console.log('Engine Statistics:');
    console.log(`- Categories loaded: ${Object.keys(this.engine.categoryMap || {}).length}`);
    console.log(`- Historical patterns: ${Object.keys(this.engine.learningPatterns || {}).length}`);
    console.log(`- Expense history: ${(this.engine.expenseHistory || []).length} records`);
    console.log('');
  }

  getConfidenceLevel(confidence) {
    if (confidence >= 0.9) return 'Excellent (Very reliable)';
    if (confidence >= 0.8) return 'High (Reliable)';
    if (confidence >= 0.7) return 'Good (Generally reliable)';
    if (confidence >= 0.6) return 'Medium (Review recommended)';
    if (confidence >= 0.4) return 'Low (Manual review needed)';
    return 'Very Low (Likely incorrect)';
  }
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === 'help' || command === '--help' || command === '-h') {
    const cli = new CategorizationCLI();
    cli.printUsage();
    return;
  }

  const cli = new CategorizationCLI();
  
  try {
    console.log('🔄 Initializing ML Categorization Engine...');
    await cli.initialize();
    console.log('✅ Engine ready!\n');

    switch (command) {
      case 'test':
        await cli.runTest();
        break;
        
      case 'analyze':
        await cli.runAnalyze(args[1], args[2]);
        break;
        
      case 'apply':
        await cli.runApply(args[1], args[2]);
        break;
        
      case 'single':
        await cli.runSingle(args[1], args[2]);
        break;
        
      case 'report':
        await cli.runReport(args[1]);
        break;
        
      case 'bulk-demo':
        await cli.runBulkDemo();
        break;
        
      case 'patterns':
        cli.showPatterns();
        break;
        
      case 'stats':
        await cli.showStats();
        break;
        
      default:
        console.log(`❌ Unknown command: ${command}`);
        cli.printUsage();
        process.exit(1);
    }
    
  } catch (error) {
    console.error(`💥 Error: ${error.message}`);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { CategorizationCLI };