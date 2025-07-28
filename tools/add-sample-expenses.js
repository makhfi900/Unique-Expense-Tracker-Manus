const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function addSampleData() {
  console.log('Adding sample expense data...');
  
  // Get admin user ID
  const { data: users } = await supabase.from('users').select('id').eq('email', 'admin1@test.com');
  const adminId = users[0]?.id;
  
  // Get categories
  const { data: categories } = await supabase.from('categories').select('id, name');
  
  if (!adminId || !categories?.length) {
    console.log('Missing admin user or categories');
    return;
  }
  
  // Add diverse sample expenses across different dates and categories
  const sampleExpenses = [
    { amount: 2500, description: 'Laptop for office', category_id: categories.find(c => c.name === 'Technology')?.id, expense_date: '2025-01-15' },
    { amount: 850, description: 'Team lunch meeting', category_id: categories.find(c => c.name === 'Food & Dining')?.id, expense_date: '2025-02-20' },
    { amount: 1200, description: 'Monthly phone bill', category_id: categories.find(c => c.name === 'Utilities')?.id, expense_date: '2025-03-10' },
    { amount: 3500, description: 'Conference travel', category_id: categories.find(c => c.name === 'Travel')?.id, expense_date: '2025-04-05' },
    { amount: 600, description: 'Office supplies', category_id: categories.find(c => c.name === 'Office Supplies')?.id, expense_date: '2025-05-12' },
    { amount: 950, description: 'Client dinner', category_id: categories.find(c => c.name === 'Food & Dining')?.id, expense_date: '2025-06-18' },
    { amount: 1800, description: 'Marketing materials', category_id: categories.find(c => c.name === 'Marketing')?.id, expense_date: '2025-07-25' },
    { amount: 450, description: 'Taxi to airport', category_id: categories.find(c => c.name === 'Transportation')?.id, expense_date: '2025-07-26' }
  ];
  
  for (const expense of sampleExpenses) {
    if (expense.category_id) {
      const { error } = await supabase.from('expenses').insert({
        ...expense,
        created_by: adminId,
        notes: 'Sample data for analytics'
      });
      
      if (error) {
        console.log('Error adding expense:', error.message);
      } else {
        console.log('Added:', expense.description);
      }
    }
  }
  
  console.log('Sample data added successfully!');
  
  // Check total expenses now
  const { data: allExpenses } = await supabase.from('expenses').select('*').eq('is_active', true);
  console.log('Total expenses in database:', allExpenses?.length || 0);
  
  // Check total amount
  const totalAmount = allExpenses?.reduce((sum, exp) => sum + parseFloat(exp.amount), 0) || 0;
  console.log('Total amount:', totalAmount);
}

addSampleData().catch(console.error);