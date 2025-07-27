# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Installation
```bash
# Install all dependencies (root and frontend)
npm run install-all

# Install frontend dependencies only
cd frontend && pnpm install
```

### Development
```bash
# Quick start - both API and frontend
npm run dev:full

# Or start separately:
npm run api              # Start Express API server (port 3001)
npm run dev:api          # Start API server with auto-reload
npm run dev              # Start frontend only (port 5173)

# Legacy Netlify development (for production testing)
netlify dev
```

### Build and Deploy
```bash
# Build frontend for production
npm run build

# Lint frontend code
cd frontend && pnpm run lint

# Preview production build locally
cd frontend && pnpm run preview
```

### Database Setup
```bash
# IMPORTANT: Execute the database schema via Supabase dashboard in this order:

# 1. Main Schema Setup:
# File: database/supabase_auth_schema_fixed.sql
# This includes complete schema, RLS policies, triggers, and test users

# 2. Performance Optimizations (optional but recommended):
# File: database/performance_optimizations.sql
# This includes materialized views, composite indexes, and analytics functions

# Steps to apply schema:
# 1. Go to Supabase Dashboard → SQL Editor
# 2. Copy contents of database/supabase_auth_schema_fixed.sql
# 3. Paste and execute the SQL
# 4. Copy contents of database/performance_optimizations.sql  
# 5. Paste and execute the SQL
# 6. Verify success messages in output
# 7. Test creating users via Dashboard → Authentication → Users

# Test Credentials (created by schema):
# Admin: admin1@test.com / admin123
# Officer: officer1@test.com / officer123
```

## Project Architecture

### Authentication System Evolution
**IMPORTANT**: The application has migrated from custom JWT to Supabase Auth:
- **Current Implementation**: Uses `SupabaseApp.jsx` and `SupabaseAuthContext.jsx`
- **Legacy Implementation**: `App.jsx` and `AuthContext.jsx` (deprecated but preserved)
- **Main Entry Point**: `frontend/src/main.jsx` imports `SupabaseApp.jsx`
- **Backend Compatibility**: Express server maintains JWT endpoints for development testing

### Dual-Environment Setup
- **Development**: Express.js server for fast local development
- **Production**: Netlify Functions for serverless deployment
- **Environment Detection**: Automatic switching based on NODE_ENV

### Frontend Structure
- **React 19** with Vite build tool and React.lazy() for component lazy loading
- **shadcn/ui** components with Radix UI primitives
- **Tailwind CSS v4** with @tailwindcss/vite plugin for styling
- **Context API** for state management (SupabaseAuthContext with analytics methods)
- **React Router v7** for navigation (single-page app architecture)
- **Recharts** for data visualization and analytics charts
- **Performance Optimizations**: React.memo(), useMemo(), and Suspense for optimal rendering

### Backend Architecture
- **Development**: Express.js server (`api-server.js`) on port 3001
- **Production**: Netlify Serverless Functions (`netlify/functions/api.js`)
- **Database**: Supabase PostgreSQL with Row Level Security (RLS) and materialized views
- **Authentication**: **Supabase Auth** (migrated from custom JWT) with automatic user profile creation
- **API Architecture**: Identical endpoint logic in both Express and Netlify function implementations
- **Environment Detection**: Automatic API_BASE_URL switching based on `import.meta.env.DEV`

### Key Components
- `frontend/src/SupabaseApp.jsx` - **Main app entry point** (Supabase Auth implementation)
- `frontend/src/App.jsx` - Legacy app component (custom JWT - deprecated)
- `frontend/src/main.jsx` - React root with SupabaseApp as primary component
- `frontend/src/context/SupabaseAuthContext.jsx` - **Primary auth context** with analytics methods
- `frontend/src/components/Dashboard.jsx` - Main dashboard with lazy-loaded tabbed interface
- `frontend/src/lib/supabase.js` - Supabase client configuration
- `netlify/functions/api.js` - All backend API routes in single serverless function
- `api-server.js` - Express.js development server with identical API logic

### Database Schema
- **users** - User accounts linked to `auth.users` with role-based access (admin/account_officer)
- **categories** - Expense categories with color coding, ownership tracking, and soft deletes
- **expenses** - Expense records with foreign keys, constraints, and soft deletes (`is_active` flag)
- **login_activities** - Login tracking for audit purposes with device/browser detection
- **Schema Files**: 
  - `database/supabase_auth_schema_fixed.sql` - Complete schema with RLS policies and test users
  - `database/performance_optimizations.sql` - Materialized views and performance indexes
- **Security**: Row Level Security (RLS) policies for role-based data access
- **Performance**: Comprehensive indexes and materialized views for analytics

### Role-Based Access Control
- **Admin**: Full system access, user management, analytics, category creation
- **Account Officer**: Personal expense management with date-specific filtering

### API Endpoint Structure
All API routes are handled through `/.netlify/functions/api` with path-based routing:
- `POST /auth/login` - User authentication
- `GET|POST /users` - User management (Admin only)
- `GET|POST|PUT /categories` - Category management
- `GET|POST|PUT|DELETE /expenses` - Expense CRUD operations
- `GET /analytics/*` - Analytics endpoints (Admin only)

### Environment Variables Required
```bash
# Backend/Development Environment
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
JWT_SECRET=your_jwt_secret_key  # Legacy - used by Express server

# Frontend Environment (Vite)
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Production (Netlify)
# Set same variables in Netlify Dashboard → Site Settings → Environment Variables
```

### Key Features Implementation
- **CSV Import/Export**: Handled in `CSVImportExport.jsx` component
- **Analytics**: Date-range filtering with Recharts visualizations
- **Authentication**: Supabase Auth tokens with automatic session management and refresh
- **Responsive Design**: Mobile-first approach with Tailwind breakpoints

### Testing Accounts
- Admin: admin@test.com / admin123
- Account Officer: officer@test.com / officer123

### TypeScript Configuration
- **Frontend**: Configured with Vite TypeScript support
- **Components**: JSX files with PropTypes for type checking
- **API**: TypeScript-style JSDoc comments for better IDE support

### Package Managers
- Root project: npm
- Frontend: pnpm (configured via packageManager field)

### Deployment
- **Frontend**: Netlify static hosting from `frontend/dist`
- **Backend**: Netlify Functions auto-deploy
- **Database**: Supabase managed PostgreSQL
- Build command: `cd frontend && pnpm install && pnpm run build`
- Publish directory: `frontend/dist`
- **Configuration**: `netlify.toml` handles redirects and CORS headers

### Development Workflow & Important Notes

#### **File Structure Priority**
- **Main App**: `frontend/src/SupabaseApp.jsx` (current)
- **Auth Context**: `frontend/src/context/SupabaseAuthContext.jsx` (current)
- **Database Schemas**: 
  - `database/supabase_auth_schema_fixed.sql` (main schema)
  - `database/performance_optimizations.sql` (performance enhancements)
- **API Implementation**: Both `api-server.js` and `netlify/functions/api.js` must be kept in sync

#### **Environment-Specific Behavior**
- **Development**: Frontend connects to Express server on localhost:3001
- **Production**: Frontend connects to Netlify functions via /.netlify/functions/api
- **API Detection**: Automatic based on `import.meta.env.DEV` in SupabaseAuthContext

#### **Performance Considerations**
- **Component Loading**: Uses React.lazy() and Suspense for code splitting
- **Re-rendering**: React.memo() and useMemo() prevent unnecessary updates
- **Database**: Materialized views and indexes for analytics queries
- **Package Management**: pnpm for faster dependency management

#### **Security Architecture**
- **Database Level**: Row Level Security (RLS) policies enforce permissions
- **Application Level**: Role-based component rendering and API filtering
- **Authentication**: Supabase Auth handles tokens, sessions, and security
- **API Security**: All endpoints require valid Supabase Auth tokens