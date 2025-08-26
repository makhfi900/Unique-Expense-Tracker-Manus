-- IMMEDIATE FIX: Restore Login Access
-- Run this in Supabase SQL Editor immediately

-- =====================================================
-- RESTORE DEMO ADMIN USER
-- =====================================================

-- Insert admin user into auth.users (Supabase auth table)
INSERT INTO auth.users (
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    confirmation_sent_at,
    confirmed_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at,
    phone,
    phone_confirmed_at,
    email_change,
    email_change_token_new,
    email_change_token_current,
    recovery_token,
    ott_token,
    email_change_confirm_status,
    banned_until,
    is_sso_user
) VALUES (
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'admin1@test.com',
    crypt('admin1', gen_salt('bf')),
    now(),
    now(),
    now(),
    now(),
    '{"provider": "email", "providers": ["email"]}',
    '{"role": "admin"}',
    false,
    now(),
    now(),
    null,
    null,
    '',
    '',
    '',
    '',
    '',
    0,
    null,
    false
) ON CONFLICT (email) DO NOTHING;

-- Insert admin user into public.users table
INSERT INTO users (
    id,
    email,
    full_name,
    role,
    is_active,
    created_at,
    updated_at
) VALUES (
    (SELECT id FROM auth.users WHERE email = 'admin1@test.com'),
    'admin1@test.com',
    'Admin User',
    'admin',
    true,
    now(),
    now()
) ON CONFLICT (email) DO NOTHING;

-- =====================================================
-- RESTORE DEMO ACCOUNT OFFICER USER  
-- =====================================================

-- Insert officer user into auth.users
INSERT INTO auth.users (
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    confirmation_sent_at,
    confirmed_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at,
    phone,
    phone_confirmed_at,
    email_change,
    email_change_token_new,
    email_change_token_current,
    recovery_token,
    ott_token,
    email_change_confirm_status,
    banned_until,
    is_sso_user
) VALUES (
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'officer1@test.com',
    crypt('officer1', gen_salt('bf')),
    now(),
    now(),
    now(),
    now(),
    '{"provider": "email", "providers": ["email"]}',
    '{"role": "account_officer"}',
    false,
    now(),
    now(),
    null,
    null,
    '',
    '',
    '',
    '',
    '',
    0,
    null,
    false
) ON CONFLICT (email) DO NOTHING;

-- Insert officer user into public.users table
INSERT INTO users (
    id,
    email,
    full_name,
    role,
    is_active,
    created_at,
    updated_at
) VALUES (
    (SELECT id FROM auth.users WHERE email = 'officer1@test.com'),
    'officer1@test.com',
    'Account Officer',
    'account_officer',
    true,
    now(),
    now()
) ON CONFLICT (email) DO NOTHING;

-- =====================================================
-- VERIFY RESTORATION
-- =====================================================

-- Check that users were restored
SELECT 
    u.email,
    u.full_name,
    u.role,
    u.is_active,
    'restored' as status
FROM users u
WHERE u.email IN ('admin1@test.com', 'officer1@test.com');

-- Verify auth users exist
SELECT 
    email,
    email_confirmed_at IS NOT NULL as email_confirmed,
    'restored' as auth_status
FROM auth.users 
WHERE email IN ('admin1@test.com', 'officer1@test.com');

-- =====================================================
-- ALTERNATIVE: CREATE NEW ADMIN USER (If above fails)
-- =====================================================

-- If the above doesn't work, you can create a new admin user:
-- Go to Supabase Dashboard > Authentication > Users > Invite User
-- Email: your-email@domain.com
-- Then run this to make them admin:

/*
UPDATE users 
SET role = 'admin', is_active = true
WHERE email = 'your-email@domain.com';
*/