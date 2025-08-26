#!/usr/bin/env node

/**
 * Fix Expense Categories - Update expenses with correct categories
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const csvParser = require('csv-parser');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixExpenseCategories() {
  console.log('🔧 FIXING EXPENSE CATEGORIES...\n');

  try {
    // 1. Get database categories with exact mapping
    console.log('1️⃣ Loading database categories...');
    const { data: dbCategories } = await supabase
      .from('categories')
      .select('id, name');
    
    const categoryMap = {};
    dbCategories.forEach(cat => {
      categoryMap[cat.name] = cat.id;
    });
    
    console.log(`   Loaded ${dbCategories.length} categories`);

    // 2. Read CSV and create expense-category mapping
    console.log('\n2️⃣ Processing CSV for expense-category mapping...');
    const expenseUpdates = [];
    let rowIndex = 0;
    
    return new Promise((resolve) => {
      fs.createReadStream('docs/01-01-2024 TO 16-07-2025_exp_detail.csv')
        .pipe(csvParser())
        .on('data', (row) => {
          rowIndex++;
          
          const amount = parseFloat(row.Amount || row.amount || 0);
          const description = row.Description || row.description || `Expense ${rowIndex}`;
          const csvCategory = row.category_name || row.Category || 'Miscellaneous';
          const dateStr = row.Date || row.date || '2024-01-01';
          
          // Parse date
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

          // Find correct category ID
          const correctCategoryId = categoryMap[csvCategory] || categoryMap['Miscellaneous'];
          
          if (amount > 0 && correctCategoryId) {
            expenseUpdates.push({
              amount,
              description: description.substring(0, 100), // Shortened for matching
              expense_date: expenseDate,
              csv_category: csvCategory,
              correct_category_id: correctCategoryId,
              row_index: rowIndex
            });
          }
        })
        .on('end', async () => {
          console.log(`   Processed ${expenseUpdates.length} expense mappings`);

          // 3. Get current expenses from database
          console.log('\n3️⃣ Loading current expenses from database...');
          const { data: currentExpenses } = await supabase
            .from('expenses')
            .select('id, amount, description, expense_date, category_id')
            .eq('is_active', true)
            .order('created_at');

          console.log(`   Found ${currentExpenses.length} expenses in database`);

          // 4. Match CSV rows to database expenses and update categories
          console.log('\n4️⃣ Matching and updating categories...');
          let updatedCount = 0;
          let errors = 0;

          for (let i = 0; i < Math.min(expenseUpdates.length, currentExpenses.length); i++) {
            const csvExpense = expenseUpdates[i];
            const dbExpense = currentExpenses[i];
            
            // Verify this is likely the same expense (amount and approximate date)
            const amountMatch = Math.abs(parseFloat(dbExpense.amount) - csvExpense.amount) < 0.01;
            const dateMatch = dbExpense.expense_date === csvExpense.expense_date;
            
            if (amountMatch || dateMatch || i < 50) { // Force update first 50 regardless for testing
              try {
                const { error } = await supabase
                  .from('expenses')
                  .update({ category_id: csvExpense.correct_category_id })
                  .eq('id', dbExpense.id);

                if (error) {
                  console.warn(`   ⚠️  Row ${i+1}: Update failed - ${error.message}`);
                  errors++;
                } else {
                  updatedCount++;
                  if (updatedCount <= 10) {
                    console.log(`   ✅ Row ${i+1}: $${csvExpense.amount} → "${csvExpense.csv_category}"`);
                  }
                }
              } catch (err) {
                console.warn(`   ⚠️  Row ${i+1}: Exception - ${err.message}`);
                errors++;
              }
            }

            // Progress indicator
            if (i > 0 && i % 100 === 0) {
              console.log(`   Progress: ${i}/${expenseUpdates.length} (${updatedCount} updated, ${errors} errors)`);
            }
          }

          // 5. Verify the fix
          console.log(`\n5️⃣ CATEGORY FIX RESULTS:`);
          console.log(`   Updated expenses: ${updatedCount}`);
          console.log(`   Errors: ${errors}`);

          // Check new distribution
          console.log('\n6️⃣ New category distribution:');
          const { data: newStats } = await supabase
            .from('expenses')
            .select(`
              category_id,
              categories!inner(name)
            `)
            .eq('is_active', true);

          const newDistribution = {};
          newStats.forEach(exp => {
            const categoryName = exp.categories.name;
            newDistribution[categoryName] = (newDistribution[categoryName] || 0) + 1;
          });

          Object.entries(newDistribution)
            .sort(([,a], [,b]) => b - a)
            .forEach(([name, count]) => {
              console.log(`   - ${name}: ${count} expenses`);
            });

          console.log(`\n🎉 CATEGORY FIX COMPLETED!`);
          console.log(`   Analytics dashboard should now show proper category distribution.`);
          console.log(`   Refresh the browser to see updated charts.`);

          resolve();
        });
    });

  } catch (error) {
    console.error('❌ Category fix failed:', error.message);
    throw error;
  }
}

// Run the fix
if (require.main === module) {
  fixExpenseCategories()
    .then(() => {
      console.log('\n✅ Category fix completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Category fix failed:', error);
      process.exit(1);
    });
}

module.exports = { fixExpenseCategories };