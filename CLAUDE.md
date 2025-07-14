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
# Execute the database schema (manually via Supabase dashboard)
# File: database/schema.sql
```

## Project Architecture

### Dual-Environment Setup
- **Development**: Express.js server for fast local development
- **Production**: Netlify Functions for serverless deployment
- **Environment Detection**: Automatic switching based on NODE_ENV

### Frontend Structure
- **React 19** with Vite build tool
- **shadcn/ui** components with Radix UI primitives
- **Tailwind CSS v4** for styling
- **Context API** for state management (AuthContext)
- **React Router v7** for navigation (single-page app architecture)
- **Recharts** for data visualization

### Backend Architecture
- **Development**: Express.js server (`api-server.js`) on port 3001
- **Production**: Netlify Serverless Functions (`netlify/functions/api.js`)
- **Database**: Supabase PostgreSQL with Row Level Security
- **Authentication**: JWT with bcryptjs password hashing

### Key Components
- `frontend/src/App.jsx` - Main app component with conditional rendering
- `frontend/src/context/AuthContext.jsx` - Authentication state management
- `frontend/src/components/Dashboard.jsx` - Main dashboard with tabbed interface
- `netlify/functions/api.js` - All backend API routes in single function

### Database Schema
- **users** - User accounts with role-based access (admin/account_officer)
- **categories** - Expense categories with color coding
- **expenses** - Expense records with foreign keys to users and categories
- **login_activities** - Login tracking for audit purposes

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
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
JWT_SECRET=your_jwt_secret_key
```

### Key Features Implementation
- **CSV Import/Export**: Handled in `CSVImportExport.jsx` component
- **Analytics**: Date-range filtering with Recharts visualizations
- **Authentication**: JWT tokens stored in localStorage with automatic verification
- **Responsive Design**: Mobile-first approach with Tailwind breakpoints

### Testing Accounts
- Admin: admin@expensetracker.com / admin123
- Account Officer: officer@expensetracker.com / officer123

### Package Managers
- Root project: npm
- Frontend: pnpm (configured via packageManager field)

### Deployment
- **Frontend**: Netlify static hosting from `frontend/dist`
- **Backend**: Netlify Functions auto-deploy
- **Database**: Supabase managed PostgreSQL
- Build command: `cd frontend && pnpm install && pnpm run build`
- Publish directory: `frontend/dist`