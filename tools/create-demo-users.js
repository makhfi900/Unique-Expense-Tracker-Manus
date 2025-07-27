// Script to create demo users in Supabase Auth
// This script creates the admin and account officer demo users

const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Please ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env')
  process.exit(1)
}

// Create Supabase client with service role key (for admin operations)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createDemoUsers() {
  console.log('🚀 Creating demo users in Supabase Auth...\n')

  const demoUsers = [
    {
      email: 'admin1@test.com',
      password: 'admin1',
      user_metadata: {
        full_name: 'System Administrator',
        role: 'admin'
      }
    },
    {
      email: 'officer1@test.com',
      password: 'officer1',
      user_metadata: {
        full_name: 'Account Officer',
        role: 'account_officer'
      }
    }
  ]

  for (const userData of demoUsers) {
    try {
      console.log(`Creating user: ${userData.email}`)

      // Create user with admin privileges
      const { data, error } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        user_metadata: userData.user_metadata,
        email_confirm: true // Skip email confirmation for demo users
      })

      if (error) {
        if (error.message.includes('already registered')) {
          console.log(`⚠️  User ${userData.email} already exists, skipping...`)
        } else {
          console.error(`❌ Error creating ${userData.email}:`, error.message)
        }
      } else {
        console.log(`✅ Successfully created user: ${userData.email}`)
        console.log(`   User ID: ${data.user.id}`)
        console.log(`   Role: ${userData.user_metadata.role}`)
      }
    } catch (error) {
      console.error(`❌ Unexpected error creating ${userData.email}:`, error.message)
    }

    console.log() // Empty line for readability
  }

  console.log('🎉 Demo user creation process complete!')
  console.log('\n📋 Demo Login Credentials:')
  console.log('┌─────────────────────────────────────────────────────────┐')
  console.log('│ Admin User:                                             │')
  console.log('│   Email: admin1@test.com                     │')
  console.log('│   Password: admin1                           │')
  console.log('│   Role: admin                                          │')
  console.log('├─────────────────────────────────────────────────────────┤')
  console.log('│ Account Officer:                                        │')
  console.log('│   Email: officer1@test.com                   │')
  console.log('│   Password: officer1                         │')
  console.log('│   Role: account_officer                                │')
  console.log('└─────────────────────────────────────────────────────────┘')
}

async function listUsers() {
  console.log('\n🔍 Listing existing users in Supabase Auth...\n')

  try {
    const { data, error } = await supabase.auth.admin.listUsers()

    if (error) {
      console.error('❌ Error listing users:', error.message)
      return
    }

    if (data.users.length === 0) {
      console.log('No users found in Supabase Auth')
      return
    }

    console.log(`Found ${data.users.length} users:`)
    data.users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`)
      console.log(`   ID: ${user.id}`)
      console.log(`   Created: ${new Date(user.created_at).toLocaleString()}`)
      console.log(`   Metadata: ${JSON.stringify(user.user_metadata, null, 2)}`)
      console.log()
    })
  } catch (error) {
    console.error('❌ Unexpected error listing users:', error.message)
  }
}

async function main() {
  const command = process.argv[2]

  switch (command) {
    case 'create':
      await createDemoUsers()
      break
    case 'list':
      await listUsers()
      break
    case 'setup':
      await createDemoUsers()
      await listUsers()
      break
    default:
      console.log('📖 Usage:')
      console.log('  node scripts/create-demo-users.js create   - Create demo users')
      console.log('  node scripts/create-demo-users.js list     - List existing users')
      console.log('  node scripts/create-demo-users.js setup    - Create users and list all')
      break
  }

  process.exit(0)
}

main().catch(console.error)