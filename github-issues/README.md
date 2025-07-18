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

## Quick Fix Available

For Issue #1, the fix is simple:

**File**: `frontend/src/components/Dashboard.jsx`
**Line**: 48
**Change**: `role: user?.role,` → `role: user?.user_metadata?.role,`

This can be implemented immediately as a hotfix.