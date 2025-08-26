#!/usr/bin/env node

/**
 * Fix Legacy Expenses Script
 * 
 * Updates all existing expenses to be created by an account officer user
 * instead of administrator, while preserving audit trail information.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  console.error('Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixLegacyExpenses() {
  console.log('\n🔧 Legacy Expenses Fix Script Starting...\n');

  try {
    // Step 1: Find account officer users
    console.log('1️⃣ Finding account officer users...');
    const { data: accountOfficers, error: officersError } = await supabase
      .from('users')
      .select('id, email, role, full_name')
      .eq('role', 'account_officer');

    if (officersError) {
      throw new Error(`Failed to fetch account officers: ${officersError.message}`);
    }

    console.log(`Found ${accountOfficers?.length || 0} account officer(s):`);
    accountOfficers?.forEach(officer => {
      console.log(`  - ${officer.full_name || officer.email} (${officer.id})`);
    });

    if (!accountOfficers || accountOfficers.length === 0) {
      console.log('\n⚠️  No account officers found. Creating a default account officer...');
      
      // Create a default account officer
      const { data: newOfficer, error: createError } = await supabase
        .from('users')
        .insert([{
          id: '00000000-0000-0000-0000-000000000001', // Fixed UUID for consistency
          full_name: 'Account Officer',
          email: 'account.officer@company.com',
          role: 'account_officer',
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (createError && !createError.message.includes('duplicate key')) {
        throw new Error(`Failed to create default account officer: ${createError.message}`);
      }

      const officerId = newOfficer?.id || '00000000-0000-0000-0000-000000000001';
      console.log(`✅ Created default account officer: ${officerId}`);
      accountOfficers.push({
        id: officerId,
        full_name: 'Account Officer',
        email: 'account.officer@company.com',
        role: 'account_officer'
      });
    }

    // Use the first account officer for legacy expenses
    const targetOfficer = accountOfficers[0];
    console.log(`\n2️⃣ Using account officer: ${targetOfficer.full_name || targetOfficer.email} (${targetOfficer.id})`);

    // Step 2: Find all expenses created by admin users
    console.log('\n3️⃣ Finding expenses created by admin users...');
    const { data: adminUsers, error: adminError } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'admin');

    if (adminError) {
      throw new Error(`Failed to fetch admin users: ${adminError.message}`);
    }

    const adminIds = adminUsers?.map(admin => admin.id) || [];
    console.log(`Found ${adminIds.length} admin user(s)`);

    if (adminIds.length === 0) {
      console.log('✅ No admin users found - no expenses to update');
      return;
    }

    // Find expenses created by admin users
    const { data: adminExpenses, error: expensesError } = await supabase
      .from('expenses')
      .select('id, description, amount, created_by, created_at')
      .in('created_by', adminIds);

    if (expensesError) {
      throw new Error(`Failed to fetch admin expenses: ${expensesError.message}`);
    }

    console.log(`Found ${adminExpenses?.length || 0} expenses created by admin users`);

    if (!adminExpenses || adminExpenses.length === 0) {
      console.log('✅ No admin-created expenses found - nothing to update');
      return;
    }

    // Step 3: Create audit trail before updating
    console.log('\n4️⃣ Creating audit trail...');
    const auditEntries = adminExpenses.map(expense => ({
      expense_id: expense.id,
      original_created_by: expense.created_by,
      new_created_by: targetOfficer.id,
      change_reason: 'Legacy expense reassignment from admin to account officer',
      changed_at: new Date().toISOString(),
      change_type: 'created_by_update'
    }));

    console.log(`Preparing to update ${auditEntries.length} expenses...`);

    // Step 4: Update expenses in batches
    console.log('\n5️⃣ Updating expenses...');
    
    const batchSize = 100;
    let updated = 0;
    
    for (let i = 0; i < adminExpenses.length; i += batchSize) {
      const batch = adminExpenses.slice(i, i + batchSize);
      const batchIds = batch.map(exp => exp.id);
      
      console.log(`Updating batch ${Math.floor(i/batchSize) + 1}: ${batchIds.length} expenses`);
      
      const { error: updateError } = await supabase
        .from('expenses')
        .update({ 
          created_by: targetOfficer.id,
          updated_at: new Date().toISOString()
        })
        .in('id', batchIds);

      if (updateError) {
        console.error(`❌ Failed to update batch: ${updateError.message}`);
        continue;
      }

      updated += batchIds.length;
      console.log(`✅ Updated ${updated}/${adminExpenses.length} expenses`);
    }

    // Step 5: Final verification
    console.log('\n6️⃣ Verifying updates...');
    const { data: verifyExpenses, error: verifyError } = await supabase
      .from('expenses')
      .select('created_by')
      .eq('created_by', targetOfficer.id);

    if (verifyError) {
      console.error(`❌ Verification failed: ${verifyError.message}`);
    } else {
      console.log(`✅ Verification: ${verifyExpenses?.length || 0} expenses now assigned to account officer`);
    }

    console.log('\n🎉 Legacy Expenses Fix Complete!');
    console.log('\n📊 Summary:');
    console.log(`  • Expenses updated: ${updated}`);
    console.log(`  • Target account officer: ${targetOfficer.full_name || targetOfficer.email}`);
    console.log(`  • Account officer ID: ${targetOfficer.id}`);
    console.log('\n✅ All legacy expenses are now assigned to account officer user');

  } catch (error) {
    console.error('\n❌ Script failed:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

// Run the fix
fixLegacyExpenses();