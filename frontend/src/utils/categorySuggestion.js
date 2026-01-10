/**
 * Category Suggestion Engine
 * Rule-based intelligent category suggestions for expenses
 * Optimized for Pakistani business context with Urdu/English mixed text support
 */

// Pakistani business context categorization patterns
// Keywords include both English and romanized Urdu terms
const CATEGORIZATION_PATTERNS = {
  'Office Supplies': {
    keywords: [
      'stationary', 'stationery', 'office supply', 'register', 'file', 'folder',
      'tape', 'marker', 'paint marker', 'attendance register', 'pen', 'pencil',
      'paper', 'notebook', 'sticky notes', 'stapler', 'pins', 'clips', 'rubber',
      'envelope', 'printer ink', 'toner', 'cartridge', 'binding', 'lamination',
      // Urdu/Local terms
      'sabir digital', 'al qasim', 'safai', 'cleaning', 'chemical', 'almari',
      'desk', 'furniture', 'chair', 'table', 'cupboard', 'rack', 'shelf',
      'whiteboard', 'board', 'duster', 'chalk', 'white out', 'correction'
    ],
    weight: 1.0
  },
  'Technology': {
    keywords: [
      'cctv', 'camera', 'digital', 'computer', 'laptop', 'software', 'internet',
      'wifi', 'mobile', 'phone', 'electronic', 'printer', 'scanner', 'ups',
      'battery', 'charger', 'cable', 'usb', 'mouse', 'keyboard', 'monitor',
      'projector', 'speaker', 'headphone', 'router', 'modem', 'server',
      'hard drive', 'ssd', 'ram', 'motherboard', 'repair tech', 'it service',
      // Local vendors/terms
      'abid cctv', 'bills tech', 'computer market', 'hafeez center'
    ],
    weight: 1.0
  },
  'Maintenance & Repairs': {
    keywords: [
      'repair', 'maintenance', 'fixing', 'construction', 'building', 'plumber',
      'electrician', 'painter', 'renovation', 'restoration', 'service', 'ac repair',
      'fan repair', 'door', 'window', 'lock', 'key', 'glass', 'paint', 'color',
      'wall', 'floor', 'ceiling', 'roof', 'leakage', 'pipe', 'tap', 'sanitary',
      // Urdu/Local terms
      'mistri', 'mazdoor', 'cement', 'bori', 'hardware', 'razzaq hardware',
      'iron', 'airn', 'loha', 'steel', 'lakri', 'wood', 'ply', 'tiles',
      'marble', 'granite', 'fitting', 'wiring', 'switch', 'socket'
    ],
    weight: 1.0
  },
  'Utilities': {
    keywords: [
      'electricity', 'electric bill', 'power', 'gas', 'gas bill', 'water',
      'water bill', 'utility', 'sewerage', 'garbage', 'sanitation',
      // Urdu/Local terms
      'bijli', 'bijli ka bill', 'wapda', 'k-electric', 'ke bill', 'sui gas',
      'ssgc', 'sngpl', 'ptcl', 'phone bill', 'telephone', 'landline',
      'muhammad quresh', 'meter', 'bill payment', 'connection fee'
    ],
    weight: 1.2  // Higher weight for utilities - common category
  },
  'Transportation': {
    keywords: [
      'transport', 'travel', 'vehicle', 'car', 'bus', 'train', 'fare', 'ticket',
      'fuel', 'petrol', 'diesel', 'cng', 'oil', 'lubricant', 'tire', 'tyre',
      'puncture', 'service', 'parking', 'toll', 'motorway', 'highway',
      // Urdu/Local terms
      'trali', 'rickshaw', 'riksha', 'taxi', 'careem', 'uber', 'indriver',
      'gaari', 'motor cycle', 'bike', 'scooter', 'kiraya', 'bhara', 'daewoo',
      'faisal movers', 'bilal travels', 'qingqi', 'chingchi'
    ],
    weight: 1.0
  },
  'Marketing': {
    keywords: [
      'marketing', 'advertising', 'advertisement', 'ad', 'publicity', 'promotion',
      'banner', 'poster', 'flex', 'standee', 'brochure', 'pamphlet', 'flyer',
      'printing', 'design', 'graphic', 'social media', 'facebook', 'instagram',
      'google ads', 'seo', 'website', 'domain', 'hosting', 'logo', 'branding',
      // Urdu/Local terms
      'gratphy', 'photo', 'photography', 'taqseem inam', 'prize distribution',
      'event', 'function', 'ceremony', 'seminar', 'workshop', 'exhibition',
      'pamphlet distribution', 'bill board', 'neon sign', 'led sign'
    ],
    weight: 1.0
  },
  'Food & Dining': {
    keywords: [
      'food', 'meal', 'lunch', 'dinner', 'breakfast', 'snacks', 'refreshment',
      'restaurant', 'hotel', 'catering', 'party', 'function food', 'drinks',
      'beverages', 'water bottles', 'juice', 'soft drink', 'cold drink',
      // Urdu/Local terms
      'khana', 'chai', 'tea', 'coffee', 'nashta', 'tiffin', 'daba', 'dhaba',
      'biryani', 'karahi', 'hotel bill', 'daig', 'mithai', 'sweets', 'bakery',
      'nimko', 'samosa', 'pakora', 'burger', 'pizza', 'shawarma'
    ],
    weight: 0.9
  },
  'Professional Services': {
    keywords: [
      'lawyer', 'legal', 'court', 'advocate', 'notary', 'consultant', 'consulting',
      'audit', 'auditor', 'ca', 'chartered accountant', 'tax', 'fbr', 'return',
      'accounting', 'bookkeeping', 'advisory', 'professional fee', 'consultation',
      // Urdu/Local terms
      'wakeel', 'vakeel', 'kachehri', 'stamp paper', 'affidavit', 'agreement',
      'contract', 'deed', 'registration', 'verification', 'attestation'
    ],
    weight: 1.1
  },
  'Salaries': {
    keywords: [
      'salary', 'wages', 'pay', 'payroll', 'compensation', 'remuneration',
      'bonus', 'incentive', 'commission', 'allowance', 'overtime', 'ot',
      'employee', 'staff', 'worker', 'labor', 'daily wages', 'monthly salary',
      // Urdu/Local terms
      'tankhwah', 'tankha', 'maash', 'eidee', 'eidi', 'pagaar', 'pagar',
      'mazdoori', 'rozana', 'hafta war', 'monthly', 'advance salary'
    ],
    weight: 1.2
  },
  'Education': {
    keywords: [
      'education', 'school', 'college', 'university', 'tuition', 'fee', 'fees',
      'admission', 'exam', 'examination', 'board', 'syllabus', 'books', 'uniform',
      'stationery', 'lab', 'library', 'sports', 'extracurricular', 'training',
      // Urdu/Local terms
      'taleem', 'parhai', 'school fee', 'college fee', 'coaching', 'academy',
      'tutor', 'teacher salary', 'ustani', 'ustad', 'certificate', 'degree'
    ],
    weight: 1.0
  },
  'Insurance': {
    keywords: [
      'insurance', 'policy', 'premium', 'claim', 'coverage', 'health insurance',
      'life insurance', 'vehicle insurance', 'car insurance', 'fire insurance',
      'property insurance', 'bima', 'takaful', 'nic', 'state life', 'jubilee',
      'adamjee', 'efu', 'allianz', 'insurance renewal'
    ],
    weight: 1.0
  },
  'Banking & Finance': {
    keywords: [
      'bank', 'banking', 'cheque', 'check', 'draft', 'transfer', 'wire',
      'transaction', 'fee', 'charges', 'interest', 'markup', 'loan', 'emi',
      'installment', 'credit card', 'debit card', 'atm', 'online banking',
      // Local banks
      'hbl', 'ubl', 'mcb', 'allied', 'askari', 'meezan', 'bank alfalah',
      'jazzcash', 'easypaisa', 'nayapay', 'sadapay', 'raast'
    ],
    weight: 1.0
  },
  'Security': {
    keywords: [
      'security', 'guard', 'watchman', 'chowkidar', 'cctv', 'surveillance',
      'alarm', 'lock', 'safe', 'locker', 'security system', 'security service',
      'patrol', 'monitoring', 'access control', 'fire safety', 'extinguisher',
      // Urdu/Local terms
      'darban', 'choukidar', 'nigran', 'muhafiz', 'security guard salary'
    ],
    weight: 1.0
  },
  'Medical & Health': {
    keywords: [
      'medical', 'medicine', 'doctor', 'hospital', 'clinic', 'treatment',
      'checkup', 'test', 'lab test', 'x-ray', 'xray', 'ultrasound', 'scan',
      'pharmacy', 'chemist', 'first aid', 'ambulance', 'emergency',
      // Urdu/Local terms
      'dawai', 'dawa', 'hakeem', 'tabib', 'doctor fee', 'opd', 'consultation',
      'shifa', 'agha khan', 'services hospital', 'medical store'
    ],
    weight: 1.0
  }
};

/**
 * CategorySuggestionEngine - Rule-based category suggestion system
 */
class CategorySuggestionEngine {
  constructor(categories = []) {
    this.patterns = { ...CATEGORIZATION_PATTERNS };
    this.categories = categories;
    this.categoryMap = {};
    this.learnedPatterns = {};

    // Build category map for quick lookup
    categories.forEach(cat => {
      this.categoryMap[cat.name] = cat.id;
      this.categoryMap[cat.name.toLowerCase()] = cat.id;
    });
  }

  /**
   * Update categories list
   */
  setCategories(categories) {
    this.categories = categories;
    this.categoryMap = {};
    categories.forEach(cat => {
      this.categoryMap[cat.name] = cat.id;
      this.categoryMap[cat.name.toLowerCase()] = cat.id;
    });
  }

  /**
   * Normalize text for matching
   */
  normalizeText(text) {
    if (!text) return '';
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')  // Replace special chars with space
      .replace(/\s+/g, ' ')       // Normalize whitespace
      .trim();
  }

  /**
   * Calculate match score for a category
   */
  calculateScore(text, categoryName) {
    const normalizedText = this.normalizeText(text);
    const pattern = this.patterns[categoryName];

    if (!pattern) return 0;

    let score = 0;
    let matchCount = 0;
    const words = normalizedText.split(' ');

    // Check each keyword
    for (const keyword of pattern.keywords) {
      const normalizedKeyword = this.normalizeText(keyword);

      // Exact phrase match (highest score)
      if (normalizedText.includes(normalizedKeyword)) {
        score += 3 * pattern.weight;
        matchCount++;
        continue;
      }

      // Word-by-word match for multi-word keywords
      const keywordWords = normalizedKeyword.split(' ');
      if (keywordWords.length > 1) {
        const allWordsMatch = keywordWords.every(kw =>
          words.some(w => w.includes(kw) || kw.includes(w))
        );
        if (allWordsMatch) {
          score += 2 * pattern.weight;
          matchCount++;
        }
      }
    }

    // Check learned patterns
    const learned = this.learnedPatterns[categoryName] || [];
    for (const learnedKeyword of learned) {
      if (normalizedText.includes(this.normalizeText(learnedKeyword))) {
        score += 2 * pattern.weight;
        matchCount++;
      }
    }

    // Bonus for multiple matches
    if (matchCount > 1) {
      score *= 1 + (matchCount * 0.1);
    }

    return score;
  }

  /**
   * Get category suggestions for given text
   * @param {string} description - Expense description
   * @param {string} notes - Optional notes
   * @param {number} limit - Maximum suggestions to return
   * @returns {Array} Array of suggestions with category info and confidence
   */
  suggest(description, notes = '', limit = 3) {
    const text = `${description} ${notes}`.trim();

    if (!text || text.length < 2) {
      return [];
    }

    const scores = [];

    // Calculate scores for all categories
    for (const categoryName of Object.keys(this.patterns)) {
      const score = this.calculateScore(text, categoryName);

      if (score > 0) {
        const categoryId = this.categoryMap[categoryName];
        const category = this.categories.find(c => c.id === categoryId);

        if (category) {
          scores.push({
            categoryId: category.id,
            categoryName: category.name,
            color: category.color,
            score: score,
            confidence: Math.min(score / 10, 1)  // Normalize to 0-1
          });
        }
      }
    }

    // Sort by score descending
    scores.sort((a, b) => b.score - a.score);

    // Return top suggestions
    return scores.slice(0, limit).map(s => ({
      categoryId: s.categoryId,
      categoryName: s.categoryName,
      color: s.color,
      confidence: s.confidence,
      confidenceLabel: this.getConfidenceLabel(s.confidence)
    }));
  }

  /**
   * Get human-readable confidence label
   */
  getConfidenceLabel(confidence) {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.5) return 'Medium';
    return 'Low';
  }

  /**
   * Learn from existing expenses to improve suggestions
   * @param {Array} expenses - Array of expense objects with description, notes, and category info
   */
  learnFromExpenses(expenses) {
    if (!expenses || expenses.length === 0) return;

    // Group expenses by category
    const categoryExpenses = {};

    expenses.forEach(expense => {
      const categoryName = expense.category_name || expense.categories?.name;
      if (!categoryName || categoryName.toLowerCase() === 'miscellaneous') return;

      if (!categoryExpenses[categoryName]) {
        categoryExpenses[categoryName] = [];
      }

      const text = this.normalizeText(`${expense.description} ${expense.notes || ''}`);
      categoryExpenses[categoryName].push(text);
    });

    // Extract common patterns from each category
    for (const [categoryName, texts] of Object.entries(categoryExpenses)) {
      if (texts.length < 2) continue;  // Need at least 2 examples

      // Find common words/phrases
      const wordFrequency = {};
      texts.forEach(text => {
        const words = text.split(' ').filter(w => w.length > 2);
        words.forEach(word => {
          wordFrequency[word] = (wordFrequency[word] || 0) + 1;
        });
      });

      // Add frequently occurring words as learned patterns
      const threshold = Math.ceil(texts.length * 0.3);  // Appears in 30%+ of texts
      const frequentWords = Object.entries(wordFrequency)
        .filter(([_, count]) => count >= threshold)
        .map(([word, _]) => word);

      if (frequentWords.length > 0) {
        this.learnedPatterns[categoryName] = [
          ...(this.learnedPatterns[categoryName] || []),
          ...frequentWords
        ].filter((v, i, a) => a.indexOf(v) === i);  // Unique
      }
    }
  }

  /**
   * Get suggestions for reclassifying miscellaneous expenses
   * @param {Array} expenses - Array of miscellaneous expenses
   * @returns {Array} Array of expenses with suggested categories
   */
  suggestReclassifications(expenses) {
    if (!expenses || expenses.length === 0) return [];

    return expenses
      .filter(expense => {
        const categoryName = expense.category_name || expense.categories?.name;
        return categoryName?.toLowerCase() === 'miscellaneous';
      })
      .map(expense => {
        const suggestions = this.suggest(expense.description, expense.notes || '');

        return {
          expense: {
            id: expense.id,
            description: expense.description,
            amount: expense.amount,
            expense_date: expense.expense_date,
            notes: expense.notes
          },
          suggestions: suggestions,
          topSuggestion: suggestions.length > 0 ? suggestions[0] : null
        };
      })
      .filter(item => item.topSuggestion !== null);  // Only return items with suggestions
  }

  /**
   * Export learned patterns for persistence
   */
  exportLearnedPatterns() {
    return JSON.stringify(this.learnedPatterns);
  }

  /**
   * Import previously learned patterns
   */
  importLearnedPatterns(json) {
    try {
      this.learnedPatterns = JSON.parse(json);
    } catch (e) {
      console.error('Failed to import learned patterns:', e);
    }
  }
}

/**
 * LocalStorage key for persisting learned patterns
 */
const LEARNED_PATTERNS_KEY = 'expense_tracker_learned_patterns';

/**
 * Create a singleton instance for app-wide use
 * Loads learned patterns from localStorage on initialization
 */
let engineInstance = null;

export const getCategorySuggestionEngine = (categories = []) => {
  if (!engineInstance) {
    engineInstance = new CategorySuggestionEngine(categories);

    // Load persisted learned patterns from localStorage
    try {
      const savedPatterns = localStorage.getItem(LEARNED_PATTERNS_KEY);
      if (savedPatterns) {
        engineInstance.importLearnedPatterns(savedPatterns);
      }
    } catch (e) {
      console.warn('Failed to load learned patterns from localStorage:', e);
    }
  } else if (categories.length > 0) {
    engineInstance.setCategories(categories);
  }
  return engineInstance;
};

/**
 * Save learned patterns to localStorage
 */
export const persistLearnedPatterns = () => {
  if (!engineInstance) return;

  try {
    const patterns = engineInstance.exportLearnedPatterns();
    localStorage.setItem(LEARNED_PATTERNS_KEY, patterns);
  } catch (e) {
    console.warn('Failed to persist learned patterns to localStorage:', e);
  }
};

/**
 * Quick suggestion function for simple use cases
 */
export const suggestCategory = (description, notes = '', categories = []) => {
  const engine = getCategorySuggestionEngine(categories);
  return engine.suggest(description, notes);
};

/**
 * Get reclassification suggestions for miscellaneous expenses
 * Also persists learned patterns to localStorage
 */
export const getReclassificationSuggestions = (expenses, categories = []) => {
  const engine = getCategorySuggestionEngine(categories);
  engine.learnFromExpenses(expenses.filter(e => {
    const catName = e.category_name || e.categories?.name;
    return catName?.toLowerCase() !== 'miscellaneous';
  }));

  // Persist learned patterns to localStorage for future sessions
  persistLearnedPatterns();

  return engine.suggestReclassifications(expenses);
};

export { CategorySuggestionEngine, CATEGORIZATION_PATTERNS };
export default getCategorySuggestionEngine;
