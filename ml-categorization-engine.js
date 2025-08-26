#!/usr/bin/env node

/**
 * Intelligent ML-based Expense Recategorization Engine
 * Pakistani Context-Aware with Advanced Pattern Matching
 * Features: Confidence scoring, Urdu/English mixed text, bulk operations
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const csvParser = require('csv-parser');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Enhanced Pakistani business context with confidence weights
const PAKISTANI_CATEGORIZATION_PATTERNS = {
  'Office Supplies': {
    keywords: [
      'stationary', 'stationery', 'office supply', 'sabir digital', 'register', 'file', 'tape', 
      'marker', 'paint marker', 'attendance register', 'al qasim', 'safai', 'cleaning', 
      'chemical', 'almari', 'safe', 'desk', 'furniture', 'blub', 'bulb', 'lock', 'pencil'
    ],
    urduPatterns: ['قلم', 'کاپی', 'فائل', 'الماری', 'میز'],
    amountRanges: [{ min: 100, max: 50000, weight: 0.8 }],
    confidence: 0.85
  },
  'Technology': {
    keywords: [
      'cctv', 'camera', 'digital', 'abid cctv', 'bills', 'tech', 'computer', 'software', 
      'internet', 'wifi', 'mobile', 'phone', 'electronic', 'ptcl', 'internet charges'
    ],
    urduPatterns: ['کمپیوٹر', 'موبائل', 'انٹرنیٹ'],
    amountRanges: [{ min: 1000, max: 100000, weight: 0.9 }],
    confidence: 0.9
  },
  'Maintenance & Repairs': {
    keywords: [
      'repair', 'mistri', 'mazdoor', 'cement', 'bori', 'hardware', 'razzaq hardware', 
      'iron', 'airn', 'maintenance', 'fixing', 'construction', 'building', 'plumber', 
      'electrician', 'painter', 'sanitary', 'maqbool airn'
    ],
    urduPatterns: ['مستری', 'مزدور', 'سیمنٹ', 'لوہا', 'تعمیر'],
    amountRanges: [{ min: 500, max: 200000, weight: 0.85 }],
    confidence: 0.88
  },
  'Utilities': {
    keywords: [
      'electricity', 'bijli', 'muhammad quresh', 'electric', 'power', 'gas', 'water', 
      'utility', 'wapda', 'sui gas', 'ptcl', 'phone bill'
    ],
    urduPatterns: ['بجلی', 'گیس', 'پانی', 'واپڈا'],
    amountRanges: [{ min: 1000, max: 50000, weight: 0.9 }],
    confidence: 0.92
  },
  'Transportation': {
    keywords: [
      'transport', 'trali', 'rickshaw', 'taxi', 'fuel', 'petrol', 'diesel', 'travel', 
      'vehicle', 'car', 'bus', 'train', 'fare', 'ticket', 'riksha rent'
    ],
    urduPatterns: ['رکشہ', 'پٹرول', 'ڈیزل', 'ٹیکسی', 'بس'],
    amountRanges: [{ min: 50, max: 10000, weight: 0.8 }],
    confidence: 0.85
  },
  'Marketing': {
    keywords: [
      'marketing', 'publicity', 'photo', 'photography', 'gratphy', 'taqseem inam', 
      'advertising', 'banner', 'poster', 'printing', 'design', 'haji shaib'
    ],
    urduPatterns: ['تقسیم انعام', 'تشہیر', 'فوٹو'],
    amountRanges: [{ min: 500, max: 25000, weight: 0.8 }],
    confidence: 0.8
  },
  'Food & Dining': {
    keywords: [
      'food', 'khana', 'chai', 'tea', 'coffee', 'restaurant', 'hotel', 'catering', 
      'refreshment', 'lunch', 'dinner', 'breakfast', 'snacks', 'misala ghr'
    ],
    urduPatterns: ['کھانا', 'چائے', 'ناشتہ', 'کھانے'],
    amountRanges: [{ min: 100, max: 15000, weight: 0.8 }],
    confidence: 0.82
  },
  'Professional Services': {
    keywords: [
      'lawyer', 'wakeel', 'consultant', 'audit', 'ca', 'chartered accountant', 'legal', 
      'court', 'advocate', 'notary'
    ],
    urduPatterns: ['وکیل', 'قانونی', 'عدالت'],
    amountRanges: [{ min: 5000, max: 100000, weight: 0.9 }],
    confidence: 0.9
  },
  'Salaries': {
    keywords: [
      'salary', 'tankhwah', 'wages', 'maash', 'employee', 'staff', 'worker', 'allowance',
      'sobia parveen', 'adeeba', 'sofia', 'samra', 'haiqa', 'fahmida', 'saba tariq',
      'tehmina', 'aiman', 'ali moavia', 'asif', 'abu bakar', 'aqib', 'maha', 'ashiq'
    ],
    urduPatterns: ['تنخواہ', 'ملازم', 'اجرت'],
    amountRanges: [{ min: 8000, max: 50000, weight: 0.95 }],
    confidence: 0.95
  },
  'Employee Benefits': {
    keywords: ['eobi', 'voucher', 'tax', 'benefits', 'provident fund', 'insurance'],
    urduPatterns: ['ای او بی آئی', 'ٹیکس'],
    amountRanges: [{ min: 10000, max: 100000, weight: 0.9 }],
    confidence: 0.9
  },
  'Travel': {
    keywords: ['board', 'sahiwal', 'travel', 'trip', 'visit', 'tour'],
    urduPatterns: ['سفر', 'سیر'],
    amountRanges: [{ min: 500, max: 20000, weight: 0.8 }],
    confidence: 0.8
  }
};

class IntelligentCategorizationEngine {
  constructor() {
    this.categoryMap = {};
    this.expenseHistory = [];
    this.learningPatterns = {};
  }

  async initialize() {
    // Load database categories
    const { data: dbCategories } = await supabase
      .from('categories')
      .select('id, name');
    
    this.categoryMap = {};
    dbCategories.forEach(cat => {
      this.categoryMap[cat.name] = cat.id;
    });

    // Load historical expense patterns for learning
    await this.loadExpenseHistory();
    console.log(`🧠 Categorization engine initialized with ${dbCategories.length} categories`);
  }

  async loadExpenseHistory() {
    const { data: expenses } = await supabase
      .from('expenses')
      .select(`
        id, amount, description, notes, category_id,
        categories!inner(name)
      `)
      .eq('is_active', true)
      .limit(1000);

    this.expenseHistory = expenses || [];
    this.buildLearningPatterns();
  }

  buildLearningPatterns() {
    // Build patterns from historical data
    this.learningPatterns = {};
    
    this.expenseHistory.forEach(expense => {
      const categoryName = expense.categories.name;
      if (!this.learningPatterns[categoryName]) {
        this.learningPatterns[categoryName] = {
          descriptions: [],
          amountRanges: [],
          commonWords: new Map()
        };
      }

      // Store descriptions and extract common words
      this.learningPatterns[categoryName].descriptions.push(expense.description);
      this.learningPatterns[categoryName].amountRanges.push(expense.amount);
      
      // Extract words for frequency analysis
      const words = this.extractWords(expense.description);
      words.forEach(word => {
        const current = this.learningPatterns[categoryName].commonWords.get(word) || 0;
        this.learningPatterns[categoryName].commonWords.set(word, current + 1);
      });
    });
  }

  extractWords(text) {
    // Handle mixed Urdu/English text
    return text.toLowerCase()
      .replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFFa-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2);
  }

  calculateTextSimilarity(text1, text2) {
    const words1 = new Set(this.extractWords(text1));
    const words2 = new Set(this.extractWords(text2));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size; // Jaccard similarity
  }

  calculateAmountWeight(amount, ranges) {
    let maxWeight = 0;
    ranges.forEach(range => {
      if (amount >= range.min && amount <= range.max) {
        maxWeight = Math.max(maxWeight, range.weight);
      }
    });
    return maxWeight;
  }

  intelligentCategorization(description, notes = '', amount = 0) {
    const text = `${description} ${notes}`.toLowerCase();
    const results = [];

    // Rule-based categorization with confidence scoring
    for (const [categoryName, pattern] of Object.entries(PAKISTANI_CATEGORIZATION_PATTERNS)) {
      if (!this.categoryMap[categoryName]) continue;

      let score = 0;
      let matchedKeywords = [];
      let matchedUrduPatterns = [];

      // Keyword matching
      pattern.keywords.forEach(keyword => {
        if (text.includes(keyword.toLowerCase())) {
          score += 1.0;
          matchedKeywords.push(keyword);
        }
      });

      // Urdu pattern matching
      pattern.urduPatterns.forEach(urduPattern => {
        if (text.includes(urduPattern)) {
          score += 1.2; // Higher weight for Urdu matches
          matchedUrduPatterns.push(urduPattern);
        }
      });

      // Amount-based scoring
      if (pattern.amountRanges && amount > 0) {
        const amountWeight = this.calculateAmountWeight(amount, pattern.amountRanges);
        score += amountWeight;
      }

      // Historical pattern matching
      if (this.learningPatterns[categoryName]) {
        const historicalSimilarity = this.calculateHistoricalSimilarity(
          description, categoryName
        );
        score += historicalSimilarity * 0.5;
      }

      if (score > 0) {
        const confidence = Math.min(score * pattern.confidence / 2, 0.95);
        results.push({
          categoryId: this.categoryMap[categoryName],
          categoryName,
          confidence,
          score,
          matchedKeywords,
          matchedUrduPatterns,
          reasoning: this.generateReasoning(matchedKeywords, matchedUrduPatterns, score)
        });
      }
    }

    // Sort by confidence and return top result
    results.sort((a, b) => b.confidence - a.confidence);
    return results.length > 0 ? results[0] : {
      categoryId: this.categoryMap['Miscellaneous'],
      categoryName: 'Miscellaneous',
      confidence: 0.1,
      score: 0,
      matchedKeywords: [],
      matchedUrduPatterns: [],
      reasoning: 'No clear pattern matched, categorized as miscellaneous'
    };
  }

  calculateHistoricalSimilarity(description, categoryName) {
    if (!this.learningPatterns[categoryName]) return 0;

    const patterns = this.learningPatterns[categoryName];
    let maxSimilarity = 0;

    patterns.descriptions.forEach(historicalDesc => {
      const similarity = this.calculateTextSimilarity(description, historicalDesc);
      maxSimilarity = Math.max(maxSimilarity, similarity);
    });

    return maxSimilarity;
  }

  generateReasoning(keywords, urduPatterns, score) {
    const reasons = [];
    if (keywords.length > 0) {
      reasons.push(`Matched keywords: ${keywords.slice(0, 3).join(', ')}`);
    }
    if (urduPatterns.length > 0) {
      reasons.push(`Matched Urdu patterns: ${urduPatterns.join(', ')}`);
    }
    reasons.push(`Confidence score: ${score.toFixed(2)}`);
    return reasons.join('; ');
  }

  async bulkRecategorizeExpenses(options = {}) {
    const {
      minConfidence = 0.7,
      dryRun = false,
      categoryFilter = null,
      dateRange = null,
      limit = null
    } = options;

    console.log('🔄 Starting bulk recategorization...');
    console.log(`   Min confidence: ${minConfidence}`);
    console.log(`   Dry run: ${dryRun}`);

    let query = supabase
      .from('expenses')
      .select('id, amount, description, notes, expense_date, category_id')
      .eq('is_active', true)
      .order('created_at');

    if (categoryFilter) {
      query = query.eq('category_id', this.categoryMap[categoryFilter]);
    }

    if (dateRange) {
      query = query.gte('expense_date', dateRange.start)
                  .lte('expense_date', dateRange.end);
    }

    if (limit) {
      query = query.limit(limit);
    }

    const { data: expenses } = await query;
    console.log(`   Processing ${expenses.length} expenses...`);

    const suggestions = [];
    let processedCount = 0;
    let highConfidenceCount = 0;

    for (const expense of expenses) {
      const suggestion = this.intelligentCategorization(
        expense.description,
        expense.notes || '',
        parseFloat(expense.amount)
      );

      if (suggestion.confidence >= minConfidence && 
          suggestion.categoryId !== expense.category_id) {
        suggestions.push({
          expenseId: expense.id,
          currentCategoryId: expense.category_id,
          suggestedCategoryId: suggestion.categoryId,
          suggestedCategoryName: suggestion.categoryName,
          confidence: suggestion.confidence,
          reasoning: suggestion.reasoning,
          expense: expense
        });
        highConfidenceCount++;
      }

      processedCount++;
      if (processedCount % 100 === 0) {
        console.log(`   Processed: ${processedCount}/${expenses.length}`);
      }
    }

    console.log(`\n📊 Recategorization Analysis:`);
    console.log(`   Total expenses processed: ${processedCount}`);
    console.log(`   High confidence suggestions: ${highConfidenceCount}`);
    console.log(`   Average confidence: ${(suggestions.reduce((sum, s) => sum + s.confidence, 0) / suggestions.length || 0).toFixed(3)}`);

    if (!dryRun && suggestions.length > 0) {
      console.log('\n🔄 Applying high-confidence recategorizations...');
      let updateCount = 0;

      for (const suggestion of suggestions) {
        try {
          const { error } = await supabase
            .from('expenses')
            .update({ category_id: suggestion.suggestedCategoryId })
            .eq('id', suggestion.expenseId);

          if (!error) {
            updateCount++;
            if (updateCount <= 10) {
              console.log(`   ✅ $${suggestion.expense.amount} "${suggestion.expense.description.substring(0, 40)}..." → ${suggestion.suggestedCategoryName} (${(suggestion.confidence * 100).toFixed(1)}%)`);
            }
          }
        } catch (err) {
          console.warn(`   ⚠️  Failed to update expense ${suggestion.expenseId}: ${err.message}`);
        }
      }

      console.log(`\n✅ Updated ${updateCount} expenses successfully!`);
    }

    return {
      processedCount,
      suggestions: suggestions.slice(0, 50), // Return top 50 suggestions for review
      highConfidenceCount,
      averageConfidence: suggestions.reduce((sum, s) => sum + s.confidence, 0) / suggestions.length || 0
    };
  }

  async generateCategorizationReport(expenseId = null) {
    let query = supabase
      .from('expenses')
      .select(`
        id, amount, description, notes, expense_date, category_id,
        categories!inner(name)
      `)
      .eq('is_active', true);

    if (expenseId) {
      query = query.eq('id', expenseId);
    } else {
      query = query.limit(20).order('created_at', { ascending: false });
    }

    const { data: expenses } = await query;
    const report = [];

    for (const expense of expenses) {
      const suggestion = this.intelligentCategorization(
        expense.description,
        expense.notes || '',
        parseFloat(expense.amount)
      );

      const currentCategoryName = expense.categories.name;
      const isCorrectlyClassified = suggestion.categoryName === currentCategoryName;

      report.push({
        expenseId: expense.id,
        description: expense.description,
        amount: expense.amount,
        currentCategory: currentCategoryName,
        suggestedCategory: suggestion.categoryName,
        confidence: suggestion.confidence,
        isCorrect: isCorrectlyClassified,
        reasoning: suggestion.reasoning
      });
    }

    return report;
  }
}

// CLI interface
async function runIntelligentCategorization() {
  console.log('🚀 INTELLIGENT EXPENSE CATEGORIZATION ENGINE');
  console.log('============================================\n');

  const engine = new IntelligentCategorizationEngine();
  await engine.initialize();

  const args = process.argv.slice(2);
  const command = args[0] || 'bulk';

  switch (command) {
    case 'bulk':
      const options = {
        minConfidence: parseFloat(args[1]) || 0.7,
        dryRun: args.includes('--dry-run'),
        limit: args.includes('--limit') ? parseInt(args[args.indexOf('--limit') + 1]) : null
      };
      await engine.bulkRecategorizeExpenses(options);
      break;

    case 'report':
      const expenseId = args[1] ? parseInt(args[1]) : null;
      const report = await engine.generateCategorizationReport(expenseId);
      console.log('\n📋 CATEGORIZATION REPORT:');
      console.table(report);
      break;

    case 'test':
      const testDescription = args[1] || 'BP SABIR DIGITAL OFFICE SUPPLY';
      const testAmount = parseFloat(args[2]) || 5000;
      const result = engine.intelligentCategorization(testDescription, '', testAmount);
      console.log('\n🧪 TEST RESULT:');
      console.log(JSON.stringify(result, null, 2));
      break;

    default:
      console.log('Usage:');
      console.log('  node ml-categorization-engine.js bulk [minConfidence] [--dry-run] [--limit N]');
      console.log('  node ml-categorization-engine.js report [expenseId]');
      console.log('  node ml-categorization-engine.js test "description" amount');
  }
}

if (require.main === module) {
  runIntelligentCategorization()
    .then(() => {
      console.log('\n✅ Categorization engine completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Engine failed:', error);
      process.exit(1);
    });
}

module.exports = { IntelligentCategorizationEngine };