# Replace USD references with PKR currency for Pakistan localization

## Feature Request
Update the application to use Pakistani Rupees (PKR) instead of USD as the default currency, with proper localization for Pakistan market.

## Current Behavior
- Application uses USD currency references
- Dollar symbol ($) is used throughout the interface
- No localization for Pakistani market

## Desired Behavior
- Use Pakistani Rupees (PKR) as default currency
- Display "Rs" symbol instead of "$"
- Implement proper number formatting for Pakistani currency
- Update all currency references throughout the application

## Technical Requirements

### Currency Symbol Changes
- Replace all "$" symbols with "Rs"
- Update currency formatting functions
- Modify display components to show Pakistani Rupee format

### Files to Update
- **Frontend Components:**
  - `frontend/src/components/Dashboard.jsx`
  - `frontend/src/components/ExpenseForm.jsx`
  - `frontend/src/components/ExpenseList.jsx`
  - `frontend/src/components/OptimizedExpenseList.jsx`
  - `frontend/src/components/EnhancedAnalytics.jsx`
  - `frontend/src/components/Analytics.jsx`
  - `frontend/src/components/CSVImportExport.jsx`
  - `frontend/src/components/OptimizedCSVImportExport.jsx`

- **Backend/API:**
  - `api-server.js`
  - `netlify/functions/api.js`

- **Database:**
  - Review any hardcoded currency references
  - Update seed data if necessary

### Number Formatting
Implement Pakistani currency formatting:
- **Format**: Rs 1,234.56
- **Large numbers**: Rs 1,23,456.78 (Pakistani number system)
- **Decimal places**: 2 decimal places for currency

### Example Changes
```javascript
// Before
const formatCurrency = (amount) => `$${amount.toFixed(2)}`

// After
const formatCurrency = (amount) => `Rs ${amount.toLocaleString('en-PK', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})}`
```

## Localization Details
- **Country**: Pakistan
- **Currency**: Pakistani Rupee (PKR)
- **Symbol**: Rs
- **Locale**: en-PK
- **Number format**: 1,23,456.78 (lakh/crore system)

## User Stories
- As a Pakistani user, I want to see amounts in PKR so I can easily understand the values
- As a user, I want proper currency formatting so amounts are displayed in familiar format
- As an admin, I want all reports and analytics to show PKR values

## Acceptance Criteria
- [ ] All currency displays show "Rs" instead of "$"
- [ ] Number formatting follows Pakistani conventions
- [ ] CSV export uses PKR formatting
- [ ] Analytics and reports display PKR values
- [ ] Form inputs accept PKR format
- [ ] Database stores currency values correctly
- [ ] No remaining USD references in UI

## Priority
**Medium** - Important for market localization but not blocking core functionality

## Labels
- enhancement
- localization
- currency
- frontend
- backend
- medium-priority

## Additional Considerations
- Consider adding currency configuration for future multi-currency support
- Ensure existing data remains valid after currency change
- Test with various amount ranges (small to large values)
- Verify CSV import/export handles new currency format
- Update user documentation with new currency format