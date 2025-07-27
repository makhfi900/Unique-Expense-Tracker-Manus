# Supabase Database Schema Application Instructions

The programmatic schema application failed as expected, since Supabase client doesn't support direct SQL execution for schema operations. Please apply the schema manually via the Supabase Dashboard.

## Steps to Apply the Schema

### 1. Open Supabase Dashboard
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sign in to your account
3. Select your project

### 2. Navigate to SQL Editor
1. In the left sidebar, click on **"SQL Editor"**
2. Click on **"New query"** to create a new SQL query

### 3. Copy and Execute the Schema
**Choose the right version based on your situation:**

**Option A - If you have existing tables (users table already exists):**
1. Copy the entire contents of `database/supabase_auth_schema_update.sql`
2. Paste it into the SQL Editor
3. Click **"Run"** to execute the schema

**Option B - Fresh Database:**
1. Copy the entire contents of `database/supabase_auth_schema_minimal.sql`
2. Paste it into the SQL Editor
3. Click **"Run"** to execute the schema

**Option C - If you get "must be owner" errors:**
1. Copy the entire contents of `database/supabase_auth_schema_safe.sql`
2. Paste it into the SQL Editor
3. Click **"Run"** to execute the schema

**Option D - Original Schema (if no issues):**
1. Copy the entire contents of `database/supabase_auth_schema.sql`
2. Paste it into the SQL Editor
3. Click **"Run"** to execute the schema

**Since you're getting "users table already exists", start with Option A (update version).**

### 4. Verify Schema Application
After running the schema, you should see:
- ✅ Tables created: `users`, `categories`, `expenses`, `login_activities`
- ✅ Functions created: `handle_new_user()`, `update_updated_at_column()`, etc.
- ✅ Triggers created: `on_auth_user_created`, etc.
- ✅ RLS policies enabled and configured
- ✅ Default categories inserted

### 5. Create Demo Users
After the schema is applied, create the demo users:

```bash
node scripts/create-demo-users.js setup
```

### 6. Test the Application
Start the application and test authentication:

```bash
npm run dev:full
```

Then visit `http://localhost:5173` and test the demo login buttons.

## Expected Results

### Demo Accounts Available
- **Admin**: admin@test.com / admin123
- **Account Officer**: officer@test.com / officer123

### Key Features Enabled
- ✅ Supabase Authentication integration
- ✅ Automatic user profile creation via triggers
- ✅ Row Level Security (RLS) policies
- ✅ Role-based access control
- ✅ Secure session management

### Database Tables Created
1. **users** - Linked to `auth.users` with automatic profile creation
2. **categories** - Pre-populated with 9 default expense categories
3. **expenses** - Expense tracking with user and category relationships
4. **login_activities** - Login tracking for audit purposes

## Troubleshooting

### If Schema Application Fails
- Check that you have the correct permissions in Supabase
- Ensure you're using the SQL Editor with admin privileges
- Try applying the schema in smaller chunks if needed

### If Demo Users Already Exist
The create-demo-users script will skip existing users, so it's safe to run multiple times.

### If Authentication Doesn't Work
1. Verify the schema was applied successfully
2. Check that demo users were created in Supabase Auth
3. Ensure environment variables are set correctly in `.env`

## Next Steps After Schema Application
1. ✅ Test authentication with demo accounts
2. ✅ Update backend API to use Supabase Auth (next todo item)
3. ✅ Implement remaining features (budget management, compliance tracking)