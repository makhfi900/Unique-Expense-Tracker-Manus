#!/usr/bin/env node

/**
 * Smart Expense Categorization - Pakistani Context
 * Matches DB expenses to CSV, uses valid CSV categories, 
 * intelligently categorizes miscellaneous items
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const csvParser = require('csv-parser');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Pakistani business context categorization
const PAKISTANI_CATEGORIZATION = {
  'Office Supplies': [
    'stationary', 'stationery', 'office supply', 'sabir digital', 'register', 'file', 'tape', 'marker', 
    'paint marker', 'attendance register', 'al qasim', 'safai', 'cleaning', 'chemical', 'almari', 'safe',
    'desk', 'furniture'
  ],
  'Technology': [
    'cctv', 'camera', 'digital', 'abid cctv', 'bills', 'tech', 'computer', 'software', 'internet',
    'wifi', 'mobile', 'phone', 'electronic'
  ],
  'Maintenance & Repairs': [
    'repair', 'mistri', 'mazdoor', 'cement', 'bori', 'hardware', 'razzaq hardware', 'iron', 'airn',
    'maintenance', 'fixing', 'construction', 'building', 'plumber', 'electrician', 'painter'
  ],
  'Utilities': [
    'electricity', 'bijli', 'muhammad quresh', 'electric', 'power', 'gas', 'water', 'utility',
    'wapda', 'sui gas', 'ptcl', 'phone bill'
  ],
  'Transportation': [
    'transport', 'trali', 'rickshaw', 'taxi', 'fuel', 'petrol', 'diesel', 'travel', 'vehicle',
    'car', 'bus', 'train', 'fare', 'ticket'
  ],
  'Marketing': [
    'marketing', 'publicity', 'photo', 'photography', 'gratphy', 'taqseem inam', 'advertising',
    'banner', 'poster', 'printing', 'design'
  ],
  'Food & Dining': [
    'food', 'khana', 'chai', 'tea', 'coffee', 'restaurant', 'hotel', 'catering', 'refreshment',
    'lunch', 'dinner', 'breakfast', 'snacks'
  ],
  'Professional Services': [
    'lawyer', 'wakeel', 'consultant', 'audit', 'ca', 'chartered accountant', 'legal', 'court',
    'advocate', 'notary'
  ],
  'Salaries': [
    'salary', 'tankhwah', 'wages', 'maash', 'employee', 'staff', 'worker', 'allowance'
  ]
};

function intelligentCategorization(description, notes, categoryMap) {
  const text = `${description} ${notes}`.toLowerCase();
  
  // Check each category for keyword matches
  for (const [categoryName, keywords] of Object.entries(PAKISTANI_CATEGORIZATION)) {
    if (categoryMap[categoryName]) {
      const hasMatch = keywords.some(keyword => text.includes(keyword.toLowerCase()));
      if (hasMatch) {
        return categoryMap[categoryName];
      }
    }
  }
  
  // Default to miscellaneous if no intelligent match
  return categoryMap['Miscellaneous'];
}

function calculateSimilarity(str1, str2) {
  const s1 = str1.toLowerCase().replace(/[^a-z0-9]/g, '');
  const s2 = str2.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  if (s1 === s2) return 1.0;
  if (s1.includes(s2) || s2.includes(s1)) return 0.8;
  
  // Simple character overlap
  const commonChars = [...s1].filter(char => s2.includes(char)).length;
  return commonChars / Math.max(s1.length, s2.length);
}

async function smartCategorizeExpenses() {
  console.log('🧠 SMART EXPENSE CATEGORIZATION (Pakistani Context)...\n');

  try {
    // 1. Load database categories
    console.log('1️⃣ Loading database categories...');
    const { data: dbCategories } = await supabase
      .from('categories')
      .select('id, name');
    
    const categoryMap = {};
    dbCategories.forEach(cat => {
      categoryMap[cat.name] = cat.id;
    });
    
    console.log(`   Loaded ${dbCategories.length} categories`);

    // 2. Load CSV entries
    console.log('\n2️⃣ Loading CSV expenses...');
    const csvExpenses = [];
    let miscCount = 0;
    
    await new Promise((resolve) => {
      fs.createReadStream('docs/01-01-2024 TO 16-07-2025_exp_detail.csv')
        .pipe(csvParser())
        .on('data', (row) => {
          const amount = parseFloat(row.Amount || row.amount || 0);
          const description = row.Description || row.description || '';
          const notes = row.notes || row.Notes || '';
          const csvCategory = row.category_name || row.Category || 'Miscellaneous';
          const dateStr = row.Date || row.date || '2024-01-01';
          
          if (csvCategory.toLowerCase() === 'miscellaneous') {
            miscCount++;
          }
          
          // Parse date consistently
          let expenseDate;
          try {
            if (dateStr.includes('/')) {
              const parts = dateStr.split('/');
              expenseDate = `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
            } else {
              expenseDate = new Date(dateStr).toISOString().split('T')[0];
            }
          } catch (err) {
            expenseDate = '2024-01-01';
          }

          if (amount > 0) {
            csvExpenses.push({
              amount,
              description: description.trim(),
              notes: notes.trim(),
              csvCategory,
              expenseDate,
              // Create unique signature for matching
              signature: `${amount}_${expenseDate}_${description.substring(0, 20).toLowerCase().replace(/[^a-z0-9]/g, '')}`
            });
          }
        })
        .on('end', () => {
          console.log(`   Loaded ${csvExpenses.length} CSV expenses`);
          console.log(`   Original miscellaneous items: ${miscCount}`);
          resolve();
        });
    });

    // 3. Load database expenses  
    console.log('\n3️⃣ Loading database expenses...');
    const { data: dbExpenses } = await supabase
      .from('expenses')
      .select('id, amount, description, expense_date, category_id')
      .eq('is_active', true)
      .order('created_at');

    console.log(`   Found ${dbExpenses.length} expenses in database`);

    // 4. Match database expenses to CSV entries
    console.log('\n4️⃣ Matching database expenses to CSV...');
    const matches = [];
    const unmatched = [];

    for (const dbExp of dbExpenses) {
      const dbSignature = `${parseFloat(dbExp.amount)}_${dbExp.expense_date}_${dbExp.description.substring(0, 20).toLowerCase().replace(/[^a-z0-9]/g, '')}`;
      
      // Try exact signature match first
      let csvMatch = csvExpenses.find(csvExp => csvExp.signature === dbSignature);
      
      // If no exact match, try amount and date match with description similarity
      if (!csvMatch) {
        const candidates = csvExpenses.filter(csvExp => 
          Math.abs(csvExp.amount - parseFloat(dbExp.amount)) < 0.01 &&
          csvExp.expenseDate === dbExp.expense_date
        );
        
        if (candidates.length === 1) {
          csvMatch = candidates[0];
        } else if (candidates.length > 1) {
          // Use description similarity to pick best match
          csvMatch = candidates.reduce((best, candidate) => {
            const similarity = calculateSimilarity(candidate.description, dbExp.description);
            const bestSimilarity = calculateSimilarity(best.description, dbExp.description);
            return similarity > bestSimilarity ? candidate : best;
          });
        }
      }

      if (csvMatch) {
        matches.push({ dbExp, csvExp: csvMatch });
        // Mark as used to avoid double-matching
        const index = csvExpenses.indexOf(csvMatch);
        csvExpenses.splice(index, 1);
      } else {
        unmatched.push(dbExp);
      }
    }

    console.log(`   Matched: ${matches.length} expenses`);
    console.log(`   Unmatched (new entries): ${unmatched.length} expenses`);

    // 5. Update categories for matched expenses
    console.log('\n5️⃣ Updating categories...');
    let updatedCount = 0;
    let intelligentlyUpdated = 0;
    let keptOriginal = 0;

    for (const match of matches) {
      const { dbExp, csvExp } = match;
      let newCategoryId = null;

      if (csvExp.csvCategory.toLowerCase() !== 'miscellaneous') {
        // Use the valid CSV category
        newCategoryId = categoryMap[csvExp.csvCategory];
        if (newCategoryId) {
          updatedCount++;
        }
      } else {
        // This was originally miscellaneous - try intelligent categorization
        const intelligentCategoryId = intelligentCategorization(
          csvExp.description, 
          csvExp.notes, 
          categoryMap
        );
        
        if (intelligentCategoryId !== categoryMap['Miscellaneous']) {
          newCategoryId = intelligentCategoryId;
          intelligentlyUpdated++;
        } else {
          keptOriginal++;
        }
      }

      // Update if we have a new category and it's different from current
      if (newCategoryId && newCategoryId !== dbExp.category_id) {
        try {
          const { error } = await supabase
            .from('expenses')
            .update({ category_id: newCategoryId })
            .eq('id', dbExp.id);

          if (error) {
            console.warn(`   ⚠️  Failed to update expense ${dbExp.id}: ${error.message}`);
          } else {
            if (updatedCount + intelligentlyUpdated <= 10) {
              const categoryName = Object.keys(categoryMap).find(name => categoryMap[name] === newCategoryId);
              const isIntelligent = csvExp.csvCategory.toLowerCase() === 'miscellaneous' ? ' (intelligent)' : '';
              console.log(`   ✅ $${dbExp.amount} "${dbExp.description.substring(0, 30)}..." → ${categoryName}${isIntelligent}`);
            }
          }
        } catch (err) {
          console.warn(`   ⚠️  Exception updating expense ${dbExp.id}: ${err.message}`);
        }
      }
    }

    // 6. Show results
    console.log(`\n6️⃣ SMART CATEGORIZATION RESULTS:`);
    console.log(`   CSV valid categories applied: ${updatedCount}`);
    console.log(`   Intelligently categorized misc items: ${intelligentlyUpdated}`);
    console.log(`   Kept as miscellaneous: ${keptOriginal}`);
    console.log(`   Unmatched (new entries) left untouched: ${unmatched.length}`);

    // 7. Show new distribution
    console.log('\n7️⃣ Updated category distribution:');
    const { data: finalStats } = await supabase
      .from('expenses')
      .select(`
        category_id,
        categories!inner(name)
      `)
      .eq('is_active', true);

    const finalDistribution = {};
    finalStats.forEach(exp => {
      const categoryName = exp.categories.name;
      finalDistribution[categoryName] = (finalDistribution[categoryName] || 0) + 1;
    });

    Object.entries(finalDistribution)
      .sort(([,a], [,b]) => b - a)
      .forEach(([name, count]) => {
        console.log(`   - ${name}: ${count} expenses`);
      });

    console.log(`\n🎉 SMART CATEGORIZATION COMPLETED!`);
    console.log(`   Only original CSV expenses were updated.`);
    console.log(`   New database entries were left untouched.`);
    console.log(`   Refresh your analytics dashboard to see the improved categorization!`);

  } catch (error) {
    console.error('❌ Smart categorization failed:', error.message);
    throw error;
  }
}

// Run the smart categorization
if (require.main === module) {
  smartCategorizeExpenses()
    .then(() => {
      console.log('\n✅ Smart categorization completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Smart categorization failed:', error);
      process.exit(1);
    });
}

module.exports = { smartCategorizeExpenses };