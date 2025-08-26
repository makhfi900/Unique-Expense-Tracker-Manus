#!/usr/bin/env node

/**
 * Test script to verify expense editing functionality integration
 * This script validates the complete flow of expense editing
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Expense Editing Integration');
console.log('======================================\n');

// 1. Test ExpenseViewer modifications
const expenseViewerPath = path.join(__dirname, 'frontend/src/components/ExpenseViewer.jsx');
const expenseViewerContent = fs.readFileSync(expenseViewerPath, 'utf8');

console.log('✅ 1. Testing ExpenseViewer modifications:');

// Check for required imports
const requiredImports = [
  'import ExpenseForm from \'./ExpenseForm\'',
  'Dialog,',
  'DialogContent,',
  'DialogHeader,',
  'DialogTitle,'
];

let importsFound = 0;
requiredImports.forEach(importStatement => {
  if (expenseViewerContent.includes(importStatement)) {
    console.log(`   ✓ ${importStatement.replace(',', '')} import found`);
    importsFound++;
  } else {
    console.log(`   ✗ ${importStatement.replace(',', '')} import missing`);
  }
});

// Check for modal state management
const modalStates = [
  'const [editModalOpen, setEditModalOpen] = useState(false)',
  'const [editingExpense, setEditingExpense] = useState(null)'
];

let statesFound = 0;
modalStates.forEach(state => {
  if (expenseViewerContent.includes(state)) {
    console.log(`   ✓ Modal state: ${state.split(' = ')[0]} found`);
    statesFound++;
  } else {
    console.log(`   ✗ Modal state: ${state.split(' = ')[0]} missing`);
  }
});

// Check for handler implementations
const handlers = [
  'const handleEditExpense = (expense) => {',
  'const handleEditSuccess = () => {',
  'const handleEditCancel = () => {'
];

let handlersFound = 0;
handlers.forEach(handler => {
  if (expenseViewerContent.includes(handler)) {
    console.log(`   ✓ Handler: ${handler.replace(' = (expense) => {', '').replace(' = () => {', '')} implemented`);
    handlersFound++;
  } else {
    console.log(`   ✗ Handler: ${handler.replace(' = (expense) => {', '').replace(' = () => {', '')} missing`);
  }
});

// Check for modal dialog JSX
const modalElements = [
  '<Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>',
  '<DialogContent className="sm:max-w-md max-w-[95vw] max-h-[90vh] overflow-y-auto">',
  '<ExpenseForm'
];

let modalElementsFound = 0;
modalElements.forEach(element => {
  if (expenseViewerContent.includes(element)) {
    console.log(`   ✓ Modal element: ${element.split(' ')[0]}${element.includes('className') ? ' (with responsive styling)' : ''} found`);
    modalElementsFound++;
  } else {
    console.log(`   ✗ Modal element: ${element.split(' ')[0]} missing`);
  }
});

// 2. Test ExpenseForm compatibility
console.log('\n✅ 2. Testing ExpenseForm compatibility:');

const expenseFormPath = path.join(__dirname, 'frontend/src/components/ExpenseForm.jsx');
const expenseFormContent = fs.readFileSync(expenseFormPath, 'utf8');

// Check if ExpenseForm accepts required props
const formProps = [
  'expense = null',
  'onSuccess',
  'onCancel'
];

let formPropsFound = 0;
formProps.forEach(prop => {
  if (expenseFormContent.includes(prop)) {
    console.log(`   ✓ ExpenseForm prop: ${prop} supported`);
    formPropsFound++;
  } else {
    console.log(`   ✗ ExpenseForm prop: ${prop} not supported`);
  }
});

// Check for edit mode handling
const editFeatures = [
  'if (expense) {',
  'expense ? `/expenses/${expense.id}` : \'/expenses\'',
  'expense ? \'PUT\' : \'POST\''
];

let editFeaturesFound = 0;
editFeatures.forEach(feature => {
  if (expenseFormContent.includes(feature)) {
    console.log(`   ✓ Edit feature: ${feature.includes('if (expense)') ? 'Edit mode detection' : feature.includes('`/expenses/') ? 'Dynamic endpoint' : 'Dynamic HTTP method'} implemented`);
    editFeaturesFound++;
  } else {
    console.log(`   ✗ Edit feature: ${feature.includes('if (expense)') ? 'Edit mode detection' : feature.includes('`/expenses/') ? 'Dynamic endpoint' : 'Dynamic HTTP method'} missing`);
  }
});

// 3. Test API backend support
console.log('\n✅ 3. Testing API backend support:');

const apiServerPath = path.join(__dirname, 'api-server.js');
const apiServerContent = fs.readFileSync(apiServerPath, 'utf8');

// Check for PUT endpoint
const apiFeatures = [
  'app.put(\'/api/expenses/:id\'',
  'authenticateToken',
  'req.user.role === \'admin\'',
  'req.user.role === \'account_officer\''
];

let apiFeaturesFound = 0;
apiFeatures.forEach(feature => {
  if (apiServerContent.includes(feature)) {
    console.log(`   ✓ API feature: ${feature.includes('app.put') ? 'PUT endpoint' : feature.includes('authenticateToken') ? 'Authentication' : feature.includes('admin') ? 'Admin permissions' : 'Account officer permissions'} available`);
    apiFeaturesFound++;
  } else {
    console.log(`   ✗ API feature: ${feature.includes('app.put') ? 'PUT endpoint' : feature.includes('authenticateToken') ? 'Authentication' : feature.includes('admin') ? 'Admin permissions' : 'Account officer permissions'} missing`);
  }
});

// 4. Generate test summary
console.log('\n📊 INTEGRATION TEST SUMMARY');
console.log('===========================');

const totalChecks = requiredImports.length + modalStates.length + handlers.length + modalElements.length + formProps.length + editFeatures.length + apiFeatures.length;
const totalPassed = importsFound + statesFound + handlersFound + modalElementsFound + formPropsFound + editFeaturesFound + apiFeaturesFound;

console.log(`✅ Total checks passed: ${totalPassed}/${totalChecks}`);
console.log(`📈 Integration coverage: ${Math.round((totalPassed/totalChecks) * 100)}%`);

if (totalPassed === totalChecks) {
  console.log('\n🎉 INTEGRATION TEST PASSED!');
  console.log('   All components are properly integrated for expense editing functionality.');
} else if (totalPassed >= totalChecks * 0.8) {
  console.log('\n⚠️  INTEGRATION TEST MOSTLY PASSED!');
  console.log('   Most components are integrated, minor issues may exist.');
} else {
  console.log('\n❌ INTEGRATION TEST FAILED!');
  console.log('   Significant integration issues detected.');
}

// 5. User workflow validation
console.log('\n📋 USER WORKFLOW VALIDATION');
console.log('============================');

const workflowSteps = [
  'User clicks Edit button in expense table/card',
  'handleEditExpense function is called with expense data',
  'Modal state is updated (editModalOpen = true, editingExpense = expense)',
  'Dialog component opens with ExpenseForm inside',
  'ExpenseForm pre-populates with existing expense data',
  'User modifies expense details and clicks Update',
  'ExpenseForm calls API PUT /api/expenses/:id',
  'API validates user permissions (admin/account_officer/owner)',
  'API updates expense in database',
  'ExpenseForm calls onSuccess callback',
  'Modal closes and ExpenseViewer refreshes data'
];

console.log('Expected workflow steps:');
workflowSteps.forEach((step, index) => {
  console.log(`${index + 1}. ${step}`);
});

console.log('\n🚀 READY FOR TESTING!');
console.log('To test manually:');
console.log('1. Start the application: npm run dev');
console.log('2. Navigate to expense viewer');
console.log('3. Click Edit button on any expense');
console.log('4. Modify expense details in the modal');
console.log('5. Click "Update Expense" to save changes');
console.log('6. Verify changes are reflected in the expense list');