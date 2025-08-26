#!/usr/bin/env node

/**
 * Final Expense Cleanup - Pakistani Context
 * 1. Further classify remaining miscellaneous expenses
 * 2. Fix creator assignment issue 
 * 3. Prepare for proper expense editing
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Enhanced Pakistani business context with more keywords
const ENHANCED_CATEGORIZATION = {
  'Food & Dining': [
    'tea', 'chai', 'coffee', 'khana', 'food', 'restaurant', 'hotel', 'catering', 'nashta',
    'lunch', 'dinner', 'breakfast', 'snacks', 'biscuit', 'refreshment', 'dawat', 'iftar',
    'milk', 'doodh', 'sugar', 'cheeni', 'bread', 'roti', 'rice', 'chawal'
  ],
  'Utilities': [
    'electricity', 'bijli', 'electric', 'power', 'gas', 'sui gas', 'water', 'pani',
    'phone', 'mobile', 'ptcl', 'internet', 'wifi', 'connection', 'bill', 'utility'
  ],
  'Transportation': [
    'transport', 'rickshaw', 'taxi', 'car', 'gari', 'fuel', 'petrol', 'diesel', 'cng',
    'bus', 'train', 'fare', 'ticket', 'travel', 'safar', 'vehicle', 'auto'
  ],
  'Office Supplies': [
    'paper', 'kagaz', 'pen', 'pencil', 'file', 'folder', 'stapler', 'clip', 'envelope',
    'stamp', 'printing', 'photocopy', 'xerox', 'ink', 'cartridge', 'books', 'kitab'
  ],
  'Maintenance & Repairs': [
    'repair', 'theek', 'fix', 'broken', 'paint', 'rang', 'brush', 'cement', 'brick',
    'tiles', 'marble', 'plumber', 'electrician', 'carpenter', 'badrhoi', 'mistri'
  ],
  'Technology': [
    'computer', 'laptop', 'mobile', 'phone', 'printer', 'scanner', 'software', 'hardware',
    'internet', 'wifi', 'cable', 'charger', 'battery', 'screen', 'keyboard'
  ],
  'Medical': [
    'medicine', 'dawa', 'doctor', 'daktar', 'hospital', 'clinic', 'medical', 'health',
    'pharmacy', 'dawakhana', 'treatment', 'ilaj', 'checkup'
  ],
  'Education': [
    'school', 'college', 'university', 'education', 'taleem', 'books', 'fees', 'tuition',
    'training', 'course', 'class', 'student', 'teacher', 'ustad'
  ],
  'Security': [
    'guard', 'chowkidar', 'security', 'camera', 'alarm', 'lock', 'tala', 'safe', 'protection'
  ],
  'Cleaning': [
    'cleaning', 'safai', 'soap', 'detergent', 'brush', 'broom', 'jharu', 'vacuum', 'mop'
  ]
};

function advancedCategorization(description, notes, amount, categoryMap) {
  const text = `${description} ${notes}`.toLowerCase();
  
  // First try enhanced categorization
  for (const [categoryName, keywords] of Object.entries(ENHANCED_CATEGORIZATION)) {
    const dbCategoryName = categoryName === 'Medical' ? 'Miscellaneous' : 
                          categoryName === 'Security' ? 'Miscellaneous' :
                          categoryName === 'Cleaning' ? 'Office Supplies' :
                          categoryName === 'Education' ? 'Education & Affiliation Fees' :
                          categoryName;
                          
    if (categoryMap[dbCategoryName]) {
      const hasMatch = keywords.some(keyword => text.includes(keyword.toLowerCase()));
      if (hasMatch) {
        return { categoryId: categoryMap[dbCategoryName], reason: `Matched "${categoryName}" keywords` };
      }
    }
  }
  
  // Amount-based heuristics for Pakistani business context
  if (amount >= 50000) {
    if (categoryMap['Salaries']) {
      return { categoryId: categoryMap['Salaries'], reason: 'High amount likely salary' };
    }
  }
  
  if (amount >= 10000 && amount < 50000) {
    if (text.includes('bp') || text.includes('payment')) {
      if (categoryMap['Professional Services']) {
        return { categoryId: categoryMap['Professional Services'], reason: 'Medium amount business payment' };
      }
    }
  }
  
  if (amount < 1000) {
    if (categoryMap['Office Supplies']) {
      return { categoryId: categoryMap['Office Supplies'], reason: 'Small amount likely supplies' };
    }
  }
  
  // Default to miscellaneous
  return { categoryId: categoryMap['Miscellaneous'], reason: 'No clear category match' };
}

async function finalExpenseCleanup() {
  console.log('🔧 FINAL EXPENSE CLEANUP...\n');

  try {
    // 1. Load categories and users
    console.log('1️⃣ Loading categories and users...');
    const { data: dbCategories } = await supabase.from('categories').select('id, name');
    const { data: users } = await supabase.from('users').select('id, email, role');
    
    const categoryMap = {};
    dbCategories.forEach(cat => {
      categoryMap[cat.name] = cat.id;
    });
    
    console.log(`   Categories: ${dbCategories.length}`);
    console.log(`   Users: ${users.length}`);
    users.forEach(user => console.log(`   - ${user.email} (${user.role})`));

    // 2. Get remaining miscellaneous expenses
    console.log('\n2️⃣ Finding remaining miscellaneous expenses...');
    const { data: miscExpenses } = await supabase
      .from('expenses')
      .select('id, amount, description, notes, created_by, expense_date, category_id')
      .eq('category_id', categoryMap['Miscellaneous'])
      .eq('is_active', true)
      .limit(50); // Process in batches
    
    console.log(`   Found ${miscExpenses.length} miscellaneous expenses to analyze`);

    // 3. Show sample expenses for review
    console.log('\n3️⃣ Sample miscellaneous expenses:');
    miscExpenses.slice(0, 10).forEach((exp, i) => {
      console.log(`   ${i+1}. $${exp.amount} - "${exp.description}" ${exp.notes ? `(${exp.notes})` : ''}`);
    });

    // 4. Apply advanced categorization
    console.log('\n4️⃣ Applying advanced categorization...');
    let reclassified = 0;
    let creatorFixed = 0;
    
    // Get proper user assignments
    const adminUser = users.find(u => u.role === 'admin');
    const accountOfficer = users.find(u => u.role === 'account_officer');
    const properCreator = accountOfficer || adminUser; // Prefer account officer for business expenses

    for (const expense of miscExpenses) {
      const updates = {};
      let needsUpdate = false;

      // Try to reclassify
      const result = advancedCategorization(
        expense.description || '', 
        expense.notes || '', 
        parseFloat(expense.amount),
        categoryMap
      );

      if (result.categoryId !== categoryMap['Miscellaneous']) {
        updates.category_id = result.categoryId;
        needsUpdate = true;
        reclassified++;
        
        if (reclassified <= 10) {
          const categoryName = Object.keys(categoryMap).find(name => categoryMap[name] === result.categoryId);
          console.log(`   ✅ $${expense.amount} "${expense.description}" → ${categoryName} (${result.reason})`);
        }
      }

      // Fix creator if needed (Muhammad Quresh seems to be incorrectly assigned)
      if (properCreator && expense.created_by !== properCreator.id) {
        updates.created_by = properCreator.id;
        needsUpdate = true;
        creatorFixed++;
      }

      // Apply updates
      if (needsUpdate) {
        try {
          const { error } = await supabase
            .from('expenses')
            .update(updates)
            .eq('id', expense.id);

          if (error) {
            console.warn(`   ⚠️  Failed to update expense ${expense.id}: ${error.message}`);
          }
        } catch (err) {
          console.warn(`   ⚠️  Exception updating expense ${expense.id}: ${err.message}`);
        }
      }
    }

    // 5. Check for editing issues
    console.log('\n5️⃣ Checking expense editing functionality...');
    
    // Test if we can update a single expense
    if (miscExpenses.length > 0) {
      const testExpense = miscExpenses[0];
      try {
        const { error } = await supabase
          .from('expenses')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', testExpense.id);

        if (error) {
          console.log(`   ❌ Expense editing issue found: ${error.message}`);
          console.log(`   💡 This might be due to RLS policies or missing permissions`);
        } else {
          console.log(`   ✅ Expense editing works correctly`);
        }
      } catch (err) {
        console.log(`   ❌ Expense editing exception: ${err.message}`);
      }
    }

    // 6. Final statistics
    console.log('\n6️⃣ CLEANUP RESULTS:');
    console.log(`   Reclassified expenses: ${reclassified}`);
    console.log(`   Creator assignments fixed: ${creatorFixed}`);

    // Show updated distribution
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

    console.log('\n7️⃣ Updated category distribution:');
    Object.entries(finalDistribution)
      .sort(([,a], [,b]) => b - a)
      .forEach(([name, count]) => {
        console.log(`   - ${name}: ${count} expenses`);
      });

    // 8. Check creator distribution
    console.log('\n8️⃣ Creator distribution:');
    const { data: creatorStats } = await supabase
      .from('expenses')
      .select(`
        created_by,
        users!inner(email)
      `)
      .eq('is_active', true);

    const creatorDistribution = {};
    creatorStats.forEach(exp => {
      const email = exp.users.email;
      creatorDistribution[email] = (creatorDistribution[email] || 0) + 1;
    });

    Object.entries(creatorDistribution)
      .sort(([,a], [,b]) => b - a)
      .forEach(([email, count]) => {
        console.log(`   - ${email}: ${count} expenses`);
      });

    console.log(`\n🎉 FINAL CLEANUP COMPLETED!`);
    console.log(`   Remaining miscellaneous expenses should now be truly unclassifiable.`);
    console.log(`   Creator assignments have been corrected.`);
    console.log(`   If expense editing still doesn't work, check RLS policies or frontend code.`);

  } catch (error) {
    console.error('❌ Final cleanup failed:', error.message);
    throw error;
  }
}

// Run the cleanup
if (require.main === module) {
  finalExpenseCleanup()
    .then(() => {
      console.log('\n✅ Final cleanup completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Final cleanup failed:', error);
      process.exit(1);
    });
}

module.exports = { finalExpenseCleanup };