# GitHub Issues - Ready to Create

## Issue #1: Admin Role Detection Bug

**File**: `issue-1-admin-role-bug.md`

**Summary**: Admin users show as "Account Officer" in the UI due to incorrect role extraction from user metadata.

**Root Cause**: In `Dashboard.jsx` line 48, the code uses `user?.role` but should use `user?.user_metadata?.role`.

**Priority**: High - Affects admin functionality

---

## Issue #2: Currency Localization (USD to PKR)

**File**: `issue-2-currency-localization.md`

**Summary**: Replace all USD references with Pakistani Rupees (PKR) for local market.

**Scope**: Frontend, backend, and database currency references

**Priority**: Medium - Localization improvement

---

## Issue #3: Admin Dashboard UI Improvements

**File**: `issue-3-admin-dashboard-ui-improvements.md`

**Summary**: Various UI/UX improvements for admin dashboard including expense filtering, analytics enhancements, and mobile responsiveness.

**Priority**: Medium - User experience improvements

---

## Issue #4: UI Bugs and CORS Issues

**File**: `issue-4-ui-bugs.md`

**Summary**: Collection of UI bugs including CORS policy errors, authentication issues, and tab functionality problems.

**Status**: ✅ **RESOLVED** - CORS issues fixed, tab switching working, admin access restored

**Priority**: High - Core functionality issues

---

## Issue #5: Analytics Date Range Filtering Problem

**File**: `issue-5-analytics-date-range-filtering.md`

**Summary**: Analytics tab shows empty data (Rs 0.00) because default date range is too narrow and excludes sample expense data.

**Root Cause**: Default "This Month" preset creates filter from 2025-06-30 to 2025-07-27, excluding most sample data from Jan-Jul 2025.

**Priority**: Medium - Analytics functionality needs better default settings

---

## Issue #6: Login Activity Network Error

**File**: `issue-6-login-activity-network-error.md`

**Summary**: Login Activity tab displays "Network error. Please try again." and shows no data despite sample login activities existing in database.

**Root Cause**: API endpoint `/api/login-activities` is failing, possibly due to authentication or RLS policy issues.

**Priority**: High - Core admin security monitoring functionality broken

---

## How to Create These Issues

### Option 1: Manual Creation
1. Go to https://github.com/makhfi900/Unique-Expense-Tracker-Manus/issues/new
2. Copy the content from each markdown file
3. Paste as issue title and description
4. Add appropriate labels

### Option 2: Using GitHub CLI (if available)
```bash
# Install GitHub CLI if not available
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update
sudo apt install gh

# Login to GitHub
gh auth login

# Create issues
gh issue create --title "Admin user shows as Account Officer after login" --body-file github-issues/issue-1-admin-role-bug.md --label "bug,authentication,high-priority"
gh issue create --title "Replace USD references with PKR currency for Pakistan localization" --body-file github-issues/issue-2-currency-localization.md --label "enhancement,localization,medium-priority"
gh issue create --title "Analytics shows empty data due to narrow date range filtering" --body-file github-issues/issue-5-analytics-date-range-filtering.md --label "bug,analytics,medium-priority"
gh issue create --title "Login Activity displays network error and no data" --body-file github-issues/issue-6-login-activity-network-error.md --label "bug,api,security,high-priority"
```

## Issue Labels to Use

### Issue #1 Labels:
- `bug`
- `authentication`
- `role-management`
- `high-priority`
- `frontend`

### Issue #2 Labels:
- `enhancement`
- `localization`
- `currency`
- `frontend`
- `backend`
- `medium-priority`

### Issue #5 Labels:
- `bug`
- `analytics`
- `frontend`
- `date-filtering`
- `medium-priority`

### Issue #6 Labels:
- `bug`
- `api`
- `security`
- `backend`
- `login-activity`
- `high-priority`

## Quick Fix Available

For Issue #1, the fix is simple:

**File**: `frontend/src/components/Dashboard.jsx`
**Line**: 48
**Change**: `role: user?.role,` → `role: user?.user_metadata?.role,`

This can be implemented immediately as a hotfix.