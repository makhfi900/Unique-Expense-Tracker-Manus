# Development Setup Guide

This guide covers the dual-environment development setup for the Unique Expense Tracker application.

## 🏗️ Architecture Overview

The project uses a **dual-environment approach**:

- **Development**: Express.js server for local API development
- **Production**: Netlify Functions for serverless deployment

This provides the best of both worlds: fast local development with reliable production deployment.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- pnpm (for frontend)
- Supabase account with database set up

### 1. Install Dependencies
```bash
# Install root and frontend dependencies
npm run install-all
```

### 2. Environment Configuration
```bash
# Copy environment template
cp .env.example .env

# Update .env with your Supabase credentials:
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d
NODE_ENV=development
PORT=3001
```

### 3. Database Setup
1. Run the SQL schema in your Supabase project:
   ```sql
   -- Execute: database/schema.sql
   ```
2. This creates all tables, default users, and sample data

### 4. Start Development Servers

**Option A: Start both servers together**
```bash
npm run dev:full
```

**Option B: Start servers separately**
```bash
# Terminal 1: Start API server
npm run api

# Terminal 2: Start frontend
npm run dev
```

## 🌐 Development URLs

- **Frontend**: http://localhost:5173/ (or port shown in terminal)
- **API Server**: http://localhost:3001/api
- **API Health Check**: http://localhost:3001/api/health

## 👥 Test Accounts

### Administrator
- **Email**: admin@test.com
- **Password**: admin123
- **Access**: Full system access, user management, analytics

### Account Officer
- **Email**: officer@test.com
- **Password**: officer123
- **Access**: Personal expense management, date filtering

## 🔧 Development Commands

```bash
# Development
npm run api              # Start Express API server
npm run dev:api          # Start API server with auto-reload
npm run dev              # Start frontend only
npm run dev:full         # Start both API and frontend

# Production Build
npm run build            # Build frontend for production

# Dependencies
npm run install-all      # Install all dependencies
```

## 📁 Project Structure

### Backend (Development)
- `api-server.js` - Express server for local development
- `netlify/functions/api.js` - Netlify Functions for production
- `.env` - Environment variables

### Frontend
- `frontend/src/context/AuthContext.jsx` - API configuration
- `frontend/src/components/` - React components
- `frontend/dist/` - Production build output

### Database
- `database/schema.sql` - Complete database schema with sample data

## 🔄 Environment Switching

The application automatically detects the environment:

### Development Mode
- **API**: Express server at `http://localhost:3001/api`
- **Frontend**: Vite dev server with hot reload
- **Database**: Supabase (same as production)

### Production Mode
- **API**: Netlify Functions at `/.netlify/functions/api`
- **Frontend**: Static files served by Netlify
- **Database**: Supabase (same as development)

## 📊 API Endpoints

All endpoints are available in both development and production:

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Create user (Admin only)

### Users & Activities
- `GET /api/users` - List users (Admin only)
- `PUT /api/users/:id` - Update user (Admin only)
- `GET /api/login-activities` - Login tracking (Admin only)

### Categories
- `GET /api/categories` - List categories
- `POST /api/categories` - Create category
- `PUT /api/categories/:id` - Update category (Admin only)

### Expenses
- `GET /api/expenses` - List expenses (role-filtered)
- `POST /api/expenses` - Create expense
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense

### Analytics
- `GET /api/analytics/spending-trends` - Spending trends
- `GET /api/analytics/category-breakdown` - Category breakdown

### Export
- `GET /api/expenses/export` - Export expenses to CSV

## 🐛 Troubleshooting

### Common Issues

**Port Already in Use**
```bash
# Kill processes on ports
pkill -f "node api-server"
pkill -f "vite"

# Or use different ports
PORT=3002 npm run api
```

**Database Connection Issues**
- Verify Supabase credentials in `.env`
- Check if database schema is properly executed
- Ensure RLS policies are set up correctly

**Frontend Not Connecting to API**
- Check `AuthContext.jsx` API_BASE_URL configuration
- Verify Express server is running on port 3001
- Check browser console for CORS errors

**Missing Dependencies**
```bash
# Reinstall everything
rm -rf node_modules frontend/node_modules
npm run install-all
```

### Development vs Production

| Feature | Development | Production |
|---------|-------------|------------|
| API Server | Express.js (Port 3001) | Netlify Functions |
| Frontend | Vite Dev Server | Netlify Static Hosting |
| Hot Reload | ✅ Yes | ❌ No |
| Build Time | Fast | Standard |
| Debugging | Easy | Standard |

## 🚀 Deployment

When ready to deploy:

1. **Code is ready** - No changes needed for production
2. **Push to GitHub** - Netlify auto-deploys from main branch
3. **Environment Variables** - Set in Netlify dashboard
4. **Build Settings** - Already configured in netlify.toml

The development Express server is never deployed - production uses the existing Netlify Functions.

## 📝 Notes

- **Express server**: Only for local development, provides better debugging
- **Netlify Functions**: Production-ready, serverless, automatically scales
- **Environment detection**: Automatic based on NODE_ENV
- **Database**: Same Supabase instance for both environments
- **Authentication**: JWT tokens work identically in both environments

This setup provides a seamless development experience while maintaining production reliability.