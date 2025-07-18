# Project Structure

## 📁 Folder Organization

### Root Level
- **`README.md`** - Project overview and setup instructions
- **`CLAUDE.md`** - Development commands and architecture guide
- **`package.json`** - Root project dependencies and scripts
- **`netlify.toml`** - Netlify deployment configuration
- **`.gitignore`** - Git ignore rules

### 📂 Core Application
- **`frontend/`** - React frontend application
  - `src/components/` - React components
  - `src/context/` - Context providers (Auth, etc.)
  - `src/lib/` - Utility libraries
  - `src/utils/` - Helper functions
- **`api-server.js`** - Express.js development server
- **`netlify/functions/`** - Netlify serverless functions for production

### 📂 Database
- **`database/`** - Database schemas and migrations
  - `schema.sql` - Main database schema
  - `supabase_auth_schema.sql` - Supabase authentication schema
  - `supabase_auth_schema_fixed.sql` - Fixed version with RLS policies
  - `performance_optimizations.sql` - Database performance improvements

### 📂 Documentation
- **`docs/`** - All project documentation
  - `AUTHENTICATION_SUCCESS_SUMMARY.md` - Auth implementation details
  - `BRANCHING_STRATEGY.md` - Git workflow and branching strategy
  - `DEPLOYMENT_GUIDE.md` - Deployment instructions
  - `TODO.md` - Project roadmap and pending tasks
  - `github-issues/` - GitHub issue templates
  - And other documentation files...

### 📂 Tools & Scripts
- **`tools/`** - Development and maintenance scripts
  - `set-demo-password.js` - Set up demo account passwords
  - `create-demo-users.js` - Create demo users in Supabase
  - `apply-supabase-schema.js` - Apply database schema

### 📂 Tests
- **`tests/`** - Testing scripts and utilities
  - `test-auth-complete.js` - Complete authentication system test
  - `test-frontend-auth.js` - Frontend authentication flow test
  - `test-supabase-connection.js` - Database connection test
  - `debug-role-issue.js` - Debug role detection issues

## 🏗️ Architecture

### Frontend (React 19 + Vite)
- **Framework**: React 19 with Vite build tool
- **UI Components**: shadcn/ui with Radix UI primitives
- **Styling**: Tailwind CSS v4
- **State Management**: React Context API
- **Charts**: Recharts for analytics

### Backend (Dual Environment)
- **Development**: Express.js server on port 3001
- **Production**: Netlify serverless functions
- **Database**: Supabase PostgreSQL
- **Authentication**: Supabase Auth with Row Level Security

### Database Schema
- **Users**: Role-based access (admin/account_officer)
- **Categories**: Expense categories with color coding
- **Expenses**: Expense records with full CRUD
- **Login Activities**: Audit trail for user access

## 🚀 Quick Start

```bash
# Install dependencies
npm install
cd frontend && pnpm install

# Start development servers
npm run dev:api          # Backend on :3001
cd frontend && pnpm run dev    # Frontend on :5173

# Run tests
node tests/test-auth-complete.js
```

## 📋 Environment Variables

Required in `.env`:
```bash
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_SECRET=your_jwt_secret
```

## 🔧 Development Tools

- **Authentication Testing**: `tests/test-auth-complete.js`
- **Demo Setup**: `tools/set-demo-password.js`
- **Database Setup**: `tools/apply-supabase-schema.js`

## 📚 Documentation

All documentation is organized in the `docs/` folder:
- Implementation guides
- API documentation
- Deployment instructions
- Troubleshooting guides

This structure provides clear separation of concerns and makes the project easy to navigate and maintain.