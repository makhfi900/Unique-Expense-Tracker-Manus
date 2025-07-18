# GitHub Issues Setup Guide

## 🎯 Create GitHub Issues for the Project

I've prepared comprehensive GitHub issues for the two problems you identified. Here's how to create them:

## 📋 Issues Ready to Create

### Issue #1: Admin Role Detection Bug
- **Priority**: High
- **File**: `github-issues/issue-1-admin-role-bug.md`
- **Labels**: bug, authentication, role-management, high-priority, frontend

### Issue #2: Currency Localization (USD to PKR)  
- **Priority**: Medium
- **File**: `github-issues/issue-2-currency-localization.md`
- **Labels**: enhancement, localization, currency, frontend, backend, medium-priority

## 🚀 Option 1: Manual Creation (Recommended)

### Step 1: Open GitHub Issues Page
Go to: https://github.com/makhfi900/Unique-Expense-Tracker-Manus/issues/new

### Step 2: Create Issue #1
1. **Title**: `Admin user shows as Account Officer after login`
2. **Body**: Copy content from `github-issues/issue-1-admin-role-bug.md`
3. **Labels**: Add `bug`, `authentication`, `role-management`, `high-priority`, `frontend`
4. Click "Submit new issue"

### Step 3: Create Issue #2
1. **Title**: `Replace USD references with PKR currency for Pakistan localization`
2. **Body**: Copy content from `github-issues/issue-2-currency-localization.md`
3. **Labels**: Add `enhancement`, `localization`, `currency`, `frontend`, `backend`, `medium-priority`
4. Click "Submit new issue"

## 🤖 Option 2: Automated Creation via API

### Step 1: Get GitHub Personal Access Token
1. Go to: https://github.com/settings/tokens
2. Click "Generate new token" → "Generate new token (classic)"
3. Give it a name: "Issue Creator"
4. Select scopes: `repo` (Full control of private repositories)
5. Click "Generate token"
6. Copy the token (it starts with `ghp_`)

### Step 2: Run the Creation Script
```bash
# Set your GitHub token
export GITHUB_TOKEN=your_token_here

# Run the script
node create-issues-api.js
```

## 📱 Option 3: Using GitHub CLI (if available)

If you have GitHub CLI installed:
```bash
# Login to GitHub
gh auth login

# Run the creation script
./create-github-issues.sh
```

## 🔧 Quick Fix Available

For Issue #1 (Admin Role Bug), there's an immediate fix:

**File**: `frontend/src/components/Dashboard.jsx`
**Line**: 48
**Change**: 
```javascript
// Before
role: user?.role,

// After  
role: user?.user_metadata?.role,
```

**Apply with patch**:
```bash
git apply quick-fix-admin-role.patch
```

## 📋 Issue Content Preview

### Issue #1 - Admin Role Bug
```markdown
# Admin user shows as Account Officer after login

## Bug Description
When logging in with admin credentials (admin@test.com / admin123), the user interface shows the user as an Account Officer instead of Admin...

[Full content in github-issues/issue-1-admin-role-bug.md]
```

### Issue #2 - Currency Localization  
```markdown
# Replace USD references with PKR currency for Pakistan localization

## Feature Request
Update the application to use Pakistani Rupees (PKR) instead of USD as the default currency...

[Full content in github-issues/issue-2-currency-localization.md]
```

## ✅ Next Steps

1. **Create the issues** using your preferred method above
2. **Apply the quick fix** for Issue #1 if needed immediately
3. **Plan development** - Issue #1 is high priority, Issue #2 is medium priority

The issues are well-documented with technical details, acceptance criteria, and clear steps to reproduce/implement.