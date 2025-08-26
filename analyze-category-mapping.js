#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const csvParser = require('csv-parser');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function analyzeCategoryMapping() {
  console.log('🔍 ANALYZING CATEGORY MAPPING ISSUE...\n');

  try {
    // 1. Get database categories
    console.log('1️⃣ Database categories:');
    const { data: dbCategories } = await supabase
      .from('categories')
      .select('id, name');
    
    dbCategories.forEach(cat => {
      console.log(`   - "${cat.name}" (${cat.id})`);
    });

    // 2. Extract unique categories from CSV
    console.log('\n2️⃣ CSV categories found:');
    const csvCategories = new Set();
    
    return new Promise((resolve) => {
      fs.createReadStream('docs/01-01-2024 TO 16-07-2025_exp_detail.csv')
        .pipe(csvParser())
        .on('data', (row) => {
          const category = row.category_name || row.Category || row.CATEGORY;
          if (category) {
            csvCategories.add(category.trim());
          }
        })
        .on('end', async () => {
          // Show unique CSV categories
          Array.from(csvCategories).sort().forEach(cat => {
            console.log(`   - "${cat}"`);
          });

          // 3. Check current expense categories
          console.log('\n3️⃣ Current expense category distribution:');
          const { data: expenseStats } = await supabase
            .from('expenses')
            .select(`
              category_id,
              categories!inner(name)
            `);

          const distribution = {};
          expenseStats.forEach(exp => {
            const categoryName = exp.categories.name;
            distribution[categoryName] = (distribution[categoryName] || 0) + 1;
          });

          Object.entries(distribution)
            .sort(([,a], [,b]) => b - a)
            .forEach(([name, count]) => {
              console.log(`   - ${name}: ${count} expenses`);
            });

          // 4. Create mapping analysis
          console.log('\n4️⃣ MAPPING ANALYSIS:');
          console.log('   CSV Categories → DB Categories');
          console.log('   ================================');

          const dbCategoryMap = {};
          dbCategories.forEach(cat => {
            dbCategoryMap[cat.name.toLowerCase()] = cat.id;
          });

          Array.from(csvCategories).forEach(csvCat => {
            let matchedDb = 'NONE';
            let matchedId = null;

            // Try exact match
            if (dbCategoryMap[csvCat.toLowerCase()]) {
              matchedDb = csvCat;
              matchedId = dbCategoryMap[csvCat.toLowerCase()];
            } else {
              // Try partial matches
              const dbNames = Object.keys(dbCategoryMap);
              const partialMatch = dbNames.find(dbName => 
                dbName.includes(csvCat.toLowerCase()) || 
                csvCat.toLowerCase().includes(dbName)
              );
              if (partialMatch) {
                matchedDb = partialMatch;
                matchedId = dbCategoryMap[partialMatch];
              }
            }

            console.log(`   "${csvCat}" → ${matchedDb} ${matchedId ? `(${matchedId})` : '(NO MATCH)'}`);
          });

          // 5. Generate proper mapping
          console.log('\n5️⃣ SUGGESTED CATEGORY MAPPING:');
          const properMapping = {
            'Office Supplies': 'Office Supplies',
            'Technology': 'Technology', 
            'Miscellaneous': 'Miscellaneous',
            'Marketing': 'Marketing',
            'Utilities': 'Utilities',
            'Transportation': 'Transportation',
            'Maintenance & Repairs': 'Maintenance & Repairs',
            // Add more based on CSV analysis
          };

          Object.entries(properMapping).forEach(([csv, db]) => {
            console.log(`   "${csv}" → "${db}"`);
          });

          resolve();
        });
    });

  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
  }
}

analyzeCategoryMapping();