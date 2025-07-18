// Script to apply Supabase Auth database schema
// This script applies the database schema to integrate with Supabase Auth

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
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

async function applySchema() {
  console.log('🚀 Applying Supabase Auth database schema...\n')

  try {
    // Read the schema file
    const schemaPath = path.join(__dirname, '..', 'database', 'supabase_auth_schema.sql')
    
    if (!fs.existsSync(schemaPath)) {
      console.error('❌ Schema file not found:', schemaPath)
      process.exit(1)
    }

    const schema = fs.readFileSync(schemaPath, 'utf8')
    console.log('📖 Schema file loaded successfully')
    console.log(`📄 Schema size: ${Math.round(schema.length / 1024)}KB`)

    // Split the schema into individual statements
    // Remove comments and empty lines, then split by semicolon
    const statements = schema
      .split('\n')
      .filter(line => !line.trim().startsWith('--') && line.trim().length > 0)
      .join('\n')
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0)

    console.log(`🔨 Found ${statements.length} SQL statements to execute\n`)

    // Execute each statement
    let successCount = 0
    let errorCount = 0

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      
      // Skip empty statements
      if (!statement.trim()) continue

      // Get a brief description of the statement for logging
      const firstLine = statement.split('\n')[0].trim()
      const description = firstLine.length > 50 ? firstLine.substring(0, 50) + '...' : firstLine

      try {
        console.log(`${i + 1}/${statements.length}: ${description}`)
        
        const { error } = await supabase.rpc('exec_sql', { sql: statement })
        
        if (error) {
          // Try direct query execution if RPC fails
          const { error: directError } = await supabase.from('_').select().limit(0)
          
          if (directError || error.message.includes('function exec_sql')) {
            // Use raw SQL execution
            const { error: sqlError } = await supabase.postgrest.query(statement)
            
            if (sqlError) {
              console.error(`❌ Error: ${sqlError.message}`)
              errorCount++
            } else {
              console.log('✅ Success')
              successCount++
            }
          } else {
            console.error(`❌ Error: ${error.message}`)
            errorCount++
          }
        } else {
          console.log('✅ Success')
          successCount++
        }
      } catch (err) {
        console.error(`❌ Unexpected error: ${err.message}`)
        errorCount++
      }
    }

    console.log(`\n📊 Schema application complete:`)
    console.log(`✅ Successful statements: ${successCount}`)
    console.log(`❌ Failed statements: ${errorCount}`)

    if (errorCount === 0) {
      console.log('\n🎉 Database schema applied successfully!')
      console.log('\n📋 Next steps:')
      console.log('1. Create demo users: node scripts/create-demo-users.js setup')
      console.log('2. Start the application: npm run dev:full')
      console.log('3. Test the authentication with demo accounts')
    } else {
      console.log('\n⚠️  Some statements failed. Check the errors above.')
      console.log('You may need to apply the schema manually via Supabase Dashboard.')
    }

  } catch (error) {
    console.error('❌ Fatal error applying schema:', error.message)
    process.exit(1)
  }
}

async function checkConnection() {
  console.log('🔍 Testing Supabase connection...')
  
  try {
    const { data, error } = await supabase.from('_').select().limit(1)
    
    if (error && !error.message.includes('does not exist')) {
      console.error('❌ Connection failed:', error.message)
      return false
    }
    
    console.log('✅ Supabase connection successful\n')
    return true
  } catch (error) {
    console.error('❌ Connection test failed:', error.message)
    return false
  }
}

async function main() {
  const command = process.argv[2]
  
  switch (command) {
    case 'apply':
      if (await checkConnection()) {
        await applySchema()
      }
      break
    case 'test':
      await checkConnection()
      break
    default:
      console.log('📖 Usage:')
      console.log('  node scripts/apply-supabase-schema.js apply   - Apply the database schema')
      console.log('  node scripts/apply-supabase-schema.js test    - Test database connection')
      console.log('\n💡 Note: This script requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env')
      break
  }
  
  process.exit(0)
}

main().catch(console.error)