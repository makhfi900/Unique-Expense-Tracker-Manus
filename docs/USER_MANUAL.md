# User Manual - Unique Expense Tracker

Welcome to the Unique Expense Tracker! This comprehensive guide will help you navigate and use all features of the application.

## 🚪 Getting Started

### Logging In
1. Navigate to the application URL
2. Enter your email and password, or
3. Use the demo account buttons for testing:
   - **Login as Admin** - Full system access
   - **Login as Account Officer** - Limited access

### First Time Setup (Admin Only)
1. Login with admin credentials
2. Change default passwords immediately
3. Create additional users as needed
4. Set up custom expense categories

## 👥 User Roles

### Administrator
**Full system access including:**
- View all expenses from all users
- Create, edit, and delete any expense
- Manage users (create, edit, deactivate)
- Manage categories (create, edit, delete)
- Access analytics and reports
- Export all data
- Import data from CSV files

### Account Officer
**Limited access including:**
- View only their own expenses
- Create and edit their own expenses
- Filter expenses by specific date
- Export their own data
- Import their own data from CSV files

## 💰 Managing Expenses

### Adding a New Expense
1. Click the **"Add Expense"** tab
2. Fill in the required fields:
   - **Amount:** Enter the expense amount (numbers only)
   - **Date:** Select the expense date
   - **Description:** Brief description of the expense
   - **Category:** Choose from available categories
3. Optional fields:
   - **Receipt URL:** Link to digital receipt
   - **Notes:** Additional details about the expense
4. Click **"Create Expense"**

### Viewing Expenses
1. Click the **"Expenses"** tab
2. Use filters to narrow down results:
   - **Date Filter:** Specific date (Account Officers)
   - **Date Range:** Start and end dates (Admins)
   - **Category:** Filter by expense category
3. View expense details in the table:
   - Date, Amount, Description, Category
   - Created by (Admin view only)

### Editing Expenses
1. In the expenses list, click the **Edit** button (pencil icon)
2. Modify any field in the popup form
3. Click **"Update Expense"**
4. Changes are saved immediately

### Deleting Expenses
1. In the expenses list, click the **Delete** button (trash icon)
2. Confirm deletion in the popup
3. Expense is marked as inactive (soft delete)

## 🏷️ Managing Categories (Admin Only)

### Creating Categories
1. Click the **"Categories"** tab
2. Click **"Add Category"**
3. Fill in the form:
   - **Name:** Unique category name
   - **Description:** Optional description
   - **Color:** Choose a color for visual identification
4. Click **"Create Category"**

### Editing Categories
1. In the categories list, click the **Edit** button
2. Modify the category details
3. Click **"Update Category"**

### Default Categories
The system comes with these pre-configured categories:
- Food & Dining (Red)
- Transportation (Blue)
- Office Supplies (Green)
- Utilities (Orange)
- Travel (Purple)
- Marketing (Pink)
- Professional Services (Gray)
- Technology (Teal)
- Miscellaneous (Slate)

## 👤 User Management (Admin Only)

### Creating New Users
1. Click the **"Users"** tab
2. Click **"Add User"**
3. Fill in the form:
   - **Email:** Unique email address
   - **Full Name:** User's display name
   - **Password:** Secure password
   - **Role:** Admin or Account Officer
4. Click **"Create User"**

### Managing Existing Users
1. View all users in the users table
2. **Edit:** Click edit button to modify user details
3. **Activate/Deactivate:** Toggle user status
4. **Role Changes:** Update user permissions

## 📊 Analytics and Reports (Admin Only)

### Spending Trends
1. Click the **"Analytics"** tab
2. View the spending trends chart:
   - **Monthly View:** Shows spending by month for selected year
   - **Yearly View:** Shows spending by year
3. Use dropdown to change period and year
4. Hover over chart points for detailed information

### Category Breakdown
1. View pie chart for category distribution
2. View bar chart for category amounts
3. Adjust date range using date pickers
4. Charts update automatically with new data

### Summary Statistics
View key metrics at the top of analytics:
- **Total Expenses:** Sum of all expenses
- **Monthly Average:** Average spending per month
- **Top Category:** Highest spending category
- **Categories:** Total number of categories

## 📁 Import/Export Data

### Exporting Data
1. Click the **"Import/Export"** tab
2. In the Export section:
   - Set optional date filters
   - Click **"Export Expenses"**
   - CSV file downloads automatically

### Importing Data
1. Prepare your CSV file with these columns:
   - **Date** (YYYY-MM-DD format)
   - **Amount** (decimal number)
   - **Description** (text)
   - **Category** (must match existing category names)
   - **Notes** (optional)
   - **Receipt URL** (optional)

2. In the Import section:
   - Click **"Select CSV File"**
   - Choose your prepared file
   - Click **"Import Expenses"**
   - Monitor progress bar
   - Review success/error messages

### CSV Format Example
```csv
Date,Amount,Description,Category,Notes
2024-01-15,25.50,Lunch at restaurant,Food & Dining,Team lunch
2024-01-16,45.00,Office supplies,Office Supplies,Printer paper
2024-01-17,120.00,Monthly internet bill,Utilities,Home office
```

## 🔍 Filtering and Search

### Date Filters
- **Account Officers:** Can filter by specific date only
- **Admins:** Can use date ranges (start date to end date)

### Category Filters
- Select "All categories" to view all expenses
- Choose specific category to filter results
- Filters apply immediately

### Clearing Filters
- Click **"Clear"** button to reset all filters
- Returns to showing all accessible expenses

## 📱 Mobile Usage

The application is fully responsive and works on mobile devices:
- **Touch-friendly interface** with larger buttons
- **Responsive tables** that scroll horizontally
- **Mobile-optimized forms** with appropriate input types
- **Swipe gestures** supported where applicable

## 🔐 Security Features

### Password Security
- Use strong passwords with mixed characters
- Change default passwords immediately
- Passwords are securely hashed and stored

### Data Privacy
- Account Officers can only see their own data
- Admins have full system access
- All data is encrypted in transit and at rest

### Session Management
- Automatic logout after inactivity
- Secure JWT token authentication
- Session data stored securely in browser

## ⚠️ Important Notes

### Data Validation
- All required fields must be filled
- Amounts must be positive numbers
- Dates must be valid calendar dates
- Category names must be unique

### Browser Compatibility
- Works best in modern browsers (Chrome, Firefox, Safari, Edge)
- JavaScript must be enabled
- Cookies must be allowed for authentication

### Performance Tips
- Large CSV imports may take time to process
- Use date filters to improve loading times
- Clear browser cache if experiencing issues

## 🆘 Troubleshooting

### Login Issues
- **Forgot Password:** Contact your administrator
- **Account Locked:** Check with administrator
- **Wrong Credentials:** Verify email and password

### Data Issues
- **Missing Expenses:** Check date filters
- **Import Errors:** Verify CSV format and category names
- **Export Problems:** Try different date ranges

### Performance Issues
- **Slow Loading:** Check internet connection
- **Charts Not Loading:** Refresh the page
- **Mobile Issues:** Try landscape orientation

### Getting Help
1. Check this user manual for guidance
2. Contact your system administrator
3. Verify you have the correct permissions for the action

## 🎯 Best Practices

### For Account Officers
- Record expenses promptly for accuracy
- Use descriptive expense descriptions
- Attach receipt URLs when possible
- Review expenses regularly using date filters

### For Administrators
- Set up meaningful category names
- Train users on proper expense recording
- Monitor system usage through analytics
- Regularly export data for backup
- Review user permissions periodically

### Data Management
- **Consistent Naming:** Use consistent descriptions
- **Proper Categorization:** Choose appropriate categories
- **Regular Backups:** Export data regularly
- **Clean Data:** Remove test entries periodically

## 📈 Advanced Features

### Bulk Operations
- Import multiple expenses via CSV
- Export filtered data sets
- Batch category assignments

### Reporting
- Monthly spending summaries
- Category-wise analysis
- Year-over-year comparisons
- Custom date range reports

### Customization
- Custom category colors
- Personalized category names
- Flexible date filtering
- Role-based feature access

---

## 🎉 Congratulations!

You're now ready to effectively use the Unique Expense Tracker. This powerful tool will help you:
- ✅ Track expenses efficiently
- ✅ Analyze spending patterns
- ✅ Manage financial data securely
- ✅ Generate insightful reports
- ✅ Collaborate with team members

**Happy expense tracking! 💰📊**

claude-flow hive-mind resume session-1754339511901-866dmrsud