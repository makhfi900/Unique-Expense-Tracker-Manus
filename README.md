# Unique Expense Tracker

A full-stack expense tracking application with role-based access control, data visualization, and CSV import/export capabilities.

## 🚀 Live Demo

**Deployed Application:** [https://hrjxtqlv.manus.space](https://hrjxtqlv.manus.space)

## 📋 Features

### Core Features
- **Supabase Authentication** with role-based access control (migrated from JWT)
- **Two User Roles:**
  - **Admin:** Full access to all features, user management, and system-wide analytics
  - **Account Officer:** Limited access to personal expenses and date-specific filtering
- **Expense Management:** Create, read, update, and delete expenses with automatic analytics refresh
- **Category Management:** Custom expense categories with color coding
- **Data Visualization:** Interactive charts for spending trends and category breakdowns
- **CSV Import/Export:** Bulk data operations for expense records
- **Responsive Design:** Works seamlessly on desktop and mobile devices

### Advanced Features
- **Materialized Views** for high-performance analytics queries
- **Smart Auto-Refresh** of analytics data (5-minute cooldown after expense changes)
- **Monthly/Yearly Spending Trends** with interactive charts
- **Category-wise Expense Breakdown** with pie and bar charts
- **Date-based Filtering** for Account Officers
- **Real-time Data Updates** across all components
- **Professional UI** built with shadcn/ui and Tailwind CSS
- **Performance Optimizations** with React.lazy(), memoization, and database indexes

## 🏗️ Architecture

### Frontend
- **React 19** with modern hooks and context API
- **Vite** for fast development and optimized builds
- **Tailwind CSS v4** for responsive styling
- **shadcn/ui** with Radix UI primitives for consistent components
- **Recharts** for data visualization
- **Lucide React** for icons
- **React Router v7** for navigation

### Backend
- **Dual Environment Support:**
  - **Development:** Express.js server on localhost:3001
  - **Production:** Netlify Serverless Functions
- **Supabase Auth** for authentication and user management
- **Node.js** runtime environment
- **Automatic API switching** based on environment

### Database
- **Supabase PostgreSQL** with Row Level Security (RLS)
- **Materialized Views** for optimized analytics queries:
  - `mv_monthly_spending` - Monthly spending summaries
  - `mv_daily_spending` - Daily trends analysis
  - `mv_category_spending` - Category breakdowns
  - `mv_user_spending` - User statistics
- **Performance Indexes** and query optimizations
- **Smart refresh system** with 5-minute cooldown
- **Structured schema** with proper relationships and constraints

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+ and pnpm
- Supabase account and project
- Netlify account (for deployment)

### Local Development

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd unique-expense-tracker
   ```

2. **Install dependencies:**
   ```bash
   # Install root dependencies
   npm install
   
   # Install frontend dependencies
   cd frontend
   pnpm install
   ```

3. **Set up Supabase:**
   - Create a new Supabase project
   - Run the SQL schema in this order:
     1. `database/supabase_auth_schema_fixed.sql` (main schema)
     2. `database/performance_optimizations.sql` (materialized views)
   - Get your project URL and API keys

4. **Configure environment variables:**
   ```bash
   # Copy the example file
   cp .env.example .env
   
   # Update with your Supabase credentials
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   JWT_SECRET=your_jwt_secret_key  # Legacy for Express dev server
   ```

5. **Start development servers:**
   ```bash
   # Option 1: Start both servers simultaneously
   npm run dev:full
   
   # Option 2: Start individually
   npm run dev:api    # Express API server (port 3001)
   npm run dev        # Frontend (port 5173)
   
   # Option 3: Netlify functions (for production testing)
   netlify dev
   ```

### Production Deployment

1. **Build the application:**
   ```bash
   cd frontend
   pnpm run build
   ```

2. **Deploy to Netlify:**
   - Connect your repository to Netlify
   - Set build command: `cd frontend && pnpm install && pnpm run build`
   - Set publish directory: `frontend/dist`
   - Add environment variables in Netlify dashboard

## 👥 Default Users

The application comes with two default users for testing:

### Administrator
- **Email:** admin1@test.com
- **Password:** admin1
- **Permissions:** Full system access, user management, analytics

### Account Officer
- **Email:** officer1@test.com
- **Password:** officer1
- **Permissions:** Personal expense management, date-specific filtering

## 📊 Database Schema

### Users Table
- `id` (UUID, Primary Key)
- `email` (Unique, Required)
- `password_hash` (Required)
- `full_name` (Required)
- `role` (admin/account_officer)
- `created_at`, `updated_at`, `is_active`

### Categories Table
- `id` (UUID, Primary Key)
- `name` (Unique, Required)
- `description` (Optional)
- `color` (Hex color code)
- `created_by` (Foreign Key to Users)
- `created_at`, `updated_at`, `is_active`

### Expenses Table
- `id` (UUID, Primary Key)
- `amount` (Decimal, Required)
- `description` (Required)
- `category_id` (Foreign Key to Categories)
- `expense_date` (Required)
- `receipt_url` (Optional)
- `notes` (Optional)
- `created_by` (Foreign Key to Users)
- `created_at`, `updated_at`, `is_active`

## 🔐 Security Features

- **Supabase Authentication** with secure token management
- **Row Level Security (RLS)** in Supabase database
- **Role-based Access Control** throughout the application
- **Input Validation** on both frontend and backend
- **CORS Protection** for API endpoints
- **Environment-based API switching** for development/production security

## 📱 User Interface

### Login Page
- Clean, professional design
- Demo account buttons for easy testing
- Responsive layout for all devices

### Dashboard
- Role-specific navigation and features
- Tabbed interface for different sections
- Real-time data updates

### Expense Management
- Intuitive forms for adding/editing expenses
- Advanced filtering and search capabilities
- Bulk operations via CSV import/export

### Analytics (Admin Only)
- Interactive spending trend charts
- Category breakdown visualizations
- Customizable date ranges and filters

## 🔧 API Endpoints

### Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - Create new user (Admin only)

### Users
- `GET /users` - List all users (Admin only)
- `PUT /users/:id` - Update user (Admin only)

### Categories
- `GET /categories` - List categories
- `POST /categories` - Create category (Admin only)
- `PUT /categories/:id` - Update category (Admin only)

### Expenses
- `GET /expenses` - List expenses (role-filtered)
- `POST /expenses` - Create expense
- `PUT /expenses/:id` - Update expense
- `DELETE /expenses/:id` - Delete expense
- `GET /expenses/export` - Export to CSV

### Analytics
- `GET /analytics/spending-trends` - Spending trends data
- `GET /analytics/category-breakdown` - Category breakdown data

## 🚀 Deployment

The application is configured for seamless deployment on Netlify with:
- Automatic builds from Git repository
- Serverless function deployment
- Environment variable management
- Custom domain support

## 🐛 Troubleshooting

### Analytics Showing Zero Values
- **Issue:** Analytics dashboard displays all zeros despite having expense data
- **Cause:** Materialized views need refreshing after new data is added
- **Solution:** Run `SELECT refresh_analytics_views(FALSE);` in Supabase SQL Editor
- **Prevention:** Automatic refresh is now implemented (updates after expense changes)

### SelectItem "Blank Page" Error
- **Issue:** Page goes blank when clicking "Show Filters" button
- **Cause:** Radix UI SelectItem components cannot have empty string values
- **Solution:** Already fixed - changed `<SelectItem value="">` to `<SelectItem value="all">`
- **Location:** `frontend/src/components/OptimizedExpenseList.jsx:392`

### Sample Data for Testing
- **Scripts Available:**
  - `node tools/add-sample-expenses.js` - Adds diverse expense data
  - `node tools/add-sample-login-activity.js` - Adds login activity data
  - `node tools/create-demo-users.js setup` - Creates demo accounts

### Development Issues
- **Port Conflicts:** Frontend auto-switches to available ports (5173, 5174, 5175)
- **API Connection:** Check if both frontend and API servers are running
- **Environment Variables:** Ensure both `SUPABASE_*` and `VITE_SUPABASE_*` are set

## 📄 License

This project is licensed under the MIT License.

## 🤝 Support

For support and questions, please refer to the documentation or contact the development team.

---

**Built with ❤️ using React 19, Supabase, and modern web technologies**

