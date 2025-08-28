// Simple script to check if required database tables exist
// Run this with: node check-database-setup.js

const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

// Load environment variables from .env.local if it exists
const envPath = path.join(__dirname, '.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=')
    if (key && value) {
      process.env[key.trim()] = value.trim().replace(/^["']|["']$/g, '')
    }
  })
  console.log('📁 Loaded environment from .env.local')
}

// You'll need to set these environment variables or replace with your values
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkTables() {
  console.log('🔍 Checking database setup...\n')
  
  const tablesToCheck = [
    'analysis_cache',
    'resume_cache', 
    'cv_text_cache'
  ]
  
  for (const tableName of tablesToCheck) {
    try {
      // Try to query the table
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1)
      
      if (error) {
        if (error.message.includes('does not exist') || error.code === '42P01') {
          console.log(`❌ Table "${tableName}" does not exist`)
          console.log(`   Run this SQL in your Supabase dashboard:`)
          console.log(`   CREATE TABLE ${tableName} (...) -- See migration files\n`)
        } else {
          console.log(`⚠️  Table "${tableName}" exists but has an error:`, error.message)
        }
      } else {
        console.log(`✅ Table "${tableName}" exists and is accessible`)
      }
    } catch (err) {
      console.log(`❌ Error checking table "${tableName}":`, err.message)
    }
  }
  
  console.log('\n📋 Next steps:')
  console.log('1. If any tables are missing, run the SQL migrations in your Supabase dashboard')
  console.log('2. Migration files are in: database_migrations/')
  console.log('3. After creating tables, test the resume feature again')
}

checkTables().catch(console.error)
