# Git Branching Strategy

## Overview
This project follows a feature-branch workflow with `dev` as the main development branch.

## Branch Structure

### Main Branches
- **`main`** - Production-ready code, stable releases
- **`dev`** - Main development branch, integration of features

### Feature Branches
- **`feature/[feature-name]`** - New features and improvements
- **`hotfix/[fix-name]`** - Critical bug fixes for production
- **`bugfix/[bug-name]`** - Bug fixes for development

## Workflow

### For New Features
1. **Create branch from `dev`**:
   ```bash
   git checkout dev
   git pull origin dev
   git checkout -b feature/your-feature-name
   ```

2. **Develop your feature**:
   ```bash
   # Make your changes
   git add .
   git commit -m "Add new feature functionality"
   ```

3. **Push and create PR**:
   ```bash
   git push -u origin feature/your-feature-name
   # Create PR to merge into dev
   ```

4. **After review and testing**:
   ```bash
   # PR gets merged into dev
   # Delete feature branch
   git branch -d feature/your-feature-name
   git push origin --delete feature/your-feature-name
   ```

### For Bug Fixes
1. **Create branch from `dev`**:
   ```bash
   git checkout dev
   git pull origin dev
   git checkout -b bugfix/issue-description
   ```

2. **Follow same workflow as features**

### For Hotfixes
1. **Create branch from `main`**:
   ```bash
   git checkout main
   git pull origin main
   git checkout -b hotfix/critical-fix
   ```

2. **After fix, merge to both `main` and `dev`**:
   ```bash
   # Create PR to main for immediate fix
   # Create PR to dev to include fix in development
   ```

## Current Branches

### Active Branches
- **`dev`** - Main development branch (renamed from `feature/initial_setup`)
- **`feature/admin_dashboard`** - Complete admin dashboard with authentication system
- **`main`** - Production branch

## Completed Features

### ✅ Admin Dashboard (`feature/admin_dashboard`)
- **Authentication System**: Fixed infinite recursion in RLS policies
- **User Management**: Admin can create/manage users and roles
- **Expense Management**: Full CRUD operations for expenses
- **Category Management**: Create/edit/delete expense categories
- **Analytics**: Enhanced reporting with date range filtering
- **CSV Import/Export**: Bulk operations with progress indicators
- **Login Activity Tracking**: Monitor user access and behavior

**Status**: Ready for review and merge to `dev`

## Best Practices

### Commit Messages
- Use clear, descriptive commit messages
- Reference issue numbers when applicable
- Include co-author attribution for Claude Code assistance:
  ```
  🤖 Generated with [Claude Code](https://claude.ai/code)
  
  Co-Authored-By: Claude <noreply@anthropic.com>
  ```

### Pull Requests
- **Title**: Clear description of what the PR does
- **Description**: 
  - Summary of changes
  - Test plan
  - Screenshots (if UI changes)
- **Review**: All PRs require review before merging
- **Testing**: Ensure all tests pass before merging

### Branch Naming
- Use descriptive names: `feature/user-authentication`, `bugfix/login-error`
- Use kebab-case for branch names
- Keep names concise but descriptive

## Testing Strategy
- **Unit Tests**: Test individual components and functions
- **Integration Tests**: Test feature workflows end-to-end
- **Manual Testing**: Verify UI/UX and user workflows
- **Database Tests**: Verify data integrity and performance

## Deployment
- **Development**: Auto-deploy `dev` branch to staging environment
- **Production**: Manual deployment from `main` branch after testing
- **Rollback**: Keep ability to quickly rollback via git tags

## Tools & Scripts
- **Authentication Testing**: `test-auth-complete.js`
- **Database Setup**: `apply-rls-fix.js`, `set-demo-password.js`
- **Development**: `npm run dev:api`, `cd frontend && pnpm run dev`

---

**Last Updated**: Current admin dashboard implementation complete
**Next Sprint**: Planning additional features from `TODO.md`