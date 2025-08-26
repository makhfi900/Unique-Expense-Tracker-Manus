#!/usr/bin/env node

/**
 * Import Expenses from CSV to Database
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const csvParser = require('csv-parser');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function importExpenses() {
  console.log('📊 Starting expense import from CSV...\n');
  
  try {
    // First, get users and categories to map data
    console.log('1️⃣ Loading users and categories...');
    
    const { data: users } = await supabase.from('users').select('id, email, role');
    const { data: categories } = await supabase.from('categories').select('id, name');
    
    console.log(`   Found ${users.length} users`);
    console.log(`   Found ${categories.length} categories`);
    
    // Use admin user as default creator
    const adminUser = users.find(u => u.role === 'admin') || users[0];
    console.log(`   Using default user: ${adminUser.email}`);
    
    // Create category mapping (case-insensitive)
    const categoryMap = {};
    categories.forEach(cat => {
      categoryMap[cat.name.toLowerCase()] = cat.id;
    });
    
    // Read and parse CSV
    console.log('\n2️⃣ Reading CSV file...');
    const csvPath = 'docs/01-01-2024 TO 16-07-2025_exp_detail.csv';
    
    if (!fs.existsSync(csvPath)) {
      console.error('❌ CSV file not found:', csvPath);
      return;
    }
    
    const expenses = [];
    let rowCount = 0;
    
    return new Promise((resolve, reject) => {
      fs.createReadStream(csvPath)
        .pipe(csvParser())
        .on('data', (row) => {
          rowCount++;
          
          // Log first few rows to understand structure
          if (rowCount <= 3) {
            console.log(`   Row ${rowCount}:`, Object.keys(row));
            console.log('   Sample data:', row);
          }
          
          try {
            // Try to extract data based on common CSV column names
            const amount = parseFloat(row.Amount || row.amount || row.AMOUNT || row.Cost || row.cost || 0);
            const description = row.Description || row.description || row.DESCRIPTION || row.Item || row.item || row.Details || row.details || 'Expense';
            const dateStr = row.Date || row.date || row.DATE || row.ExpenseDate || row['Expense Date'] || new Date().toISOString().split('T')[0];
            const categoryStr = row.Category || row.category || row.CATEGORY || row.Type || row.type || 'Miscellaneous';
            
            // Parse date - handle different formats
            let expenseDate;
            try {
              if (dateStr.includes('/')) {
                // Handle MM/DD/YYYY or DD/MM/YYYY
                const parts = dateStr.split('/');
                if (parts.length === 3) {
                  expenseDate = new Date(`${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`).toISOString().split('T')[0];
                }
              } else if (dateStr.includes('-')) {
                expenseDate = new Date(dateStr).toISOString().split('T')[0];
              } else {
                expenseDate = new Date().toISOString().split('T')[0];
              }
            } catch (err) {
              expenseDate = new Date().toISOString().split('T')[0];
            }
            
            // Find matching category
            let categoryId = categoryMap[categoryStr.toLowerCase()];
            if (!categoryId) {
              // Try partial matches
              const categoryKeys = Object.keys(categoryMap);
              const matchingKey = categoryKeys.find(key => 
                key.includes(categoryStr.toLowerCase()) || 
                categoryStr.toLowerCase().includes(key)
              );
              categoryId = matchingKey ? categoryMap[matchingKey] : categoryMap['miscellaneous'];
            }
            
            if (amount > 0 && description && categoryId) {
              expenses.push({
                amount: amount,
                description: description.substring(0, 255), // Limit length
                expense_date: expenseDate,
                category_id: categoryId,
                created_by: adminUser.id,
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });
            }
          } catch (err) {
            console.warn(`   ⚠️ Skipping row ${rowCount}:`, err.message);
          }
        })
        .on('end', async () => {
          console.log(`\n3️⃣ Processed ${rowCount} rows from CSV`);
          console.log(`   Valid expenses to import: ${expenses.length}`);
          
          if (expenses.length === 0) {
            console.log('❌ No valid expenses found in CSV');
            console.log('\n📋 CSV column headers found:');
            // Show what columns we found in the first row
            resolve();
            return;
          }
          
          // Show sample of what we're importing
          console.log('\n📊 Sample expenses to import:');
          expenses.slice(0, 3).forEach((exp, i) => {
            console.log(`   ${i+1}. $${exp.amount} - ${exp.description} (${exp.expense_date})`);
          });
          
          // Import in batches
          console.log('\n4️⃣ Importing expenses to database...');
          const batchSize = 100;
          let imported = 0;
          
          for (let i = 0; i < expenses.length; i += batchSize) {
            const batch = expenses.slice(i, i + batchSize);
            
            const { data, error } = await supabase
              .from('expenses')
              .insert(batch);
            
            if (error) {
              console.error(`❌ Batch ${Math.floor(i/batchSize) + 1} failed:`, error.message);
            } else {
              imported += batch.length;
              console.log(`   ✅ Imported batch ${Math.floor(i/batchSize) + 1}: ${batch.length} expenses`);
            }
          }
          
          console.log(`\n🎉 Import completed!`);
          console.log(`   Total expenses imported: ${imported}/${expenses.length}`);
          console.log(`   Analytics dashboard should now show data!`);
          
          resolve();
        })
        .on('error', (err) => {
          console.error('❌ CSV parsing error:', err.message);
          reject(err);
        });
    });
    
  } catch (error) {
    console.error('💥 Import failed:', error.message);
    throw error;
  }
}

// Run import
if (require.main === module) {
  importExpenses()
    .then(() => {
      console.log('\n✅ Import process completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Import failed:', error);
      process.exit(1);
    });
}

module.exports = { importExpenses };