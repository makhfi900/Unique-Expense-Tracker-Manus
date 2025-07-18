# Admin user shows as Account Officer after login

## Bug Description
When logging in with admin credentials (admin@test.com / admin123), the user interface shows the user as an Account Officer instead of Admin, despite having the correct role in both the database and auth metadata.

## Steps to Reproduce
1. Go to http://localhost:5173
2. Login with credentials:
   - Email: admin@test.com
   - Password: admin123
3. Observe that the dashboard shows user as "Account Officer" instead of "Admin"

## Expected Behavior
- User should be recognized as Admin
- Admin-specific features should be available
- Role display should show "Admin"

## Current Behavior
- User is shown as Account Officer
- Admin features may not be accessible
- Incorrect role display in UI

## Technical Details
- **Database role**: `admin` (verified in users table)
- **Auth metadata role**: `admin` (verified in user_metadata)
- **Frontend role detection**: Issue in `SupabaseAuthContext.jsx` lines 218-219

## Root Cause Analysis
The role detection logic in `SupabaseAuthContext.jsx` might not be properly checking the database user profile:

```javascript
// Current logic only checks metadata
const isAdmin = user?.user_metadata?.role === 'admin' || user?.app_metadata?.role === 'admin'
const isAccountOfficer = user?.user_metadata?.role === 'account_officer' || user?.app_metadata?.role === 'account_officer'
```

## Verified Data
**Auth user_metadata:**
```json
{
  "email_verified": true,
  "full_name": "System Administrator",
  "role": "admin"
}
```

**Database user record:**
```json
{
  "id": "a3fc8908-d1b2-40f1-bb5f-8df90be90102",
  "email": "admin@test.com",
  "role": "admin",
  "full_name": "System Administrator",
  "is_active": true
}
```

## Suggested Fix
1. Fetch user profile from database during authentication
2. Use database role as source of truth for role detection
3. Update role detection logic to check database user profile
4. Consider caching database user profile in auth context

## Files to Modify
- `frontend/src/context/SupabaseAuthContext.jsx`
- Potentially components that rely on role detection

## Priority
**High** - Affects core admin functionality and user experience

## Labels
- bug
- authentication
- role-management
- high-priority
- frontend

## Acceptance Criteria
- [ ] Admin user (admin@test.com) shows as Admin in UI
- [ ] Role-based features work correctly for Admin users
- [ ] Database user profile is properly fetched and used
- [ ] Role detection logic is robust and reliable