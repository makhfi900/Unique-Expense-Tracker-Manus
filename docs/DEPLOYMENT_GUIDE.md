# Deployment Guide - Unique Expense Tracker

This guide will walk you through deploying your own instance of the Unique Expense Tracker application.

## 📋 Prerequisites

Before you begin, ensure you have:
- A Supabase account (free tier available)
- A Netlify account (free tier available)
- Git repository hosting (GitHub, GitLab, etc.)
- Basic knowledge of environment variables

## 🗄️ Step 1: Set Up Supabase Database

### 1.1 Create a Supabase Project
1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization
4. Enter project name: "unique-expense-tracker"
5. Enter a secure database password
6. Select a region close to your users
7. Click "Create new project"

### 1.2 Set Up the Database Schema
1. Wait for your project to be ready (2-3 minutes)
2. Go to the SQL Editor in your Supabase dashboard
3. Copy the entire content from `database/schema.sql`
4. Paste it into the SQL Editor
5. Click "Run" to execute the schema

### 1.3 Get Your Supabase Credentials
1. Go to Settings → API in your Supabase dashboard
2. Copy the following values:
   - **Project URL** (e.g., `https://abcdefgh.supabase.co`)
   - **Anon/Public Key** (starts with `eyJ...`)
   - **Service Role Key** (starts with `eyJ...`) - Keep this secret!

## 🚀 Step 2: Deploy to Netlify

### 2.1 Prepare Your Repository
1. Fork or clone this repository to your Git hosting service
2. Ensure all files are committed and pushed

### 2.2 Connect to Netlify
1. Go to [netlify.com](https://netlify.com) and sign up/login
2. Click "New site from Git"
3. Choose your Git provider (GitHub, GitLab, etc.)
4. Select your expense tracker repository
5. Configure build settings:
   - **Build command:** `cd frontend && pnpm install && pnpm run build`
   - **Publish directory:** `frontend/dist`
   - **Base directory:** (leave empty)

### 2.3 Set Environment Variables
1. In your Netlify site dashboard, go to Site settings → Environment variables
2. Add the following variables:

```
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
JWT_SECRET=your_random_jwt_secret_key
JWT_EXPIRES_IN=7d
NODE_ENV=production
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Important Notes:**
- Replace `your_supabase_project_url` with your actual Supabase URL
- Replace `your_supabase_anon_key` with your actual anon key
- Replace `your_supabase_service_role_key` with your actual service role key
- Generate a strong JWT secret (32+ random characters)

### 2.4 Deploy
1. Click "Deploy site"
2. Wait for the build to complete (5-10 minutes)
3. Your site will be available at a random Netlify URL

### 2.5 Custom Domain (Optional)
1. Go to Site settings → Domain management
2. Click "Add custom domain"
3. Follow the instructions to configure your DNS

## 🔧 Step 3: Configure Supabase Authentication (Optional)

If you want to enable additional authentication providers:

1. Go to Authentication → Settings in Supabase
2. Configure your site URL to match your Netlify domain
3. Set up additional providers if needed (Google, GitHub, etc.)

## 🧪 Step 4: Test Your Deployment

### 4.1 Access Your Application
1. Navigate to your Netlify URL
2. You should see the login page

### 4.2 Test Default Users
Try logging in with the default accounts:
- **Admin:** admin1@test.com / admin1
- **Account Officer:** officer1@test.com / officer1

### 4.3 Test Core Features
1. **Login/Logout:** Verify authentication works
2. **Add Expense:** Create a test expense
3. **Categories:** View and manage categories (Admin)
4. **Analytics:** Check charts and visualizations (Admin)
5. **CSV Export:** Download expense data

## 🔒 Step 5: Security Considerations

### 5.1 Change Default Passwords
**IMPORTANT:** Change the default user passwords immediately:
1. Login as admin
2. Go to Users tab
3. Update passwords for both default users
4. Or create new users and disable the defaults

### 5.2 Environment Variables
- Never commit environment variables to your repository
- Use strong, unique passwords and secrets
- Regularly rotate your JWT secret

### 5.3 Database Security
- Supabase RLS (Row Level Security) is enabled by default
- Review and customize RLS policies if needed
- Monitor database access logs

## 🐛 Troubleshooting

### Common Issues

#### Build Fails
- Check that all environment variables are set correctly
- Ensure your repository has the latest code
- Check Netlify build logs for specific errors

#### Authentication Not Working
- Verify Supabase URL and keys are correct
- Check that JWT_SECRET is set
- Ensure database schema was applied correctly

#### Functions Not Working
- Check that Netlify Functions are enabled
- Verify environment variables include backend secrets
- Check function logs in Netlify dashboard

#### Database Connection Issues
- Verify Supabase project is active
- Check that service role key has correct permissions
- Ensure database schema was applied successfully

### Getting Help
1. Check Netlify deploy logs for build errors
2. Check browser console for frontend errors
3. Check Netlify function logs for backend errors
4. Verify all environment variables are set correctly

## 📊 Step 6: Monitoring and Maintenance

### 6.1 Monitor Usage
- Check Netlify analytics for traffic
- Monitor Supabase dashboard for database usage
- Set up alerts for quota limits

### 6.2 Regular Maintenance
- Keep dependencies updated
- Monitor security advisories
- Backup your database regularly
- Review and update user permissions

### 6.3 Scaling Considerations
- Supabase free tier: 500MB database, 2GB bandwidth
- Netlify free tier: 100GB bandwidth, 300 build minutes
- Consider upgrading plans as usage grows

## 🎉 Congratulations!

Your Unique Expense Tracker is now deployed and ready to use. You have:
- ✅ A fully functional expense tracking application
- ✅ Secure authentication and authorization
- ✅ Data visualization and analytics
- ✅ CSV import/export capabilities
- ✅ Responsive design for all devices

## 📞 Support

If you encounter issues during deployment:
1. Check this guide for troubleshooting steps
2. Review the README.md for additional information
3. Check the official documentation for Supabase and Netlify

---

**Happy expense tracking! 💰📊**

