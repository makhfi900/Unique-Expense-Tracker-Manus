/**
 * Bulk Recategorization API Module
 * Provides REST API endpoints for intelligent expense recategorization
 */

const { IntelligentCategorizationEngine } = require('./ml-categorization-engine');

class BulkRecategorizationAPI {
  constructor(supabase) {
    this.supabase = supabase;
    this.engine = new IntelligentCategorizationEngine();
    this.isInitialized = false;
  }

  async initialize() {
    if (!this.isInitialized) {
      await this.engine.initialize();
      this.isInitialized = true;
    }
  }

  // GET /api/recategorization/analyze
  async analyzeExpenses(req, res) {
    try {
      await this.initialize();
      
      const { 
        limit = 100, 
        category_filter = null, 
        min_confidence = 0.5,
        date_range = null 
      } = req.query;

      const options = {
        minConfidence: parseFloat(min_confidence),
        dryRun: true, // Always dry run for analysis
        categoryFilter: category_filter,
        dateRange: date_range ? JSON.parse(date_range) : null,
        limit: parseInt(limit)
      };

      const analysis = await this.engine.bulkRecategorizeExpenses(options);
      
      // Add category distribution analysis
      const categoryDistribution = await this.getCategoryDistribution();
      
      res.json({
        success: true,
        data: {
          ...analysis,
          categoryDistribution,
          analyzedAt: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Analyze expenses error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to analyze expenses for recategorization'
      });
    }
  }

  // POST /api/recategorization/bulk-apply
  async bulkApplyRecategorization(req, res) {
    try {
      await this.initialize();
      
      const { 
        min_confidence = 0.8, 
        category_filter = null,
        date_range = null,
        max_updates = 500
      } = req.body;

      // Validate minimum confidence
      if (parseFloat(min_confidence) < 0.7) {
        return res.status(400).json({
          success: false,
          error: 'Minimum confidence must be at least 0.7 for bulk operations'
        });
      }

      const options = {
        minConfidence: parseFloat(min_confidence),
        dryRun: false,
        categoryFilter: category_filter,
        dateRange: date_range,
        limit: parseInt(max_updates)
      };

      const result = await this.engine.bulkRecategorizeExpenses(options);

      res.json({
        success: true,
        data: {
          ...result,
          appliedAt: new Date().toISOString(),
          message: `Successfully recategorized ${result.highConfidenceCount} expenses`
        }
      });

    } catch (error) {
      console.error('Bulk apply error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to apply bulk recategorization'
      });
    }
  }

  // POST /api/recategorization/single
  async categorizeSingleExpense(req, res) {
    try {
      await this.initialize();
      
      const { expense_id, description, notes = '', amount = 0 } = req.body;

      if (!expense_id && !description) {
        return res.status(400).json({
          success: false,
          error: 'Either expense_id or description is required'
        });
      }

      let expenseData;
      if (expense_id) {
        const { data } = await this.supabase
          .from('expenses')
          .select('id, description, notes, amount')
          .eq('id', expense_id)
          .single();
        expenseData = data;
      } else {
        expenseData = { description, notes, amount };
      }

      const suggestion = this.engine.intelligentCategorization(
        expenseData.description,
        expenseData.notes || '',
        parseFloat(expenseData.amount)
      );

      // If expense_id provided, also apply the suggestion if confidence is high
      let applied = false;
      if (expense_id && suggestion.confidence >= 0.8) {
        const { error } = await this.supabase
          .from('expenses')
          .update({ category_id: suggestion.categoryId })
          .eq('id', expense_id);
        
        applied = !error;
      }

      res.json({
        success: true,
        data: {
          expense_id,
          suggestion,
          applied,
          appliedAt: applied ? new Date().toISOString() : null
        }
      });

    } catch (error) {
      console.error('Single categorization error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to categorize expense'
      });
    }
  }

  // GET /api/recategorization/suggestions/:expense_id
  async getExpenseSuggestions(req, res) {
    try {
      await this.initialize();
      
      const { expense_id } = req.params;
      const { include_alternatives = false } = req.query;

      const { data: expense } = await this.supabase
        .from('expenses')
        .select(`
          id, description, notes, amount, category_id,
          categories!inner(name)
        `)
        .eq('id', expense_id)
        .single();

      if (!expense) {
        return res.status(404).json({
          success: false,
          error: 'Expense not found'
        });
      }

      const suggestion = this.engine.intelligentCategorization(
        expense.description,
        expense.notes || '',
        parseFloat(expense.amount)
      );

      const response = {
        expense: {
          id: expense.id,
          description: expense.description,
          amount: expense.amount,
          current_category: expense.categories.name,
          current_category_id: expense.category_id
        },
        suggestion,
        needsUpdate: suggestion.categoryId !== expense.category_id,
        suggestedAt: new Date().toISOString()
      };

      if (include_alternatives === 'true') {
        // Generate alternative suggestions with lower confidence
        response.alternatives = await this.generateAlternativeSuggestions(
          expense.description, expense.notes, expense.amount
        );
      }

      res.json({
        success: true,
        data: response
      });

    } catch (error) {
      console.error('Get suggestions error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get expense suggestions'
      });
    }
  }

  // GET /api/recategorization/report
  async getCategorizationReport(req, res) {
    try {
      await this.initialize();
      
      const { 
        limit = 50, 
        category = null, 
        accuracy_only = false 
      } = req.query;

      const report = await this.engine.generateCategorizationReport(
        null, parseInt(limit)
      );

      let filteredReport = report;
      if (category) {
        filteredReport = report.filter(item => 
          item.currentCategory === category || item.suggestedCategory === category
        );
      }

      if (accuracy_only === 'true') {
        filteredReport = filteredReport.filter(item => !item.isCorrect);
      }

      const accuracy = report.length > 0 ? 
        (report.filter(item => item.isCorrect).length / report.length * 100).toFixed(1) : 0;

      res.json({
        success: true,
        data: {
          report: filteredReport,
          statistics: {
            totalAnalyzed: report.length,
            accuracy: parseFloat(accuracy),
            correctlyClassified: report.filter(item => item.isCorrect).length,
            needsRecategorization: report.filter(item => !item.isCorrect).length,
            averageConfidence: (
              report.reduce((sum, item) => sum + item.confidence, 0) / report.length
            ).toFixed(3)
          },
          generatedAt: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Get report error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate categorization report'
      });
    }
  }

  async getCategoryDistribution() {
    const { data } = await this.supabase
      .from('expenses')
      .select(`
        category_id,
        categories!inner(name, color)
      `)
      .eq('is_active', true);

    const distribution = {};
    data.forEach(expense => {
      const categoryName = expense.categories.name;
      if (!distribution[categoryName]) {
        distribution[categoryName] = {
          count: 0,
          color: expense.categories.color
        };
      }
      distribution[categoryName].count++;
    });

    return Object.entries(distribution)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count);
  }

  async generateAlternativeSuggestions(description, notes, amount) {
    // This would generate multiple categorization options
    // For now, return empty array - could be enhanced later
    return [];
  }

  // Express.js middleware setup
  setupRoutes(app) {
    // Analysis endpoints
    app.get('/api/recategorization/analyze', this.analyzeExpenses.bind(this));
    app.get('/api/recategorization/report', this.getCategorizationReport.bind(this));
    app.get('/api/recategorization/suggestions/:expense_id', this.getExpenseSuggestions.bind(this));
    
    // Action endpoints
    app.post('/api/recategorization/bulk-apply', this.bulkApplyRecategorization.bind(this));
    app.post('/api/recategorization/single', this.categorizeSingleExpense.bind(this));
  }
}

module.exports = { BulkRecategorizationAPI };