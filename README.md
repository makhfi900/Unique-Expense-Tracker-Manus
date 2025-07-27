# Unique Expense Tracker

A full-stack expense tracking application with role-based access control, data visualization, and CSV import/export capabilities.

## 🚀 Live Demo

**Deployed Application:** [https://hrjxtqlv.manus.space](https://hrjxtqlv.manus.space)

## 📋 Features

### Core Features
- **JWT-based Authentication** with role-based access control
- **Two User Roles:**
  - **Admin:** Full access to all features, user management, and system-wide analytics
  - **Account Officer:** Limited access to personal expenses and date-specific filtering
- **Expense Management:** Create, read, update, and delete expenses
- **Category Management:** Custom expense categories with color coding
- **Data Visualization:** Interactive charts for spending trends and category breakdowns
- **CSV Import/Export:** Bulk data operations for expense records
- **Responsive Design:** Works seamlessly on desktop and mobile devices

### Advanced Features
- **Monthly/Yearly Spending Trends** with interactive charts
- **Category-wise Expense Breakdown** with pie and bar charts
- **Date-based Filtering** for Account Officers
- **Real-time Data Updates** across all components
- **Professional UI** built with shadcn/ui and Tailwind CSS

## 🏗️ Architecture

### Frontend
- **React 18** with modern hooks and context API
- **Vite** for fast development and optimized builds
- **Tailwind CSS** for responsive styling
- **shadcn/ui** for consistent UI components
- **Recharts** for data visualization
- **Lucide React** for icons

### Backend
- **Netlify Serverless Functions** for API endpoints
- **Node.js** runtime environment
- **JWT** for authentication and authorization
- **bcryptjs** for password hashing

### Database
- **Supabase PostgreSQL** with Row Level Security (RLS)
- **Structured schema** with proper relationships and constraints
- **Automatic timestamps** and data validation

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
   - Run the SQL schema from `database/schema.sql`
   - Get your project URL and API keys

4. **Configure environment variables:**
   ```bash
   # Copy the example file
   cp .env.example .env
   
   # Update with your Supabase credentials
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   JWT_SECRET=your_jwt_secret_key
   ```

5. **Start development servers:**
   ```bash
   # Start frontend (from frontend directory)
   pnpm run dev --host
   
   # Start Netlify functions (from root directory)
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
- **Email:** admin@test.com
- **Password:** admin123
- **Permissions:** Full system access, user management, analytics

### Account Officer
- **Email:** officer@test.com
- **Password:** officer123
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

- **JWT Authentication** with secure token management
- **Password Hashing** using bcryptjs
- **Row Level Security (RLS)** in Supabase
- **Role-based Access Control** throughout the application
- **Input Validation** on both frontend and backend
- **CORS Protection** for API endpoints

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

## 📄 License

This project is licensed under the MIT License.

## 🤝 Support

For support and questions, please refer to the documentation or contact the development team.

---

**Built with ❤️ using React, Netlify, and Supabase**

